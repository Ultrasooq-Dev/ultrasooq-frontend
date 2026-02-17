import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import axios from "axios";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";
import {} from "@/utils/types/product.types";

export const createService = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/service/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateService = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/service/${payload?.serviceId}`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchAllServices = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  userId?: number;
  ownService?: boolean;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/service/list`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchServiceById = (payload: {
  serviceid: string;
  userId?: number;
  sharedLinkId?: string;
}) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/service/${payload.serviceid}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const addServiceToCart = (payload: number[]) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/cart/updateservice`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchServicesBySeller = (payload: {
  page: number;
  limit: number;
  sellerId: number;
  fromCityId?: number;
  toCityId?: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/service/getAllServiceBySeller`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchServicesByOtherSeller = (payload: {
  page: number;
  limit: number;
  sellerId: number;
  fromCityId?: number;
  toCityId?: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/service/getAllServiceOfOtherSeller`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchServicesByProductCategory = (payload: {
  categoryId: string;
  page: number;
  limit: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/service/getAllServiceRelatedProductCategoryId`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
