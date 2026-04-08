"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { forceLogout } from "@/utils/forceLogout";

/**
 * Listen for NextAuth broadcast signout events.
 * When NextAuth's session expires or signs out, perform a full logout
 * (revoke backend token, clear cookies, redirect to /login).
 */
function useNextAuthSessionSync() {
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== "nextauth.message") return;

      try {
        const message = JSON.parse(event.newValue || "{}");
        if (message?.event === "session" && message?.data?.trigger === "signout") {
          const hasToken = getCookie(ULTRASOOQ_TOKEN_KEY);
          if (hasToken) {
            // NextAuth signed out but custom tokens still exist — full logout
            forceLogout();
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
}

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  useNextAuthSessionSync();

  return (
    <SessionProvider
      refetchInterval={55 * 60} // Refetch session every 55 min (before 1h JWT expiry)
      refetchOnWindowFocus={true} // Re-check session when user returns to tab
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
};

export default SessionWrapper;
