/**
 * UUID v7 generator — timestamp-sortable, monotonic within the same millisecond.
 * Used as requestId to correlate frontend + backend events in the same timeline.
 */

let lastMs = 0;
let seq = 0;

export function generateRequestId(): string {
  const now = Date.now();

  // Monotonic sequence: increment if multiple IDs generated in same ms
  if (now === lastMs) {
    seq = (seq + 1) & 0xfff;
  } else {
    lastMs = now;
    seq = Math.floor(Math.random() * 0x1000);
  }

  // Encode: 48 bits timestamp + 4 bits version (7) + 12 bits seq + 62 bits random
  const hi = now;
  const mid = ((0x7000 | seq) >>> 0).toString(16).padStart(4, '0');
  const rand1 = (0x8000 | (Math.floor(Math.random() * 0x3fff))).toString(16).padStart(4, '0');
  const rand2 = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0');

  const ts = hi.toString(16).padStart(12, '0');

  return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-${mid}-${rand1}-${rand2}`;
}
