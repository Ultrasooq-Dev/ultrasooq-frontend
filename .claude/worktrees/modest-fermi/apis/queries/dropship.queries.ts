import { APIResponseError } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDropshipProduct,
  getAvailableProductsForDropship,
  getDropshipEarnings,
  getDropshipProducts,
  updateDropshipProductStatus,
  deleteDropshipProduct,
} from "../requests/product.request";

// Dropshipping queries
export const useCreateDropshipProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, {
    originalProductId: number;
    customProductName: string;
    customDescription: string;
    marketingText?: string;
    additionalImages?: string[];
    markup: number;
  }>({
    mutationFn: async (payload) => {
      const res = await createDropshipProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dropship-products'],
      });
      queryClient.invalidateQueries({
        queryKey: ['available-dropship-products'],
      });
    },
  });
};

export const useAvailableProductsForDropship = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    categoryId?: number;
    priceMin?: number;
    priceMax?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['available-dropship-products', payload],
    queryFn: async () => {
      const res = await getAvailableProductsForDropship(payload);
      return res.data;
    },
    enabled,
  });

export const useDropshipProducts = (
  payload: {
    page: number;
    limit: number;
    status?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['dropship-products', payload],
    queryFn: async () => {
      const res = await getDropshipProducts(payload);
      return res.data;
    },
    enabled,
  });

export const useDropshipEarnings = (enabled = true) =>
  useQuery({
    queryKey: ['dropship-earnings'],
    queryFn: async () => {
      const res = await getDropshipEarnings();
      return res.data;
    },
    enabled,
  });

export const useUpdateDropshipProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, { id: number; status: string }>({
    mutationFn: async ({ id, status }) => {
      const res = await updateDropshipProductStatus(id, status);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dropship-products'],
      });
    },
  });
};

export const useDeleteDropshipProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await deleteDropshipProduct(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dropship-products'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dropship-earnings'],
      });
    },
  });
};
