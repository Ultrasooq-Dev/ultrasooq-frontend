import http from "../http";
import urlcat from "urlcat";

export const fetchTransactions = (payload: { page?: number; limit?: number; [key: string]: unknown }) => {
  return http({
    method: "GET",
    url: urlcat(`/payment/transaction/getl-all`, payload),
    data: payload,
  });
};
