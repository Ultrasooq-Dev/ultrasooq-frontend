import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import axios from "axios";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchWishList = (payload: { page: number; limit: number }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/wishlist/getAllWishListByUser`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const addToWishList = (payload: { productId: number }) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/wishlist/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const deleteFromWishList = (payload: { productId: number }) => {
  return axios({
    method: "DELETE",
    url: urlcat(`${getApiUrl()}/wishlist/delete`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchWishlistCount = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/wishlist/wishlistCount`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
