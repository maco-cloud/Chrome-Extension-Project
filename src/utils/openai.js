import {
  API_TIMEOUT_MS,
  MAX_RETRIES,
  OPENAI_API_URL,
  OPENAI_MODEL,
} from "./constants.js";

const SYSTEM_PROMPT = `You are QuickDigest AI, an expert at distilling web articles into clear, actionable briefs.
Respond ONLY with valid JSON (no markdown fences) using this exact schema:
{
  "summary": "string (2-4 concise sentences)",
  "takeaways": ["string", "..."],
  "actionItems": ["string", "..."],
  "readingTimeMinutes": number
}
Rules:
- summary: neutral, factual, no fluff
- takeaways: 3-6 bullet insights
- actionItems: 2-5 practical next steps (use "None needed" only if truly none)
- readingTimeMinutes: integer estimate for the original article at ~225 wpm
- Never invent facts not supported by the text`;

function buildUserPrompt(payload) {
  return `Page title: ${payload.title}
URL: ${payload.url}
Estimated reading time from word count: ${payload.readingTimeMinutes} min
Character count: ${payload.characterCount}

Article content:
"""
${payload.text}
"""`;
}

function parseModelJson(content) {
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    : trimmed;

  const parsed = JSON.parse(jsonText);

  if (!parsed.summary || typeof parsed.summary !== "string") {
    throw new Error("Invalid AI response: missing summary.");
  }

  return {
    summary: parsed.summary.trim(),
    takeaways: normalizeList(parsed.takeaways, 6),
    actionItems: normalizeList(parsed.actionItems, 5),
    readingTimeMinutes: clampReadingTime(parsed.readingTimeMinutes),
  };
}

function normalizeList(value, maxItems) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function clampReadingTime(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    return 1;
  }
  return Math.min(Math.round(num), 999);
}

function mapOpenAIError(status, bodyText) {
  let message = "OpenAI request failed.";
  try {
    const data = JSON.parse(bodyText);
    message = data?.error?.message || message;
  } catch {
    if (bodyText) {
      message = bodyText.slice(0, 200);
    }
  }

  if (status === 401) {
    return new Error("Invalid OpenAI API key. Check Settings and try again.");
  }
  if (status === 429) {
    return new Error("OpenAI rate limit reached. Please wait and retry.");
  }
  if (status >= 500) {
    return new Error("OpenAI service is temporarily unavailable. Try again soon.");
  }
  return new Error(message);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and retry.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function summarizeWithOpenAI(apiKey, payload) {
  if (!apiKey?.trim()) {
    throw new Error("OpenAI API key is missing. Add your key in Settings.");
  }

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        OPENAI_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: buildUserPrompt(payload) },
            ],
          }),
        },
        API_TIMEOUT_MS,
      );

      const bodyText = await response.text();

      if (!response.ok) {
        const err = mapOpenAIError(response.status, bodyText);
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          lastError = err;
          continue;
        }
        throw err;
      }

      const data = JSON.parse(bodyText);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned an empty response.");
      }

      return parseModelJson(content);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && shouldRetry(error)) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Summarization failed.");
}

function shouldRetry(error) {
  const message = String(error?.message || "");
  return (
    message.includes("rate limit") ||
    message.includes("temporarily unavailable") ||
    message.includes("timed out")
  );
}
