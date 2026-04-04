import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import {
  addQuestion,
  addServiceQuestion,
  fetchQuestions,
  fetchServiceQuestions,
  updateAnswer,
  updateServiceAnswer,
} from "../requests/question.requests";

export const useQuestions = (
  payload: {
    page: number;
    limit: number;
    productId: string;
    sortType?: "newest" | "oldest";
    userType?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["questions", payload],
    queryFn: async () => {
      const res = await fetchQuestions(payload);
      return res.data;
    },
    enabled,
  });

export const useAddQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number; question: string }
  >({
    mutationFn: async (payload) => {
      const res = await addQuestion(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productQuestionId: number; answer: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateAnswer(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useServiceQuestions = (
  payload: {
    page: number;
    limit: number;
    serviceId: string;
    sortType?: "latest" | "oldest";
    userType?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["service-questions", payload],
    queryFn: async () => {
      const res = await fetchServiceQuestions(payload);
      return res.data;
    },
    enabled,
  });

export const useAddServiceQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { serviceId: number; question: string }
  >({
    mutationFn: async (payload) => {
      const res = await addServiceQuestion(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["service-questions"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateServiceAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { serviceId: number; productQuestionId: number; answer: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateServiceAnswer(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["service-questions"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
