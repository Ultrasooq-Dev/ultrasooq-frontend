import http from "../http";
import urlcat from "urlcat";
import {
  AddressCreateRequest,
  AddressUpdateRequest,
} from "@/utils/types/address.types";

export const fetchAllUserAddress = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat("/user/getAllUserAddress", payload),
  });
};

export const addAddress = (payload: AddressCreateRequest) => {
  return http({
    method: "POST",
    url: "/user/addUserAddress",
    data: payload,
  });
};

export const updateAddress = (payload: AddressUpdateRequest) => {
  return http({
    method: "PATCH",
    url: "/user/updateUserAddress",
    data: payload,
  });
};

export const fetchAddressById = (payload: { userAddressId: string }) => {
  return http({
    method: "GET",
    url: urlcat("/user/getOneUserAddress", payload),
  });
};

export const deleteAddress = (payload: { userAddressId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat("/user/deleteUserAddress", payload),
  });
};
