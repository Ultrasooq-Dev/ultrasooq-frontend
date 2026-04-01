"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ChatWindow from "./ChatWindow";
import { MessageCircle, X } from "lucide-react";

/**
 * ChatWidget — Floating support bubble on all pages.
 * Renders a circle button at bottom-right. Click opens the chat window.
 * Always visible. Unread badge shows when bot/admin replied.
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { me } = useAuth();

  // Don't render on login/register pages
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hide = ["/login", "/register", "/forgot-password", "/otp"].some(
        (p) => path.includes(p)
      );
      setShow(!hide);
    }
  }, []);

  if (!show) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          onUnreadChange={setUnreadCount}
          user={me?.data?.data ?? me?.data ?? null}
        />
      )}

      {/* Floating Bubble */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        aria-label="Support Chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
