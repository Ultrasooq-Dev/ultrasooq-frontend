import { PUREMOON_TOKEN_KEY } from "../../utils/constants";
import axios from "axios";
import urlcat from "urlcat";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";
import {
  CreatePrivateRoomRequest,
  FindRoomRequest,
  ChatHistoryRequest,
  RfqPriceStatusUpdateRequest,
  UpdateMessageStatusRequest,
} from "../../utils/types/chat.types";

export const sendMessage = (payload: CreatePrivateRoomRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/chat/createPrivateRoom`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const createPrivateRoom = (payload: CreatePrivateRoomRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/chat/createPrivateRoom`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const findRoomId = (payload: FindRoomRequest) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/chat/find-room`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getChatHistory = (payload: ChatHistoryRequest) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/chat/messages`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateRfqRequestPriceStatus = (
  payload: RfqPriceStatusUpdateRequest,
) => {
  return axios({
    method: "put",
    url: `${getApiUrl()}/chat/update-rfq-price-request-status`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateUnreadMessages = (payload: UpdateMessageStatusRequest) => {
  return axios({
    method: "patch",
    url: `${getApiUrl()}/chat/read-messages`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getProductDetails = (productId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/chat/product?productId=${productId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getProductMessages = (productId: number, sellerId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/chat/product/messages?productId=${productId}&sellerId=${sellerId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getAllProductsWithMessages = (sellerId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/chat/products/messages?sellerId=${sellerId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const uploadAttachment = (payload: FormData) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/chat/upload-attachment`,
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const downloadAttachment = (filePath: string) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/chat/download-attachment?file-path=${filePath}`,
    headers: {
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// NEW: Get vendor products for suggestion modal
export const getVendorProductsForSuggestion = (payload: {
  vendorId: number;
  page: number;
  limit: number;
  term?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/chat/vendor-products-for-suggestion`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// NEW: Select suggested products (Buyer action)
export const selectSuggestedProducts = (payload: {
  selectedSuggestionIds: number[];
  rfqQuoteProductId: number;
  rfqQuotesUserId: number;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/chat/select-suggested-products`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};