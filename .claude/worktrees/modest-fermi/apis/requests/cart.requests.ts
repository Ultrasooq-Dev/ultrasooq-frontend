import axios from "axios";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchCartByUserId = (payload: { page: number; limit: number }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/cart/list`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCartByDevice = (payload: {
  page: number;
  limit: number;
  deviceId: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/cart/listUnAuth`, payload),
  });
};

export const updateCartWithLogin = (payload: {
  productPriceId: number;
  quantity: number;
  sharedLinkId?: number;
  productVariant?: Record<string, unknown>;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/update`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateCartByDevice = (payload: {
  productPriceId: number;
  quantity: number;
  deviceId: string;
  sharedLinkId?: number;
  productVariant?: Record<string, unknown>;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/updateUnAuth`,
    data: payload,
  });
};

export const updateCartWithService = (payload: {
  cartId?: number;
  serviceId?: number;
  serviceFeatureIds?: number[];
  [key: string]: unknown;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/updateservice/product`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const deleteCartItem = (payload: { cartId: number }) => {
  return axios({
    method: "DELETE",
    url: urlcat(`${getApiUrl()}/cart/delete`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const deleteServiceFromCart = (
  cartId: number,
  serviceFeatureId?: number,
) => {
  let payload: Record<string, string> = {};
  if (serviceFeatureId) {
    payload.servicefeatureids = serviceFeatureId.toString();
  }
  return axios({
    method: "DELETE",
    url: urlcat(`${getApiUrl()}/cart/deleteService/${cartId}`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateUserCartByDeviceId = (payload: { deviceId: string }) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/updateUserIdBydeviceId`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCartCountWithLogin = () => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/cart/cartCount`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCartCountByDeviceId = (payload: { deviceId: string }) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/cart/cartCountUnAuth`,
    data: payload,
  });
};

export const addServiceToCartWithProduct = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/updateCartServiceWithProduct`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCartRecommendations = (payload: {
  productIds?: string;
  limit?: number;
  deviceId?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/cart/recommendations`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};