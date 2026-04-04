/**
 * Buygroup Sale Notification Scheduler
 * 
 * This utility schedules notifications for buygroup sales:
 * - Coming soon (24 hours, 12 hours, 1 hour before)
 * - Started (when sale starts)
 * - Ending soon (1 hour, 30 minutes, 10 minutes before end)
 * 
 * Note: This is a frontend utility. The actual notification sending
 * should be handled by the backend. This can be used to:
 * 1. Display UI notifications
 * 2. Schedule backend API calls
 * 3. Track notification states
 */

import {
  createBuygroupSaleComingSoonNotification,
  createBuygroupSaleStartedNotification,
  createBuygroupSaleEndingSoonNotification,
} from "./notification.helpers";

export interface BuygroupSaleInfo {
  productId: number;
  productPriceId: number;
  productName: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
}

export interface ScheduledNotification {
  id: string;
  type: "coming_soon" | "started" | "ending_soon";
  scheduledTime: number;
  notification: ReturnType<
    | typeof createBuygroupSaleComingSoonNotification
    | typeof createBuygroupSaleStartedNotification
    | typeof createBuygroupSaleEndingSoonNotification
  >;
  sent: boolean;
}

/**
 * Calculate all notification times for a buygroup sale
 */
export const calculateBuygroupNotificationTimes = (
  saleInfo: BuygroupSaleInfo,
): ScheduledNotification[] => {
  const notifications: ScheduledNotification[] = [];
  const now = Date.now();
  const { startTime, endTime } = saleInfo;

  // Coming soon notifications (24h, 12h, 1h before start)
  const comingSoonTimes = [
    24 * 60 * 60 * 1000, // 24 hours
    12 * 60 * 60 * 1000, // 12 hours
    1 * 60 * 60 * 1000, // 1 hour
  ];

  comingSoonTimes.forEach((timeBefore) => {
    const notificationTime = startTime - timeBefore;
    if (notificationTime > now && notificationTime < startTime) {
      notifications.push({
        id: `coming_soon_${saleInfo.productPriceId}_${timeBefore}`,
        type: "coming_soon",
        scheduledTime: notificationTime,
        notification: createBuygroupSaleComingSoonNotification(
          0, // userId will be set when sending
          saleInfo.productName,
          saleInfo.productId,
          saleInfo.productPriceId,
          timeBefore,
        ),
        sent: false,
      });
    }
  });

  // Started notification (at start time)
  if (startTime > now && startTime < endTime) {
    notifications.push({
      id: `started_${saleInfo.productPriceId}`,
      type: "started",
      scheduledTime: startTime,
      notification: createBuygroupSaleStartedNotification(
        0, // userId will be set when sending
        saleInfo.productName,
        saleInfo.productId,
        saleInfo.productPriceId,
      ),
      sent: false,
    });
  }

  // Ending soon notifications (1h, 30m, 10m before end)
  const endingSoonTimes = [
    1 * 60 * 60 * 1000, // 1 hour
    30 * 60 * 1000, // 30 minutes
    10 * 60 * 1000, // 10 minutes
  ];

  endingSoonTimes.forEach((timeBefore) => {
    const notificationTime = endTime - timeBefore;
    if (notificationTime > now && notificationTime < endTime && notificationTime > startTime) {
      notifications.push({
        id: `ending_soon_${saleInfo.productPriceId}_${timeBefore}`,
        type: "ending_soon",
        scheduledTime: notificationTime,
        notification: createBuygroupSaleEndingSoonNotification(
          0, // userId will be set when sending
          saleInfo.productName,
          saleInfo.productId,
          saleInfo.productPriceId,
          timeBefore,
        ),
        sent: false,
      });
    }
  });

  // Sort by scheduled time
  return notifications.sort((a, b) => a.scheduledTime - b.scheduledTime);
};

/**
 * Check if any notifications are due and need to be sent
 */
export const getDueNotifications = (
  scheduledNotifications: ScheduledNotification[],
): ScheduledNotification[] => {
  const now = Date.now();
  return scheduledNotifications.filter(
    (notification) => !notification.sent && notification.scheduledTime <= now,
  );
};

/**
 * Mark notification as sent
 */
export const markNotificationAsSent = (
  notifications: ScheduledNotification[],
  notificationId: string,
): ScheduledNotification[] => {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, sent: true }
      : notification,
  );
};

/**
 * Get users who should receive buygroup sale notifications
 * This should be called from the backend to get:
 * - Users who have the product in wishlist
 * - Users who have viewed the product
 * - Users who have purchased similar products
 * - Users who have subscribed to product notifications
 */
export const getUsersForBuygroupNotification = async (
  productId: number,
  productPriceId: number,
): Promise<number[]> => {
  // This is a placeholder - actual implementation should call backend API
  // Example: GET /api/products/{productId}/notification-subscribers
  // The backend should return an array of user IDs
  
  // For now, return empty array - backend should handle this
  return [];
};

