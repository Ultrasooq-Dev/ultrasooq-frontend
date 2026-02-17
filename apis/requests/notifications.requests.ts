import axios from "axios";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/notification`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchUnreadCount = async () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/notification/unread-count`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const markAsRead = async (notificationId: number) => {
  return axios({
    method: "PUT",
    url: `${getApiUrl()}/notification/${notificationId}/read`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const markAllAsRead = async () => {
  return axios({
    method: "PUT",
    url: `${getApiUrl()}/notification/read-all`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteNotification = async (notificationId: number) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/notification/${notificationId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteAllNotifications = async () => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/notification`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

