import http from "../http";
import urlcat from "urlcat";
import {
  CreatePrivateRoomRequest,
  FindRoomRequest,
  ChatHistoryRequest,
  RfqPriceStatusUpdateRequest,
  UpdateMessageStatusRequest,
} from "../../utils/types/chat.types";

export const sendMessage = (payload: CreatePrivateRoomRequest) => {
  return http({
    method: "POST",
    url: "/chat/createPrivateRoom",
    data: payload,
  });
};

export const createPrivateRoom = (payload: CreatePrivateRoomRequest) => {
  return http({
    method: "POST",
    url: "/chat/createPrivateRoom",
    data: payload,
  });
};

export const findRoomId = (payload: FindRoomRequest) => {
  return http({
    method: "GET",
    url: urlcat("/chat/find-room", payload),
  });
};

export const getChatHistory = (payload: ChatHistoryRequest) => {
  return http({
    method: "GET",
    url: urlcat("/chat/messages", payload),
  });
};

export const updateRfqRequestPriceStatus = (
  payload: RfqPriceStatusUpdateRequest,
) => {
  return http({
    method: "put",
    url: "/chat/update-rfq-price-request-status",
    data: payload,
  });
};

export const updateUnreadMessages = (payload: UpdateMessageStatusRequest) => {
  return http({
    method: "patch",
    url: "/chat/read-messages",
    data: payload,
  });
};

export const getProductDetails = (productId: number) => {
  return http({
    method: "GET",
    url: `/chat/product?productId=${productId}`,
  });
};

export const getProductMessages = (productId: number, sellerId: number) => {
  return http({
    method: "GET",
    url: `/chat/product/messages?productId=${productId}&sellerId=${sellerId}`,
  });
};

export const getAllProductsWithMessages = (sellerId: number) => {
  return http({
    method: "GET",
    url: `/chat/products/messages?sellerId=${sellerId}`,
  });
};

export const uploadAttachment = (payload: FormData) => {
  return http({
    method: "POST",
    url: "/chat/upload-attachment",
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadAttachment = (filePath: string) => {
  return http({
    method: "GET",
    url: `/chat/download-attachment?file-path=${filePath}`,
  });
};

// NEW: Get vendor products for suggestion modal
export const getVendorProductsForSuggestion = (payload: {
  vendorId: number;
  page: number;
  limit: number;
  term?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat("/chat/vendor-products-for-suggestion", payload),
  });
};

// NEW: Select suggested products (Buyer action)
export const selectSuggestedProducts = (payload: {
  selectedSuggestionIds: number[];
  rfqQuoteProductId: number;
  rfqQuotesUserId: number;
}) => {
  return http({
    method: "POST",
    url: "/chat/select-suggested-products",
    data: payload,
  });
};
