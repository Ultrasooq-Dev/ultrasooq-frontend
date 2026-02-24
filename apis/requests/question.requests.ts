import http from "../http";
import urlcat from "urlcat";

export const fetchQuestions = (payload: {
  page: number;
  limit: number;
  productId: string;
  sortType?: "newest" | "oldest";
  userType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllQuestion`, payload),
  });
};

export const addQuestion = (payload: {
  productId: number;
  question: string;
}) => {
  return http({
    method: "POST",
    url: `/product/askQuestion`,
    data: payload,
  });
};

export const updateAnswer = (payload: {
  productQuestionId: number;
  answer: string;
}) => {
  return http({
    method: "PATCH",
    url: `/product/giveAnswer`,
    data: payload,
  });
};

export const fetchServiceQuestions = (payload: {
  page: number;
  limit: number;
  serviceId: string;
  sortType?: "latest" | "oldest";
  userType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/service/getAllQuestion`, payload),
  });
};

export const addServiceQuestion = (payload: {
  serviceId: number;
  question: string;
}) => {
  return http({
    method: "POST",
    url: `/service/ask-question`,
    data: payload,
  });
};

export const updateServiceAnswer = (payload: {
  serviceId: number;
  productQuestionId: number;
  answer: string;
}) => {
  return http({
    method: "PATCH",
    url: `/service/giveAnswer`,
    data: payload,
  });
};
