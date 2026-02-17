import axios from "axios";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";

export const fetchQuestions = (payload: {
  page: number;
  limit: number;
  productId: string;
  sortType?: "newest" | "oldest";
  userType?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getAllQuestion`, payload),
  });
};

export const addQuestion = (payload: {
  productId: number;
  question: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/askQuestion`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateAnswer = (payload: {
  productQuestionId: number;
  answer: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/giveAnswer`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchServiceQuestions = (payload: {
  page: number;
  limit: number;
  serviceId: string;
  sortType?: "latest" | "oldest";
  userType?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/service/getAllQuestion`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const addServiceQuestion = (payload: {
  serviceId: number;
  question: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/service/ask-question`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateServiceAnswer = (payload: {
  serviceId: number;
  productQuestionId: number;
  answer: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/service/giveAnswer`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
