import { ULTRASOOQ_TOKEN_KEY } from "../../utils/constants";
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

export const downloadAttachment = (filePath: string) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/chat/download-attachment?file-path=${filePath}`,
    headers: {
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
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
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// ─── Messaging System — Real Backend Endpoints ───────────────

import http from "../http";

// Channel summary for P1 — returns counts per channel
export const getChannelSummary = async () => {
  const { data } = await http.get("/chat/channels/summary");
  return data;
};

// Channel conversations for P2 — returns tree items for a channel
export const getChannelConversations = async (
  channelId: string,
  page = 1,
  limit = 50,
) => {
  const { data } = await http.get(
    `/chat/channels/${channelId}/conversations`,
    { params: { page, limit } },
  );
  return data;
};

// Toggle pin on a room
export const togglePinRoom = async (roomId: number) => {
  const { data } = await http.patch(`/chat/rooms/${roomId}/pin`);
  return data;
};

// Toggle archive on a room
export const toggleArchiveRoom = async (roomId: number) => {
  const { data } = await http.patch(`/chat/rooms/${roomId}/archive`);
  return data;
};

// Delete / leave a room
export const deleteRoom = async (roomId: number) => {
  const { data } = await http.delete(`/chat/rooms/${roomId}`);
  return data;
};

// RFQ products for P6 — returns products for a room
export const getRfqProductsForRoom = async (roomId: number) => {
  const { data } = await http.get(`/chat/rooms/${roomId}/rfq-products`);
  return data;
};

// Update RFQ alternative price/stock
export const updateRfqAlternative = async (
  roomId: number,
  productId: number,
  payload: { price?: number; stock?: number },
) => {
  const { data } = await http.put(
    `/chat/rooms/${roomId}/rfq-products/${productId}`,
    payload,
  );
  return data;
};