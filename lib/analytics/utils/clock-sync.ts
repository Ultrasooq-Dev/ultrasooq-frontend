/**
 * NTP-style clock sync with the backend.
 * Gets server time once per session, calculates offset.
 * All events attach clockOffset so backend can reconstruct accurate timeline.
 */

let clockOffsetMs = 0;
let synced = false;

export async function syncClock(apiBase: string): Promise<void> {
  if (synced || typeof window === 'undefined') return;

  try {
    const t0 = Date.now();
    const res = await fetch(`${apiBase}/analytics/time`, { method: 'GET' });
    const t1 = Date.now();

    if (!res.ok) return;

    const { serverTime } = await res.json();
    const roundTripHalf = (t1 - t0) / 2;
    clockOffsetMs = serverTime - (t0 + roundTripHalf);
    synced = true;
  } catch {
    // Non-fatal — clock sync failure doesn't break analytics
  }
}

export function getClockOffset(): number {
  return Math.round(clockOffsetMs);
}
