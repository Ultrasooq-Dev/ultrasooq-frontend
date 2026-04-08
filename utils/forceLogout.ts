import { deleteCookie, getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY, ULTRASOOQ_REFRESH_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";

/**
 * Full logout: revoke refresh token on backend, clear all auth cookies,
 * sign out NextAuth, then redirect to /login.
 *
 * Used whenever the session is lost (401, NextAuth signout, etc.).
 */
export async function forceLogout() {
  if (typeof window === "undefined") return;

  // 1. Revoke refresh token on the backend (best-effort)
  const refreshToken = getCookie(ULTRASOOQ_REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      await fetch(`${getApiUrl()}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort — continue with client-side cleanup
    }
  }

  // 2. Clear auth cookies
  deleteCookie(ULTRASOOQ_TOKEN_KEY);
  deleteCookie(ULTRASOOQ_REFRESH_TOKEN_KEY);

  // 3. Sign out NextAuth (non-blocking, best-effort)
  try {
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false });
  } catch {
    // NextAuth may not be initialized — continue
  }

  // 4. Redirect to login
  window.location.href = "/login";
}
