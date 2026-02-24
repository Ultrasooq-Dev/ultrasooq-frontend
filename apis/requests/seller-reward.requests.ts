import http from "../http";
import urlcat from "urlcat";

export const fetchSellerRewards = (payload: {
  page: number;
  limit: number;
  term?: string;
  productId?: string;
  sortType?: "asc" | "desc";
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllSellerReward`, payload),
  });
};

export const addSellerReward = (payload: {
  productId: number;
  startTime: string;
  endTime: string;
  rewardPercentage: number;
  rewardFixAmount: number;
  minimumOrder: number;
  stock: number;
}) => {
  return http({
    method: "POST",
    url: `/product/createSellerRewardProduct`,
    data: payload,
  });
};

export const fetchShareLinks = (payload: {
  page: number;
  limit: number;
  productId?: string;
  sortType?: "asc" | "desc";
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllGenerateLink`, payload),
  });
};

export const createShareLink = (payload: { sellerRewardId: number }) => {
  return http({
    method: "POST",
    url: `/product/generateLink`,
    data: Object.assign(payload, { generatedLink: "generatedLink" }),
  });
};

export const fetchShareLinksBySellerRewardId = (payload: {
  page: number;
  limit: number;
  term?: string;
  sellerRewardId?: string;
  sortType?: "asc" | "desc";
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllGenerateLinkBySellerRewardId`,
      payload,
    ),
  });
};
