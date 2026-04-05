import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { isEmpty } from "lodash";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchCategory = (payload: { categoryId?: string }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/category/findOne`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const fetchCategories = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/category/findAll?page=1&limit=10`,
  });
};

export const fetchSubCategoriesById = (payload: { categoryId: string }) => {
  const query = new URLSearchParams();

  if (!isEmpty(payload.categoryId)) {
    query.append("categoryId", String(payload.categoryId));
  }

  return axios({
    method: "GET",
    url: `${getApiUrl()}/category/findOne?${query}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};
