import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Hook: auto-invalidate order queries when real-time order:status socket event fires.
 * Use in any page that shows order data.
 */
export const useOrderStatusSync = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
      queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-timeline"] });
    };
    window.addEventListener("order:status:update", handler);
    return () => window.removeEventListener("order:status:update", handler);
  }, [queryClient]);
};
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
  confirmReceipt,
  fetchDeliveryTimeline,
  uploadDeliveryProof,
  fetchPickupCode,
  confirmPickup,
  fetchPendingPickups,
  setPickupWindow,
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

// ================================================================
// DELIVERY MANAGEMENT HOOKS
// ================================================================

export const useConfirmReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number }) => {
      const res = await confirmReceipt(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useDeliveryTimeline = (orderProductId: number, enabled = true) => {
  return useQuery({
    queryKey: ["delivery-timeline", orderProductId],
    queryFn: async () => {
      const res = await fetchDeliveryTimeline({ orderProductId });
      return res?.data;
    },
    enabled: enabled && !!orderProductId,
  });
};

export const useUploadDeliveryProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number; proofUrl: string }) => {
      const res = await uploadDeliveryProof(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-by-seller-id"] });
    },
  });
};

export const usePickupCode = (orderProductId: number, enabled = true) => {
  return useQuery({
    queryKey: ["pickup-code", orderProductId],
    queryFn: async () => {
      const res = await fetchPickupCode({ orderProductId });
      return res?.data;
    },
    enabled: enabled && !!orderProductId,
  });
};

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number; code: string }) => {
      const res = await confirmPickup(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-by-seller-id"] });
      queryClient.invalidateQueries({ queryKey: ["pending-pickups"] });
    },
  });
};

export const usePendingPickups = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["pending-pickups", page, limit],
    queryFn: async () => {
      const res = await fetchPendingPickups({ page, limit });
      return res?.data;
    },
  });
};

export const useSetPickupWindow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      orderProductId: number;
      pickupWindowStart: string;
      pickupWindowEnd: string;
    }) => {
      const res = await setPickupWindow(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-code"] });
      queryClient.invalidateQueries({ queryKey: ["pending-pickups"] });
    },
  });
};

// ─── Complaint + Refund + Bulk + Stage hooks ────────────────────

export const useSubmitComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number; reason: string; description: string }) => {
      const { submitComplaint } = await import("@/apis/requests/orders.requests");
      const res = await submitComplaint(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
    },
  });
};

export const useRequestRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number; reason: string; notes?: string; amount?: number }) => {
      const { requestRefund } = await import("@/apis/requests/orders.requests");
      const res = await requestRefund(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
    },
  });
};

export const useBulkUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductIds: number[]; status: string; notes?: string }) => {
      const { bulkUpdateOrderStatus } = await import("@/apis/requests/orders.requests");
      const res = await bulkUpdateOrderStatus(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useAddDeliveryStageUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderProductId: number; stage: string; note?: string; location?: string }) => {
      const { addDeliveryStageUpdate } = await import("@/apis/requests/orders.requests");
      const res = await addDeliveryStageUpdate(payload);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
    },
  });
};
