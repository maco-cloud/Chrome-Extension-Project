import type { GenerateRequest, GenerateResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface AiClientOptions {
  getAuthToken: () => Promise<string | null>;
}

/**
 * Provider-agnostic AI client. All requests go to OUR backend — never to OpenAI/etc. directly.
 */
export class AiClient {
  constructor(private options: AiClientOptions) {}

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const token = await this.options.getAuthToken();

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          return (await res.json()) as GenerateResponse;
        }

        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Try again in a moment.');
        }
        if (res.status === 402) {
          throw new Error('Premium required for this request.');
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        if (API_BASE && !(e instanceof TypeError)) {
          throw e;
        }
      }
    }

    return mockGenerate(request);
  }
}

function mockGenerate(request: GenerateRequest): GenerateResponse {
  const { tone, context, draft, customPrompt } = request;
  const snippet = (draft || context || 'your message').slice(0, 120).trim();
  const styleHint = customPrompt ? ` (${customPrompt})` : '';
  const templates: Record<string, string> = {
    professional: `Thank you for sharing that. Based on what you wrote, I'd suggest: "${snippet}"${styleHint} — let me know if you'd like to adjust the timeline or scope.`,
    friendly: `Hey! Thanks for the note 😊 I was thinking: "${snippet}"${styleHint} — does that work for you?`,
    concise: `Got it. Short version: "${snippet}"${styleHint} — confirm?`,
    confident: `Here's my take: "${snippet}"${styleHint} — I'm confident this moves us forward.`,
    funny: `Plot twist: "${snippet}"${styleHint} 😄 But seriously, let me know what you think!`,
    flirty: `Okay but hear me out… "${snippet}"${styleHint} ✨ What do you think?`,
    rewrite: rewriteText(snippet),
    grammar: fixGrammar(snippet),
  };

  const base = templates[tone] ?? templates.professional;
  const maxLen = request.maxTokens ? Math.min(request.maxTokens * 4, 2000) : 2000;

  return {
    text: base.slice(0, maxLen),
    tone,
    cached: true,
  };
}

function rewriteText(text: string): string {
  return text
    .replace(/\bi\b/g, 'I')
    .replace(/\bim\b/gi, "I'm")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bdont\b/gi, "don't")
    .replace(/\s+/g, ' ')
    .trim();
}

function fixGrammar(text: string): string {
  const fixed = rewriteText(text);
  if (!fixed.endsWith('.') && !fixed.endsWith('!') && !fixed.endsWith('?')) {
    return `${fixed}.`;
  }
  return fixed;
}
