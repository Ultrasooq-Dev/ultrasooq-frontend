"use client";

import React, { useState } from "react";
import { useNotifications } from "@/apis/queries/notifications.queries";
import { useMarkAllAsRead, useDeleteNotification } from "@/apis/queries/notifications.queries";
import { useNotificationsContext } from "@/context/NotificationContext";
import NotificationItem from "@/components/shared/NotificationItem";
import { NotificationType } from "@/utils/types/notification.types";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NotificationsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { refreshNotifications } = useNotificationsContext();
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const limit = 20;

  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotifications(
    {
      page,
      limit,
      type: filterType !== "all" ? filterType : undefined,
      read: filterRead !== "all" ? filterRead === "read" : undefined,
    },
    true,
  );

  const notifications = notificationsData?.data || [];
  const total = notificationsData?.total || 0;
  const unreadCount = notificationsData?.unreadCount || 0;
  const totalPages = Math.ceil(total / limit);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      refreshNotifications();
      refetch();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
      refetch();
      refreshNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" dir={langDir}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("notifications") || "Notifications"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} ${t("unread_notifications") || "unread notifications"}`
              : t("all_caught_up") || "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            {t("mark_all_as_read") || "Mark all as read"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filter_by_type") || "Filter by type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_types") || "All Types"}</SelectItem>
            <SelectItem value={NotificationType.ORDER}>
              {t("orders") || "Orders"}
            </SelectItem>
            <SelectItem value={NotificationType.MESSAGE}>
              {t("messages") || "Messages"}
            </SelectItem>
            <SelectItem value={NotificationType.RFQ}>
              {t("rfq") || "RFQ"}
            </SelectItem>
            <SelectItem value={NotificationType.REVIEW}>
              {t("reviews") || "Reviews"}
            </SelectItem>
            <SelectItem value={NotificationType.SYSTEM}>
              {t("system") || "System"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filter_by_status") || "Filter by status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all") || "All"}</SelectItem>
            <SelectItem value="unread">
              {t("unread") || "Unread"}
            </SelectItem>
            <SelectItem value="read">{t("read") || "Read"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border p-4">
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
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
            <h3 className="text-lg font-semibold text-foreground">
              {t("no_notifications_found") || "No notifications found"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("no_notifications_match_filters") ||
                "No notifications match your current filters"}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={() => {
                      refetch();
                      refreshNotifications();
                    }}
                  />
                </div>
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={t("delete") || "Delete"}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t("previous") || "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("page") || "Page"} {page} {t("of") || "of"} {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t("next") || "Next"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

