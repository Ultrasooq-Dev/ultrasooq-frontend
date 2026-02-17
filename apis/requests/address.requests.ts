import axios from "axios";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import urlcat from "urlcat";
import {
  AddressCreateRequest,
  AddressUpdateRequest,
} from "@/utils/types/address.types";
import { getApiUrl } from "@/config/api";

export const fetchAllUserAddress = (payload: {
  page: number;
  limit: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/user/getAllUserAddress`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const addAddress = (payload: AddressCreateRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/addUserAddress`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateAddress = (payload: AddressUpdateRequest) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/updateUserAddress`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchAddressById = (payload: { userAddressId: string }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/user/getOneUserAddress`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteAddress = (payload: { userAddressId: number }) => {
  return axios({
    method: "DELETE",
    url: urlcat(`${getApiUrl()}/user/deleteUserAddress`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
