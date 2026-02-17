"use client";

import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationsContext } from "@/context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount, newNotification } = useNotificationsContext();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Handle new notification animation
  useEffect(() => {
    if (newNotification) {
      setHasNewNotification(true);
      // Reset animation after 3 seconds
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newNotification]);

  // Don't show if user is not logged in
  if (!user?.id) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-all active:scale-95"
          aria-label="Notifications"
        >
          <svg
            className={cn(
              "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-all text-white",
              hasNewNotification && "animate-bounce",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <div className="bg-red-500 absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={10}
      >
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

