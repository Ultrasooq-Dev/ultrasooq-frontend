import { useMutation } from "@tanstack/react-query";
import {
  aiCategorizeProduct,
  AiCategorizePayload,
  AiCategorizeResponse,
} from "../requests/aiCategorize.request";
import { APIResponseError } from "@/utils/types/common.types";

export const useAiCategorize = () => {
  return useMutation<
    AiCategorizeResponse,
    APIResponseError,
    AiCategorizePayload
  >({
    mutationFn: async (payload) => {
      const res = await aiCategorizeProduct(payload);
      return res.data;
    },
  });
};
