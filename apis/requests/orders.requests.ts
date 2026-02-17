import axios from "axios";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchOrders = (payload: {
  page: number;
  limit: number;
  term?: string;
  orderProductStatus?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/order/getAllOrderProductByUserId`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/order/createOrder`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/order/createOrderUnAuth`,
    data: payload,
  });
};

export const createPaymentIntent = (payload: {
  amount?: number;
  currency?: string;
  orderId?: number;
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/create-paymob-intention`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const createPaymentLink = (payload: {
  amount?: number;
  currency?: string;
  orderId?: number;
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/createPaymentLink`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const createEMIPayment = (payload: {
  orderId?: number;
  amount?: number;
  emiPlan?: string;
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/createPaymentForEMI`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const createAmwalPayConfig = (payload: {
  orderId?: number;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/payment/create-amwalpay-config`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchOrderById = (payload: { orderProductId: string }) => {
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/order/getOneOrderProductDetailByUserId`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchOrderBySellerId = (payload: { orderProductId: string }) => {
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/order/getOneOrderProductDetailBySellerId`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/order/getAllOrderProductBySellerId`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateProductStatus = (payload: {
  orderProductId: number;
  status: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/order/orderProductStatusById`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateCancelReason = (payload: {
  orderProductId: number;
  cancelReason: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/order/orderProductCancelReason`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateOrderShippingStatus = (payload: {
  orderShippingId: number;
  receipt: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/order/orderShippingStatusUpdateById`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const preOrderCalculation = (payload: {
  cartIds: number[];
  serviceCartIds: number[];
  userAddressId: number;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/order/preOrderCal`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchOrderByIdUnAuth = (payload: { orderId: number }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/order/getOneOrderUnAuth`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

// Vendor Dashboard specific endpoints
export const fetchVendorOrderStats = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/order/vendor/order-stats`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/order/vendor/recent-orders`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateOrderStatus = (payload: {
  orderProductId: number;
  status: string;
  notes?: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/order/vendor/update-status`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const addOrderTracking = (payload: {
  orderProductId: number;
  trackingNumber: string;
  carrier: string;
  notes?: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/order/vendor/add-tracking`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
