"use client";

import React, { useState } from "react";
import { useNotifications } from "@/apis/queries/notifications.queries";
import { useMarkAllAsRead } from "@/apis/queries/notifications.queries";
import { useNotificationsContext } from "@/context/NotificationContext";
import NotificationItem from "./NotificationItem";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationDropdownProps {
  onClose?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { langDir } = useAuth();
  const { unreadCount, refreshNotifications } = useNotificationsContext();
  const markAllAsRead = useMarkAllAsRead();

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotifications({ page: 1, limit: 10 }, true);

  // Ensure notifications is always an array
  const notifications = Array.isArray(notificationsData?.data) 
    ? notificationsData.data 
    : [];
  const hasMore = (notificationsData?.total || 0) > notifications.length;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      refreshNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleViewAll = () => {
    router.push("/notifications");
    onClose?.();
  };

  return (
    <div className="flex h-[500px] w-[380px] flex-col bg-card shadow-xl" dir={langDir}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-lg font-semibold text-foreground">
          {t("notifications") || "Notifications"}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-primary hover:text-primary"
            >
              {t("mark_all_as_read") || "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
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
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("no_notifications") || "No notifications"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("you_are_all_caught_up") || "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => {
                  refetch();
                  refreshNotifications();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={handleViewAll}
            className="w-full rounded-lg bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {t("view_all_notifications") || "View all notifications"}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

