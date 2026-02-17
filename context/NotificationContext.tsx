"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { Notification, NotificationType } from "@/utils/types/notification.types";
import { useUnreadCount, useNotifications } from "@/apis/queries/notifications.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  newNotification: Notification | null;
  clearNewNotification: () => void;
  refreshNotifications: () => void;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { toast } = useToast();
  const t = useTranslations();
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useNotifications(
    { page: 1, limit: 10 },
    !!user?.id && connected,
  );

  // Fetch unread count
  const {
    data: unreadCountData,
    isLoading: unreadCountLoading,
    refetch: refetchUnreadCount,
  } = useUnreadCount(!!user?.id && connected);

  // Ensure notifications is always an array
  const notifications = Array.isArray(notificationsData?.data) 
    ? notificationsData.data 
    : [];
  const unreadCount = unreadCountData?.count || 0;
  const isLoading = notificationsLoading || unreadCountLoading;

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket || !connected || !user?.id) return;

    const handleNewNotification = (notification: Notification) => {
      setNewNotification(notification);
      
      // Show toast for important notifications
      if (
        notification.type === NotificationType.ORDER ||
        notification.type === NotificationType.MESSAGE ||
        notification.type === NotificationType.RFQ
      ) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === NotificationType.ORDER ? "success" : "info",
        });
      }

      // Refresh notifications and unread count
      refetchNotifications();
      refetchUnreadCount();
    };

    const handleNotificationCountUpdate = (count: number) => {
      refetchUnreadCount();
    };

    socket.on("notification", handleNewNotification);
    socket.on("notification:count", handleNotificationCountUpdate);

    return () => {
      socket.off("notification", handleNewNotification);
      socket.off("notification:count", handleNotificationCountUpdate);
    };
  }, [socket, connected, user?.id, toast, refetchNotifications, refetchUnreadCount]);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  const refreshNotifications = useCallback(() => {
    refetchNotifications();
  }, [refetchNotifications]);

  const refreshUnreadCount = useCallback(() => {
    refetchUnreadCount();
  }, [refetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        newNotification,
        clearNewNotification,
        refreshNotifications,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationsContext must be used within a NotificationProvider",
    );
  }
  return context;
};

