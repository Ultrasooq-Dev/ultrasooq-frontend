import axios from "axios";
import { isEmpty } from "lodash";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const createMember = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/team-member/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchAllMembers = (payload: { page: number; limit: number }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/team-member/getAllTeamMember`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateMember = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/team-member/update`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchPermissions = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/admin/permission/get-all`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const setPermission = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/set-permision`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchPermissionByRoleId = (payload: { userRoleId: number }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/user/getOneUserRole-with-permission`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updatePermission = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/update-set-permission`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
