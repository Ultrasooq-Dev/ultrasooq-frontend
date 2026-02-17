import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addToWishList,
  deleteFromWishList,
  fetchWishList,
  fetchWishlistCount,
} from "../requests/wishlist.requests";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";

export const useWishlist = (
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["wishlist", payload],
    queryFn: async () => {
      const res = await fetchWishList(payload);
      return res.data;
    },
    enabled,
  });

export const useAddToWishList = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number }
  >({
    mutationFn: async (payload) => {
      const res = await addToWishList(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlist-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-with-login"],
      });
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["same-brand-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["related-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useDeleteFromWishList = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number }
  >({
    mutationFn: async (payload) => {
      const res = await deleteFromWishList(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlist-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-with-login"],
      });
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["same-brand-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["related-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useWishlistCount = (enabled = true) =>
  useQuery({
    queryKey: ["wishlist-count"],
    queryFn: async () => {
      const res = await fetchWishlistCount();
      return res.data;
    },
    enabled,
  });
