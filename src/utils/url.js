import { UNSUPPORTED_URL_PREFIXES } from "./constants.js";

export function isUnsupportedUrl(url) {
  if (!url) {
    return true;
  }
  const lower = url.toLowerCase();
  return UNSUPPORTED_URL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || "";
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

export function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

export function estimateReadingMinutes(wordCount) {
  return Math.max(1, Math.round(wordCount / 225));
}
