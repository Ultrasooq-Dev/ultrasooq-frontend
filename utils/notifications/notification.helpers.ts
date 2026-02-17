import { NotificationType } from "@/utils/types/notification.types";

/**
 * Notification Helper Utilities
 * These functions help format and create notification data structures
 * that can be sent to the backend notification service
 */

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  link?: string;
  icon?: string;
}

/**
 * Format time remaining for buygroup sale notifications
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
};

/**
 * Create buygroup sale coming soon notification payload
 */
export const createBuygroupSaleComingSoonNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
  timeRemaining: number,
): NotificationPayload => {
  const timeStr = formatTimeRemaining(timeRemaining);
  return {
    userId,
    type: NotificationType.BUYGROUP,
    title: "Sale Starting Soon!",
    message: `A buygroup sale for ${productName} is starting in ${timeStr}. Don't miss out!`,
    data: {
      productId,
      productPriceId,
      timeRemaining,
      productName,
    },
    link: `/trending/${productId}`,
    icon: "🎉",
  };
};

/**
 * Create buygroup sale started notification payload
 */
export const createBuygroupSaleStartedNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.BUYGROUP,
    title: "Sale Started!",
    message: `The buygroup sale for ${productName} has started. Limited stock available!`,
    data: {
      productId,
      productPriceId,
      productName,
    },
    link: `/trending/${productId}`,
    icon: "🔥",
  };
};

/**
 * Create buygroup sale ending soon notification payload
 */
export const createBuygroupSaleEndingSoonNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
  timeRemaining: number,
): NotificationPayload => {
  const timeStr = formatTimeRemaining(timeRemaining);
  return {
    userId,
    type: NotificationType.BUYGROUP,
    title: "Sale Ending Soon!",
    message: `The buygroup sale for ${productName} is ending in ${timeStr}. Get it now!`,
    data: {
      productId,
      productPriceId,
      timeRemaining,
      productName,
    },
    link: `/trending/${productId}`,
    icon: "⏰",
  };
};

/**
 * Create product out of stock notification payload
 */
export const createProductOutOfStockNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.STOCK,
    title: "Product Out of Stock",
    message: `${productName} is now out of stock. We'll notify you when it's back!`,
    data: {
      productId,
      productPriceId,
      productName,
      stockLevel: 0,
    },
    link: `/trending/${productId}`,
    icon: "📦",
  };
};

/**
 * Create product back in stock notification payload
 */
export const createProductBackInStockNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
  stockLevel: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.STOCK,
    title: "Product Back in Stock",
    message: `Great news! ${productName} is back in stock. Order now!`,
    data: {
      productId,
      productPriceId,
      productName,
      stockLevel,
    },
    link: `/trending/${productId}`,
    icon: "✅",
  };
};

/**
 * Create product low stock notification payload
 */
export const createProductLowStockNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
  stockLevel: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.STOCK,
    title: "Low Stock Alert",
    message: `${productName} is running low on stock. Only ${stockLevel} left!`,
    data: {
      productId,
      productPriceId,
      productName,
      stockLevel,
    },
    link: `/trending/${productId}`,
    icon: "⚠️",
  };
};

/**
 * Create product price changed notification payload
 */
export const createProductPriceChangedNotification = (
  userId: number,
  productName: string,
  productId: number,
  productPriceId: number,
  oldPrice: number,
  newPrice: number,
  currency: string = "USD",
): NotificationPayload => {
  const isPriceDrop = newPrice < oldPrice;
  return {
    userId,
    type: NotificationType.PRICE,
    title: isPriceDrop ? "Price Drop!" : "Price Changed",
    message: isPriceDrop
      ? `Great news! The price of ${productName} has dropped to ${currency} ${newPrice}`
      : `The price of ${productName} has changed from ${currency} ${oldPrice} to ${currency} ${newPrice}`,
    data: {
      productId,
      productPriceId,
      productName,
      oldPrice,
      newPrice,
      currency,
      isPriceDrop,
    },
    link: `/trending/${productId}`,
    icon: isPriceDrop ? "💰" : "📊",
  };
};

/**
 * Create RFQ quote submitted notification payload
 */
export const createRfqQuoteSubmittedNotification = (
  userId: number,
  rfqId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.RFQ,
    title: "RFQ Quote Submitted",
    message: "Your RFQ quote has been submitted successfully",
    data: {
      rfqId,
    },
    link: `/rfq-request`,
    icon: "📝",
  };
};

/**
 * Create RFQ quote accepted notification payload
 */
export const createRfqQuoteAcceptedNotification = (
  userId: number,
  rfqId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.RFQ,
    title: "RFQ Quote Accepted",
    message: "Your RFQ quote has been accepted by the buyer",
    data: {
      rfqId,
    },
    link: `/rfq-request`,
    icon: "✅",
  };
};

/**
 * Create RFQ quote rejected notification payload
 */
export const createRfqQuoteRejectedNotification = (
  userId: number,
  rfqId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.RFQ,
    title: "RFQ Quote Rejected",
    message: "Your RFQ quote has been rejected",
    data: {
      rfqId,
    },
    link: `/rfq-request`,
    icon: "❌",
  };
};

/**
 * Create new review received notification payload
 */
export const createNewReviewNotification = (
  userId: number,
  productName: string,
  productId: number,
  reviewId: number,
): NotificationPayload => {
  return {
    userId,
    type: NotificationType.REVIEW,
    title: "New Review",
    message: `You have received a new review for ${productName}`,
    data: {
      productId,
      reviewId,
      productName,
    },
    link: `/trending/${productId}#reviews`,
    icon: "⭐",
  };
};

/**
 * Create shipment notification payload
 */
export const createShipmentNotification = (
  userId: number,
  orderId: number,
  status: "created" | "in_transit" | "delivered" | "delayed",
  orderNo?: string,
): NotificationPayload => {
  const statusMap = {
    created: {
      title: "Shipment Created",
      message: "Your order shipment has been created",
      icon: "📦",
    },
    in_transit: {
      title: "Shipment In Transit",
      message: "Your order is on the way",
      icon: "🚚",
    },
    delivered: {
      title: "Order Delivered",
      message: "Your order has been delivered successfully",
      icon: "✅",
    },
    delayed: {
      title: "Shipment Delayed",
      message: "Your order shipment has been delayed",
      icon: "⏳",
    },
  };

  const statusInfo = statusMap[status];
  return {
    userId,
    type: NotificationType.SHIPMENT,
    title: statusInfo.title,
    message: statusInfo.message,
    data: {
      orderId,
      orderNo,
      status,
    },
    link: `/my-orders${orderNo ? `?orderNo=${orderNo}` : ""}`,
    icon: statusInfo.icon,
  };
};

