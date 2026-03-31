/**
 * Device ID — persisted to localStorage.
 * Survives tab close, identifies the same browser across sessions.
 */

const DEVICE_KEY = 'us_did';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';

  let did = localStorage.getItem(DEVICE_KEY);
  if (!did) {
    did = `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_KEY, did);
  }
  return did;
}
