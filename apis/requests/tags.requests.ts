import axios from "axios";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";

export const fetchTags = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/user/viewTags`,
  });
};

export const createTag = (payload: { tagName: string }) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/createTag`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
