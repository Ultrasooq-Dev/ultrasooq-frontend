import http from "../http";
import { isEmpty } from "lodash";
import urlcat from "urlcat";

export const fetchCategory = (payload: { categoryId?: string }) => {
  return http({
    method: "GET",
    url: urlcat("/category/findOne", payload),
  });
};

export const fetchCategories = () => {
  return http({
    method: "GET",
    url: "/category/findAll?page=1&limit=10",
  });
};

export const fetchSubCategoriesById = (payload: { categoryId: string }) => {
  const query = new URLSearchParams();

  if (!isEmpty(payload.categoryId)) {
    query.append("categoryId", String(payload.categoryId));
  }

  return http({
    method: "GET",
    url: `/category/findOne?${query}`,
  });
};
