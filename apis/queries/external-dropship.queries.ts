import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIResponseError } from "@/utils/types/common.types";
import {
  createExternalStore,
  listExternalStores,
  updateExternalStore,
  deleteExternalStore,
  subscribeProductsToExternalStore,
  unsubscribeProductFromExternalStore,
  getSubscribedProductsForExternalStore,
} from "../requests/external-dropship.requests";

export const useExternalStores = (enabled = true) =>
  useQuery({
    queryKey: ["external-stores"],
    queryFn: async () => {
      const res = await listExternalStores();
      return res.data;
    },
    enabled,
  });

export const useCreateExternalStore = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, { name: string; platform?: string }>({
    mutationFn: async (payload) => {
      const res = await createExternalStore(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-stores"] });
    },
  });
};

export const useUpdateExternalStore = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    APIResponseError,
    { storeId: number; name?: string; platform?: string }
  >({
    mutationFn: async ({ storeId, ...payload }) => {
      const res = await updateExternalStore(storeId, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-stores"] });
    },
  });
};

export const useDeleteExternalStore = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, number>({
    mutationFn: async (storeId) => {
      const res = await deleteExternalStore(storeId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-stores"] });
    },
  });
};

export const useUnsubscribeProductFromExternalStore = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    APIResponseError,
    { storeId: number; productId: number }
  >({
    mutationFn: async ({ storeId, productId }) => {
      const res = await unsubscribeProductFromExternalStore(storeId, productId);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["external-store-subscribed-products", variables.storeId],
      });
    },
  });
};

export const useSubscribeProductsToExternalStore = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    APIResponseError,
    {
      storeId: number;
      productIds: number[];
      externalProductIdMap?: Record<number, string>;
      externalSkuMap?: Record<number, string>;
    }
  >({
    mutationFn: async (payload) => {
      const res = await subscribeProductsToExternalStore(payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["external-store-subscribed-products", variables.storeId],
      });
    },
  });
};

export const useExternalStoreSubscribedProducts = (
  storeId: number | null,
  enabled = true,
) =>
  useQuery({
    queryKey: ["external-store-subscribed-products", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const res = await getSubscribedProductsForExternalStore(storeId);
      return res.data;
    },
    enabled: enabled && !!storeId,
  });
