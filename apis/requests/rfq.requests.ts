import http from "../http";
import urlcat from "urlcat";
import {
  AddRfqQuotesRequest,
  AddFactoriesQuotesRequest,
} from "@/utils/types/rfq.types";

export const fetchRfqProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  adminId?: string;
  sortType?: "newest" | "oldest";
  brandIds?: string;
  isOwner?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllRfqProduct`, payload),
  });
};

export const fetchFactoriesProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  adminId?: string;
  sortType?: "newest" | "oldest";
  brandIds?: string;
  isOwner?: string;
  related?: boolean;
}) => {
  const related = payload.related;
  delete payload?.related;
  if (related) {
    return fetchFactoriesProductsByUserBusinessCategory(payload);
  }
  return http({
    method: "GET",
    url: urlcat(`/product/getAllFactoriesProduct`, payload),
  });
};

export const fetchFactoriesProductsByUserBusinessCategory = (payload: {
  page: number;
  limit: number;
  term?: string;
  adminId?: string;
  sortType?: "newest" | "oldest";
  brandIds?: string;
  isOwner?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllFactoriesProductByUserBusinessCategory`,
      payload,
    ),
  });
};

export const addRfqProduct = (payload: {
  productNote: string;
  rfqProductName: string;
  rfqProductImagesList: { imageName: string; image: string }[];
}) => {
  return http({
    method: "POST",
    url: `/product/addRfqProduct`,
    data: payload,
  });
};

export const updateRfqProduct = (payload: {
  rFqProductId: number;
  productNote: string;
  rfqProductName: string;
  rfqProductImagesList: { imageName: string; image: string }[];
}) => {
  return http({
    method: "PATCH",
    url: `/product/editRfqProduct`,
    data: payload,
  });
};

export const fetchRfqProductById = (payload: { rfqProductId: string }) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getOneRfqProduct`, payload),
  });
};

export const fetchRfqCartByUserId = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/cart/rfqCartlist`, payload),
  });
};

export const fetchFactoriesCartByUserId = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/cart/getAllFactoriesCart`, payload),
  });
};

export const updateRfqCartWithLogin = (payload: {
  productId: number;
  quantity: number;
  productType?: "SAME" | "SIMILAR";
  offerPriceFrom?: number;
  offerPriceTo?: number;
  note?: string;
}) => {
  return http({
    method: "PATCH",
    url: `/cart/updateRfqCart`,
    data: payload,
  });
};

export const updateFactoriesCartWithLogin = (payload: {
  productId: number;
  quantity: number;
  customizeProductId: number;
}) => {
  return http({
    method: "PATCH",
    url: `/cart/updateFactoriesCart`,
    data: payload,
  });
};

export const addFactoriesProductApi = (payload: { productId: number }) => {
  return http({
    method: "POST",
    url: `/product/addProductDuplicateFactories`,
    data: payload,
  });
};

export const addCustomizeProductApi = (payload: {
  productId: number;
  note: string;
  fromPrice: number;
  toPrice: number;
}) => {
  return http({
    method: "POST",
    url: `/product/addCustomizeProduct`,
    data: payload,
  });
};

export const deleteRfqCartItem = (payload: { rfqCartId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat(`/cart/rfqCartDelete`, payload),
  });
};

export const deleteFactoriesCartItem = (payload: {
  factoriesCartId: number;
}) => {
  return http({
    method: "DELETE",
    url: urlcat(`/cart/deleteFactoriesCart`, payload),
  });
};

export const fetchAllRfqQuotesByBuyerId = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllRfqQuotesByBuyerID`, payload),
  });
};

export const fetchAllRfqQuotesUsersByBuyerId = (payload: {
  page: number;
  limit: number;
  rfqQuotesId: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllRfqQuotesUsersByBuyerID`,
      payload,
    ),
  });
};

export const fetchOneRfqQuotesUsersByBuyerID = (payload: {
  rfqQuotesId?: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getOneRfqQuotesUsersByBuyerID`,
      payload,
    ),
  });
};

export const fetchAllRfqQuotesUsersBySellerId = (payload: {
  page: number;
  limit: number;
  showHidden?: boolean;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllRfqQuotesUsersBySellerID`,
      payload,
    ),
  });
};

export const addRfqQuotes = (payload: AddRfqQuotesRequest) => {
  return http({
    method: "POST",
    url: `/product/addRfqQuotes`,
    data: payload,
  });
};

export const addFactoriesQuotes = (payload: AddFactoriesQuotesRequest) => {
  return http({
    method: "POST",
    url: `/product/createFactoriesRequest`,
    data: payload,
  });
};

export const addProductDuplicateRfq = (payload: { productId: number }) => {
  return http({
    method: "POST",
    url: `/product/addProductDuplicateRfq`,
    data: payload,
  });
};

export const deleteRfqQuote = (payload: { rfqQuotesId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat(`/product/deleteOneRfqQuote`, payload),
  });
};

export const hideRfqRequest = (payload: {
  rfqQuotesUserId: number;
  isHidden: boolean;
}) => {
  return http({
    method: "PATCH",
    url: `/product/hideRfqRequest`,
    data: payload,
  });
};
