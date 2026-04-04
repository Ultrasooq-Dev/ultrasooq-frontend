import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

export const fetchHelpCenterQueries = (payload?: Record<string, unknown>) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/user/help-center/get-all`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const submitQuery = (payload: {
  userId?: number;
  email: string;
  query: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/help-center/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
