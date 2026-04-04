"use client";
import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useMessageStore } from "@/lib/messageStore";
import MessagingHub from "./MessagingHub";
import { MessageCircle, X } from "lucide-react";
import { track } from "@/lib/analytics";

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hubUnreadCount, setHubUnreadCount] = useState(0);
  const { user, selectedLocale } = useAuth();
  const { data: currentAccountData } = useCurrentAccount();

  const tradeRole =
    currentAccountData?.data?.account?.tradeRole ||
    (user as any)?.tradeRole ||
    "BUYER";
  const locale = selectedLocale || "en";

  // Read total unread from messaging store (works even when hub is closed)
  const { channelCounts } = useMessageStore();
  const storeUnread = useMemo(() => {
    return channelCounts.reduce((sum, c) => c.id === "unread" ? sum : sum + c.count, 0);
  }, [channelCounts]);

  // Use whichever is higher — store count or hub-reported count
  const unreadCount = Math.max(storeUnread, hubUnreadCount);

  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hide = ["/login", "/register", "/forgot-password", "/otp"].some(
        (p) => path.includes(p)
      );
      setShow(!hide);
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <>
      {isOpen && (
        <MessagingHub
          onClose={() => setIsOpen(false)}
          onUnreadChange={setHubUnreadCount}
          user={{ ...user, tradeRole }}
          locale={locale}
        />
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((o) => {
            track(o ? "support_widget_closed" : "support_widget_opened");
            return !o;
          });
        }}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        aria-label="Messages"
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
