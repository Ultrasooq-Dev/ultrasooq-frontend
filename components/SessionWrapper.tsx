"use client";
import { SessionProvider } from "next-auth/react";

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
};

export default SessionWrapper;
