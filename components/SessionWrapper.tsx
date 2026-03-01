"use client";
import { SessionProvider } from "next-auth/react";

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
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
