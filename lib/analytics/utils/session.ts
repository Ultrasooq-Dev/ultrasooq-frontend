/**
 * Session ID — scoped to browser tab (sessionStorage).
 * New tab or browser close = new session.
 */

const SESSION_KEY = 'us_sid';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';

  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}
