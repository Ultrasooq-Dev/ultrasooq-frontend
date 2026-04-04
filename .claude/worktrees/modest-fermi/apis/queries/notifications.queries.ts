import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  FetchNotificationsPayload,
} from "../requests/notifications.requests";
import { APIResponseError } from "@/utils/types/common.types";
import {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@/utils/types/notification.types";

export const useNotifications = (
  payload: FetchNotificationsPayload = {},
  enabled = true,
) => {
  return useQuery<NotificationListResponse, APIResponseError>({
    queryKey: ["notifications", payload],
    queryFn: async () => {
      const res = await fetchNotifications(payload);
      // Backend returns: { status, message, data: { data: [...], total, ... } }
      // We need to extract the inner data object
      return res.data?.data || { data: [], total: 0, page: 1, limit: 10, unreadCount: 0 };
    },
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });
};

export const useUnreadCount = (enabled = true) => {
  return useQuery<NotificationUnreadCountResponse, APIResponseError>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetchUnreadCount();
      // Backend returns: { status, message, data: { count } }
      return res.data?.data || { count: 0 };
    },
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<Notification, APIResponseError, number>({
    mutationFn: async (notificationId: number) => {
      const res = await markAsRead(notificationId);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<{ count: number }, APIResponseError, void>({
    mutationFn: async () => {
      const res = await markAllAsRead();
      return res.data;
    },
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, APIResponseError, number>({
    mutationFn: async (notificationId: number) => {
      const res = await deleteNotification(notificationId);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; count: number }, APIResponseError, void>({
    mutationFn: async () => {
      const res = await deleteAllNotifications();
      return res.data;
    },
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
};

