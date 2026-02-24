import http from "../http";
import urlcat from "urlcat";
import {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "@/utils/types/notification.types";

export interface FetchNotificationsPayload {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}

export const fetchNotifications = async (
  payload: FetchNotificationsPayload = {},
) => {
  return http({
    method: "GET",
    url: urlcat("/notification", payload),
  });
};

export const fetchUnreadCount = async () => {
  return http({
    method: "GET",
    url: "/notification/unread-count",
  });
};

export const markAsRead = async (notificationId: number) => {
  return http({
    method: "PUT",
    url: `/notification/${notificationId}/read`,
  });
};

export const markAllAsRead = async () => {
  return http({
    method: "PUT",
    url: "/notification/read-all",
  });
};

export const deleteNotification = async (notificationId: number) => {
  return http({
    method: "DELETE",
    url: `/notification/${notificationId}`,
  });
};

export const deleteAllNotifications = async () => {
  return http({
    method: "DELETE",
    url: "/notification",
  });
};
