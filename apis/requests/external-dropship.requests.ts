import axios from "axios";
import { getCookie } from "cookies-next";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";

export const createExternalStore = (payload: {
  name: string;
  platform?: string;
  settings?: any;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/external-dropship/stores/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const listExternalStores = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/external-dropship/stores/list`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const subscribeProductsToExternalStore = (params: {
  storeId: number;
  productIds: number[];
  externalProductIdMap?: Record<number, string>;
  externalSkuMap?: Record<number, string>;
}) => {
  const { storeId, ...body } = params;
  return axios({
    method: "POST",
    url: `${getApiUrl()}/external-dropship/stores/${storeId}/subscribe-products`,
    data: body,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateExternalStore = (
  storeId: number,
  payload: { name?: string; platform?: string; settings?: any }
) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/external-dropship/stores/${storeId}`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const deleteExternalStore = (storeId: number) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/external-dropship/stores/${storeId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const unsubscribeProductFromExternalStore = (
  storeId: number,
  productId: number
) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/external-dropship/stores/${storeId}/unsubscribe-product/${productId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const getSubscribedProductsForExternalStore = (storeId: number) => {
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/external-dropship/stores/:storeId/subscribed-products`,
      { storeId },
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
