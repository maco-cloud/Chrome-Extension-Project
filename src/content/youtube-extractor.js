if (globalThis.__QD_YT_EXTRACT_PROMISE__) {
  return globalThis.__QD_YT_EXTRACT_PROMISE__;
}

globalThis.__QD_YT_EXTRACT_PROMISE__ = (async () => {
  const MIN_TRANSCRIPT_CHARS = 80;

  function normalize(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function getVideoId() {
    try {
      const parsed = new URL(location.href);
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  function getPlayerResponse() {
    if (window.ytInitialPlayerResponse?.videoDetails) {
      return window.ytInitialPlayerResponse;
    }

    const player = document.getElementById("movie_player");
    const embedded =
      player?.getVideoData?.() ||
      window.ytplayer?.config?.args?.player_response ||
      window.ytplayer?.config?.args;

    if (embedded?.videoDetails) {
      return embedded;
    }

    if (typeof embedded === "string") {
      try {
        return JSON.parse(embedded);
      } catch {
        return null;
      }
    }

    return null;
  }

  function waitForPlayerResponse(timeoutMs = 6000) {
    const existing = getPlayerResponse();
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const response = getPlayerResponse();
        if (response) {
          clearInterval(timer);
          resolve(response);
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(timer);
          reject(new Error("PLAYER_RESPONSE_TIMEOUT"));
        }
      }, 300);
    });
  }

  function pickCaptionTrack(playerResponse) {
    const tracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) {
      return null;
    }

    const manualEnglish = tracks.find(
      (track) =>
        track.languageCode?.startsWith("en") && track.kind !== "asr",
    );
    if (manualEnglish) {
      return manualEnglish;
    }

    const autoEnglish = tracks.find((track) =>
      track.languageCode?.startsWith("en"),
    );
    if (autoEnglish) {
      return autoEnglish;
    }

    return tracks[0];
  }

  function parseJson3Captions(raw) {
    const payload = JSON.parse(raw);
    const segments = [];
    const parts = [];

    for (const event of payload.events || []) {
      const text = (event.segs || [])
        .map((segment) => segment.utf8 || "")
        .join("")
        .replace(/\n/g, " ")
        .trim();

      if (!text) {
        continue;
      }

      segments.push({
        startMs: event.tStartMs || 0,
        durationMs: event.dDurationMs || 0,
        text,
      });
      parts.push(text);
    }

    return {
      segments,
      text: parts.join(" "),
    };
  }

  function parseXmlCaptions(raw) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/xml");
    const nodes = [...doc.querySelectorAll("text")];
    const segments = [];
    const parts = [];

    nodes.forEach((node) => {
      const text = normalize(node.textContent);
      if (!text) {
        return;
      }

      const startMs = Math.round(Number(node.getAttribute("start") || 0) * 1000);
      const durationMs = Math.round(Number(node.getAttribute("dur") || 0) * 1000);
      segments.push({ startMs, durationMs, text });
      parts.push(text);
    });

    return {
      segments,
      text: parts.join(" "),
    };
  }

  async function fetchCaptionTrack(baseUrl) {
    const jsonUrl = baseUrl.includes("?")
      ? `${baseUrl}&fmt=json3`
      : `${baseUrl}?fmt=json3`;

    const jsonResponse = await fetch(jsonUrl, { credentials: "include" });
    if (jsonResponse.ok) {
      const raw = await jsonResponse.text();
      if (raw.trim()) {
        return parseJson3Captions(raw);
      }
    }

    const xmlResponse = await fetch(baseUrl, { credentials: "include" });
    if (!xmlResponse.ok) {
      throw new Error("CAPTION_FETCH_FAILED");
    }

    const xmlRaw = await xmlResponse.text();
    return parseXmlCaptions(xmlRaw);
  }

  function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  try {
    const videoId = getVideoId();
    if (!videoId) {
      return {
        ok: false,
        error: "NOT_YOUTUBE_WATCH",
        message: "Open a YouTube watch page to summarize a video.",
      };
    }

    const playerResponse = await waitForPlayerResponse();
    const track = pickCaptionTrack(playerResponse);
    if (!track?.baseUrl) {
      return {
        ok: false,
        error: "NO_CAPTIONS",
        message:
          "No transcript is available for this video. Try a video with captions or subtitles enabled.",
      };
    }

    const transcript = await fetchCaptionTrack(track.baseUrl);
    const text = normalize(transcript.text);

    if (!text || text.length < MIN_TRANSCRIPT_CHARS) {
      return {
        ok: false,
        error: "TRANSCRIPT_TOO_SHORT",
        message:
          "The transcript is too short to summarize. Try a longer video with captions.",
      };
    }

    const title =
      playerResponse?.videoDetails?.title ||
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string")
        ?.textContent ||
      document.title ||
      "YouTube video";

    const wordCount = countWords(text);

    return {
      ok: true,
      title: normalize(title),
      url: location.href,
      text,
      segments: transcript.segments,
      videoId,
      sourceType: "youtube",
      wordCount,
      characterCount: text.length,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 225)),
      language: (track.languageCode || "en").split("-")[0],
      captionKind: track.kind || "manual",
    };
  } catch (error) {
    const code = error?.message || "UNKNOWN";

    if (code === "PLAYER_RESPONSE_TIMEOUT") {
      return {
        ok: false,
        error: "PLAYER_NOT_READY",
        message:
          "YouTube is still loading this video. Wait a moment and try again.",
      };
    }

    if (code === "CAPTION_FETCH_FAILED") {
      return {
        ok: false,
        error: "CAPTION_FETCH_FAILED",
        message:
          "Could not download the transcript for this video. Captions may be restricted.",
      };
    }

    return {
      ok: false,
      error: "EXTRACTION_FAILED",
      message: "Could not extract a YouTube transcript on this page.",
    };
  }
})().finally(() => {
  globalThis.__QD_YT_EXTRACT_PROMISE__ = null;
});

return globalThis.__QD_YT_EXTRACT_PROMISE__;
