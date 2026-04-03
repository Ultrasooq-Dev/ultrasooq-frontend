import { APIResponseError, APIResponse } from "../../utils/types/common.types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CreatePrivateRoomRequest, RfqPriceStatusUpdateRequest } from "../../utils/types/chat.types";
import {
  createPrivateRoom,
  getProductDetails,
  updateRfqRequestPriceStatus,
  getProductMessages,
  getAllProductsWithMessages,
  getChannelSummary,
  getChannelConversations,
  getChatHistory,
  togglePinRoom,
  toggleArchiveRoom,
  deleteRoom,
  getRfqProductsForRoom,
} from "../requests/chat.requests";

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

// ─── Messaging System — Real Backend Query Hooks ─────────────

// P1: Channel summary with auto-refresh every 30s
export const useChannelSummary = () => {
  return useQuery({
    queryKey: ["channelSummary"],
    queryFn: getChannelSummary,
    refetchInterval: 30000,
  });
};

// P2: Channel conversations — tree items for a given channel
export const useChannelConversations = (
  channelId: string | null,
  page = 1,
  limit = 50,
) => {
  return useQuery({
    queryKey: ["channelConversations", channelId, page],
    queryFn: () => getChannelConversations(channelId!, page, limit),
    enabled: !!channelId,
  });
};

// P4/P5: Chat message history for a room
export const useChatHistory = (roomId: string | null) => {
  return useQuery({
    queryKey: ["chatMessages", roomId],
    queryFn: async () => {
      const res = await getChatHistory({ roomId: Number(roomId) });
      return res.data;
    },
    enabled: !!roomId,
  });
};

// P6: RFQ products for a room
export const useRfqProductsForRoom = (roomId: string | null) => {
  return useQuery({
    queryKey: ["rfqProducts", roomId],
    queryFn: () => getRfqProductsForRoom(Number(roomId!)),
    enabled: !!roomId,
  });
};

// ─── Mutations: Pin, Archive, Delete ─────────────────────────

export const useTogglePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number) => togglePinRoom(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channelConversations"] });
    },
  });
};

export const useToggleArchive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number) => toggleArchiveRoom(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channelConversations"] });
    },
  });
};

export const useDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number) => deleteRoom(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channelConversations"] });
    },
  });
};