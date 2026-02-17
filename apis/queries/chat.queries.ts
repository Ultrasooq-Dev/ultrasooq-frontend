import { APIResponseError, APIResponse } from "../../utils/types/common.types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CreatePrivateRoomRequest, RfqPriceStatusUpdateRequest } from "../../utils/types/chat.types";
import { createPrivateRoom, getProductDetails, updateRfqRequestPriceStatus, getProductMessages, getAllProductsWithMessages } from "../requests/chat.requests";

export const useCreatePrivateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse & { id: string },
    APIResponseError,
    CreatePrivateRoomRequest
  >({
    mutationFn: async (payload) => {
      const res = await createPrivateRoom(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateRfqPriceRequestStatus = () => {
  return useMutation<
    APIResponse,
    APIResponseError,
    RfqPriceStatusUpdateRequest
  >({
    mutationFn: async (payload) => {
      const res = await updateRfqRequestPriceStatus(payload);
      return res.data;
    },
    onError: (err: APIResponseError) => {
    },
  });
};


export const useGetProductDetails = (
  productId: number,
  enabled = true,
) =>
  useQuery({
    queryKey: ["productId", productId],
    queryFn: async () => {
      const res = await getProductDetails(productId);
      return res.data;
    },
    enabled,
  });

export const useGetAllProductsWithMessages = (sellerId: number, enabled = true) =>
  useQuery({
    queryKey: ["allProductsWithMessages", sellerId],
    queryFn: async () => {
      const res = await getAllProductsWithMessages(sellerId);
      return res.data;
    },
    enabled: enabled && !!sellerId,
    refetchInterval: 30000, // Refetch every 30 seconds to get new messages
  });