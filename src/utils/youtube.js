export function getYouTubeVideoId(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (!host.endsWith("youtube.com")) {
      return null;
    }

    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v");
    }

    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.split("/")[2] || null;
    }

    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/")[2] || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isYouTubeWatchUrl(url) {
  return Boolean(getYouTubeVideoId(url));
}

export function formatTimestamp(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function buildYouTubeTimestampUrl(videoUrl, startMs) {
  if (!videoUrl) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((startMs || 0) / 1000));
  try {
    const parsed = new URL(videoUrl);
    parsed.searchParams.set("t", `${seconds}s`);
    return parsed.toString();
  } catch {
    return videoUrl;
  }
}
