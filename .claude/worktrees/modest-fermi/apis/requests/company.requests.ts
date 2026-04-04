import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { isEmpty } from "lodash";
import { getApiUrl } from "@/config/api";

export const createCompanyProfile = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/userProfile`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateCompanyProfile = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/updateUserProfile`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const updateCompanyBranch = (payload: Record<string, unknown>) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/updateBranch`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const createCompanyBranch = (payload: Record<string, unknown>) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/addBranch`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCompanyBranchById = (payload: { branchId: string }) => {
  const query = new URLSearchParams();

  if (!isEmpty(payload.branchId)) {
    query.append("branchId", String(payload.branchId));
  }

  return axios({
    method: "GET",
    url: `${getApiUrl()}/user/findOneBranch?${query}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
