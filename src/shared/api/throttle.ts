const MIN_INTERVAL_MS = 800;
let lastRequestAt = 0;
let inFlight = 0;
const MAX_CONCURRENT = 2;

export async function withThrottle<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT) {
    throw new Error('Too many requests. Please wait a moment.');
  }

  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }

  inFlight += 1;
  lastRequestAt = Date.now();
  try {
    return await fn();
  } finally {
    inFlight -= 1;
  }
}
