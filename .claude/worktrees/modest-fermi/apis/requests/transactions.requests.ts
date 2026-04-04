import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchTransactions = (payload: { page?: number; limit?: number; [key: string]: unknown }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/payment/transaction/getl-all`, payload),
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
