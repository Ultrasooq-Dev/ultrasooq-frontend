import http from "../http";
import urlcat from "urlcat";

export const fetchCartByUserId = (payload: { page: number; limit: number }) => {
  return http({
    method: "GET",
    url: urlcat("/cart/list", payload),
  });
};

export const fetchCartByDevice = (payload: {
  page: number;
  limit: number;
  deviceId: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/cart/listUnAuth", payload),
  });
};

export const updateCartWithLogin = (payload: {
  productPriceId: number;
  quantity: number;
  sharedLinkId?: number;
  productVariant?: Record<string, unknown>;
}) => {
  return http({
    method: "PATCH",
    url: "/cart/update",
    data: payload,
  });
};

export const updateCartByDevice = (payload: {
  productPriceId: number;
  quantity: number;
  deviceId: string;
  sharedLinkId?: number;
  productVariant?: Record<string, unknown>;
}) => {
  return http({
    method: "PATCH",
    url: "/cart/updateUnAuth",
    data: payload,
  });
};

export const updateCartWithService = (payload: {
  cartId?: number;
  serviceId?: number;
  serviceFeatureIds?: number[];
  [key: string]: unknown;
}) => {
  return http({
    method: "PATCH",
    url: "/cart/updateservice/product",
    data: payload,
  });
};

export const deleteCartItem = (payload: { cartId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat("/cart/delete", payload),
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
  return http({
    method: "DELETE",
    url: urlcat(`/cart/deleteService/${cartId}`, payload),
  });
};

export const updateUserCartByDeviceId = (payload: { deviceId: string }) => {
  return http({
    method: "PATCH",
    url: "/cart/updateUserIdBydeviceId",
    data: payload,
  });
};

export const fetchCartCountWithLogin = () => {
  return http({
    method: "POST",
    url: "/cart/cartCount",
  });
};

export const fetchCartCountByDeviceId = (payload: { deviceId: string }) => {
  return http({
    method: "POST",
    url: "/cart/cartCountUnAuth",
    data: payload,
  });
};

export const addServiceToCartWithProduct = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/cart/updateCartServiceWithProduct",
    data: payload,
  });
};

export const fetchCartRecommendations = (payload: {
  productIds?: string;
  limit?: number;
  deviceId?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/cart/recommendations", payload),
  });
};
