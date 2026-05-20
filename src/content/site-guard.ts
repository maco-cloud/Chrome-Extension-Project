import type { AppSettings } from '../shared/types';

const BLOCKED_HOSTS = [
  'chrome.google.com',
  'chromewebstore.google.com',
  'accounts.google.com',
];

export function isHostAllowed(host: string, settings: AppSettings): boolean {
  if (BLOCKED_HOSTS.some((h) => host.includes(h))) return false;

  const entries = Object.entries(settings.enabledSites);
  for (const [pattern, enabled] of entries) {
    if (!enabled) continue;
    if (pattern === '*') return true;
    if (host === pattern || host.endsWith(`.${pattern}`)) return true;
  }

  return settings.enabledSites['*'] ?? true;
}
