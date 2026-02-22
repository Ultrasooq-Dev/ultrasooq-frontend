import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createEMIPayment,
  createOrder,
  createOrderUnAuth,
  createPaymentIntent,
  createPaymentLink,
  createAmwalPayConfig,
  fetchOrderById,
  fetchOrderByIdUnAuth,
  fetchOrderBySellerId,
  fetchOrders,
  fetchOrdersBySellerId,
  preOrderCalculation,
  updateCancelReason,
  updateOrderShippingStatus,
  updateProductStatus,
  fetchVendorOrderStats,
  fetchVendorRecentOrders,
  updateOrderStatus,
  addOrderTracking,
} from "../requests/orders.requests";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import type {
  OrderByIdResponse,
  OrderBySellerIdResponse,
  VendorOrderStatsData,
  VendorRecentOrdersData,
  CreateOrderData,
  PaymentIntentData,
  AmwalPayConfigData,
} from "@/types/order";

export const useOrders = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    orderProductStatus?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["orders", payload],
    queryFn: async () => {
      const res = await fetchOrders(payload);
      return res.data as APIResponse<unknown>;
    },
    enabled,
  });

export const useInfiniteOrders = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    orderProductStatus?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: ["infinite-orders", payload],
    queryFn: async ({ pageParam }) => {
      const queries = payload;
      queries.page = pageParam ?? 1;
      const res = await fetchOrders({ ...payload, page: queries.page });
      return res.data as APIResponse<unknown[]>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: APIResponse<unknown[]> & { page?: number }) => {
      if (Array.isArray(lastPage.data) && lastPage.data.length < payload.limit) return undefined;
      return (lastPage?.page ?? 0) + 1 || 1;
    },
    enabled,
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse<CreateOrderData>,
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createOrder(payload);
      return res.data as APIResponse<CreateOrderData>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-with-login"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-by-user"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreateOrderUnAuth = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse<CreateOrderData>,
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createOrderUnAuth(payload);
      return res.data as APIResponse<CreateOrderData>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-without-login"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-by-device"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation<
    APIResponse<PaymentIntentData>,
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createPaymentIntent(payload);
      return res.data as APIResponse<PaymentIntentData>;
    },
    onSuccess: () => {
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreatePaymentLink = () => {
  return useMutation<
    { data: unknown; message: string; success: boolean },
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createPaymentLink(payload);
      return res.data as { data: unknown; message: string; success: boolean };
    },
    onSuccess: () => {
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreateEMIPayment = () => {
  return useMutation<
    APIResponse,
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createEMIPayment(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreateAmwalPayConfig = () => {
  return useMutation<
    APIResponse<AmwalPayConfigData>,
    APIResponseError,
    Record<string, unknown>
  >({
    mutationFn: async (payload) => {
      const res = await createAmwalPayConfig(payload);
      return res.data as APIResponse<AmwalPayConfigData>;
    },
    onSuccess: () => {
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useOrderById = (
  payload: {
    orderProductId: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["order-by-id", payload],
    queryFn: async () => {
      const res = await fetchOrderById(payload);
      return res.data as OrderByIdResponse;
    },
    enabled,
  });

export const useOrderBySellerId = (
  payload: {
    orderProductId: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["order-by-seller-id", payload],
    queryFn: async () => {
      const res = await fetchOrderBySellerId(payload);
      return res.data as OrderBySellerIdResponse;
    },
    enabled,
  });

export const useOrdersBySellerId = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    orderProductStatus?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["orders-by-seller-id", payload],
    queryFn: async () => {
      const res = await fetchOrdersBySellerId(payload);
      return res.data as APIResponse;
    },
    enabled,
  });

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { orderProductId: number; status: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateProductStatus(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateCancelReason = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { orderProductId: number; cancelReason: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateCancelReason(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateOrderShippingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      orderShippingId: number;
      receipt: string;
    }
  >({
    mutationFn: async (payload) => {
      const res = await updateOrderShippingStatus(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const usePreOrderCalculation = () => {
  return useMutation<
    Record<string, unknown>,
    APIResponseError,
    { cartIds: number[]; serviceCartIds: number[]; userAddressId: number }
  >({
    mutationFn: async (payload) => {
      const res = await preOrderCalculation(payload);
      return res.data as Record<string, unknown>;
    },
    onSuccess: () => {

    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useOrderByIdUnAuth = (
  payload: {
    orderId: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["order-by-id", payload],
    queryFn: async () => {
      const res = await fetchOrderByIdUnAuth(payload);
      return res.data as APIResponse<import("@/types/order").OrderRecord>;
    },
    enabled,
  });

// Vendor Dashboard specific hooks
export const useVendorOrderStats = (enabled = true) =>
  useQuery({
    queryKey: ["vendor-order-stats"],
    queryFn: async () => {
      const res = await fetchVendorOrderStats();
      return res.data as APIResponse<VendorOrderStatsData>;
    },
    enabled,
  });

export const useVendorRecentOrders = (
  payload: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    sellType?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["vendor-recent-orders", payload],
    queryFn: async () => {
      const res = await fetchVendorRecentOrders(payload);
      return res.data as APIResponse<VendorRecentOrdersData>;
    },
    enabled,
  });

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { orderProductId: number; status: string; notes?: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateOrderStatus(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor-order-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-recent-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["orders-by-seller-id"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAddOrderTracking = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { orderProductId: number; trackingNumber: string; carrier: string; notes?: string }
  >({
    mutationFn: async (payload) => {
      const res = await addOrderTracking(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor-recent-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["orders-by-seller-id"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
