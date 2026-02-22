import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import axios from "axios";
import { getApiUrl } from "@/config/api";

export interface AiCategorizePayload {
  productName: string;
}

export interface AiCategorizeResponse {
  status: number;
  message: string;
  data: {
    suggestedTags: Array<{ id: number; tagName: string }>;
    suggestedCategories: Array<{
      id: number;
      name: string;
      path: number[];
      categoryLocation: string;
    }>;
  };
}

export const aiCategorizeProduct = (payload: AiCategorizePayload) => {
  return axios<AiCategorizeResponse>({
    method: "POST",
    url: `${getApiUrl()}/product/ai-categorize`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
