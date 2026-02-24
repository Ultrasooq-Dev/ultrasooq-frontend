import http from "../http";
import urlcat from "urlcat";

export const fetchOrders = (payload: {
  page: number;
  limit: number;
  term?: string;
  orderProductStatus?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/order/getAllOrderProductByUserId", payload),
  });
};

export const createOrder = (payload: {
  cartIds?: number[];
  serviceCartIds?: number[];
  userAddressId?: number;
  paymentMethod?: string;
  paymentIntentId?: string;
  deviceId?: string;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/order/createOrder",
    data: payload,
  });
};

export const createOrderUnAuth = (payload: {
  cartIds?: number[];
  serviceCartIds?: number[];
  deviceId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cc?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postCode?: string;
  paymentMethod?: string;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/order/createOrderUnAuth",
    data: payload,
  });
};

export const createPaymentIntent = (payload: {
  amount?: number;
  currency?: string;
  orderId?: number;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/payment/create-paymob-intention",
    data: payload,
  });
};

export const createPaymentLink = (payload: {
  amount?: number;
  currency?: string;
  orderId?: number;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/payment/createPaymentLink",
    data: payload,
  });
};

export const createEMIPayment = (payload: {
  orderId?: number;
  amount?: number;
  emiPlan?: string;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/payment/createPaymentForEMI",
    data: payload,
  });
};

export const createAmwalPayConfig = (payload: {
  orderId?: number;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: "/payment/create-amwalpay-config",
    data: payload,
  });
};

export const fetchOrderById = (payload: { orderProductId: string }) => {
  return http({
    method: "GET",
    url: urlcat(
      "/order/getOneOrderProductDetailByUserId",
      payload,
    ),
  });
};

export const fetchOrderBySellerId = (payload: { orderProductId: string }) => {
  return http({
    method: "GET",
    url: urlcat(
      "/order/getOneOrderProductDetailBySellerId",
      payload,
    ),
  });
};

export const fetchOrdersBySellerId = (payload: {
  page: number;
  limit: number;
  term?: string;
  orderProductStatus?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/order/getAllOrderProductBySellerId", payload),
  });
};

export const updateProductStatus = (payload: {
  orderProductId: number;
  status: string;
}) => {
  return http({
    method: "POST",
    url: "/order/orderProductStatusById",
    data: payload,
  });
};

export const updateCancelReason = (payload: {
  orderProductId: number;
  cancelReason: string;
}) => {
  return http({
    method: "PATCH",
    url: "/order/orderProductCancelReason",
    data: payload,
  });
};

export const updateOrderShippingStatus = (payload: {
  orderShippingId: number;
  receipt: string;
}) => {
  return http({
    method: "PATCH",
    url: "/order/orderShippingStatusUpdateById",
    data: payload,
  });
};

export const preOrderCalculation = (payload: {
  cartIds: number[];
  serviceCartIds: number[];
  userAddressId: number;
}) => {
  return http({
    method: "POST",
    url: "/order/preOrderCal",
    data: payload,
  });
};

export const fetchOrderByIdUnAuth = (payload: { orderId: number }) => {
  return http({
    method: "GET",
    url: urlcat("/order/getOneOrderUnAuth", payload),
  });
};

// Vendor Dashboard specific endpoints
export const fetchVendorOrderStats = () => {
  return http({
    method: "GET",
    url: "/order/vendor/order-stats",
  });
};

export const fetchVendorRecentOrders = (payload: {
  page: number;
  limit: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sellType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/order/vendor/recent-orders", payload),
  });
};

export const updateOrderStatus = (payload: {
  orderProductId: number;
  status: string;
  notes?: string;
}) => {
  return http({
    method: "PATCH",
    url: "/order/vendor/update-status",
    data: payload,
  });
};

export const addOrderTracking = (payload: {
  orderProductId: number;
  trackingNumber: string;
  carrier: string;
  notes?: string;
}) => {
  return http({
    method: "POST",
    url: "/order/vendor/add-tracking",
    data: payload,
  });
};
