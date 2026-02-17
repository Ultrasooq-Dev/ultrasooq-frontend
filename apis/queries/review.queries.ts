import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import {
  addReview,
  addSellerReview,
  fetchAllProductPriceReviewBySellerId,
  fetchReviewById,
  fetchReviews,
  fetchSellerReviewById,
  updateReview,
  updateSellerReview,
} from "../requests/review.requests";

export const useReviews = (
  payload: {
    page: number;
    limit: number;
    productId: string;
    sortType?: "highest" | "lowest" | "newest";
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["reviews", payload],
    queryFn: async () => {
      const res = await fetchReviews(payload);
      return res.data;
    },
    enabled,
  });

export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number; title: string; description: string; rating: number }
  >({
    mutationFn: async (payload) => {
      const res = await addReview(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      productReviewId: number;
      title: string;
      description: string;
      rating: number;
    }
  >({
    mutationFn: async (payload) => {
      const res = await updateReview(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useReviewById = (
  payload: { productReviewId: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ["review-by-id", payload],
    queryFn: async () => {
      const res = await fetchReviewById(payload);
      return res.data;
    },
    enabled,
  });

export const useAddSellerReview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      productPriceId: number;
      adminId: number;
      productId: number;
      title: string;
      description: string;
      rating: number;
    }
  >({
    mutationFn: async (payload) => {
      const res = await addSellerReview(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews-for-seller"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateSellerReview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      productReviewId: number;
      title: string;
      description: string;
      rating: number;
    }
  >({
    mutationFn: async (payload) => {
      const res = await updateSellerReview(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews-for-seller"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useSellerReviewById = (
  payload: { productPriceReviewId: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ["seller-review-by-id", payload],
    queryFn: async () => {
      const res = await fetchSellerReviewById(payload);
      return res.data;
    },
    enabled,
  });

export const useAllProductPriceReviewBySellerId = (
  payload: {
    page: number;
    limit: number;
    sortType?: "highest" | "lowest" | "newest";
    sellerId: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["reviews-for-seller", payload],
    queryFn: async () => {
      const res = await fetchAllProductPriceReviewBySellerId(payload);
      return res.data;
    },
    enabled,
  });
