import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { IFreelancerStatusRequest } from "@/utils/types/user.types";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

export const createFreelancerProfile = (payload: Record<string, unknown>) => {
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

export const updateFreelancerProfile = (payload: Record<string, unknown>) => {
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

export const updateFreelancerBranch = (payload: Record<string, unknown>) => {
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

export const updateFreelancerActiveStatus = (
  payload: IFreelancerStatusRequest,
) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/onlineoffline`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
