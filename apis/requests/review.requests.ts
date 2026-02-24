import http from "../http";
import urlcat from "urlcat";

export const fetchReviews = (payload: {
  page: number;
  limit: number;
  productId: string;
  sortType?: "highest" | "lowest" | "newest";
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllProductReview`, payload),
  });
};

export const addReview = (payload: {
  productId: number;
  title: string;
  description: string;
  rating: number;
}) => {
  return http({
    method: "POST",
    url: `/product/addProductReview`,
    data: payload,
  });
};

export const updateReview = (payload: {
  productReviewId: number;
  title: string;
  description: string;
  rating: number;
}) => {
  return http({
    method: "PATCH",
    url: `/product/editProductReview`,
    data: payload,
  });
};

export const fetchReviewById = (payload: { productReviewId: number }) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getOneProductReview`, payload),
  });
};

export const addSellerReview = (payload: {
  productPriceId: number;
  adminId: number;
  productId: number;
  title: string;
  description: string;
  rating: number;
}) => {
  return http({
    method: "POST",
    url: `/product/addProductPriceReview`,
    data: payload,
  });
};

export const updateSellerReview = (payload: {
  productReviewId: number;
  title: string;
  description: string;
  rating: number;
}) => {
  return http({
    method: "PATCH",
    url: `/product/updateOneProductPriceReview`,
    data: payload,
  });
};

export const fetchSellerReviewById = (payload: {
  productPriceReviewId: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getOneProductPriceReview`, payload),
  });
};

export const fetchAllProductPriceReviewBySellerId = (payload: {
  page: number;
  limit: number;
  sortType?: "highest" | "lowest" | "newest";
  sellerId: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllProductPriceReviewBySellerId`,
      payload,
    ),
  });
};
