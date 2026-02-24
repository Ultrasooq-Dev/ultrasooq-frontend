import http from "../http";

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
  return http<AiCategorizeResponse>({
    method: "POST",
    url: `/product/ai-categorize`,
    data: payload,
  });
};
