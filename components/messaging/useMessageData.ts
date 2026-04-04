"use client";
import { useEffect } from "react";
import { useMessageStore } from "@/lib/messageStore";
import {
  useChannelSummary,
  useChannelConversations,
  useChatHistory,
  useRfqProductsForRoom,
} from "@/apis/queries/chat.queries";

/**
 * Fetches real data from backend APIs and pushes it into the Zustand store.
 * Mount once in the messages page alongside useMessageSocketBridge.
 *
 * Pattern: TanStack Query fetches -> useEffect pushes into Zustand -> Panels read from Zustand.
 * If the store is empty (API returned nothing / not loaded yet), panels fall back to mock data.
 */
export function useMessageData() {
  const {
    selectedChannelId,
    chatRoomId,
    setChannelCounts,
    setChannelItems,
    setMessages,
    setRfqProducts,
  } = useMessageStore();

  // ─── P1: Channel summary (auto-refresh 30s) ───────────────
  const { data: summaryData } = useChannelSummary();

  useEffect(() => {
    if (summaryData?.data) {
      setChannelCounts(summaryData.data);
    }
  }, [summaryData, setChannelCounts]);

  // ─── P2: Channel conversations (when channel selected) ────
  const { data: convoData } = useChannelConversations(selectedChannelId);

  useEffect(() => {
    if (selectedChannelId && convoData?.data) {
      // Map API response to TreeItem format expected by the store
      const items = convoData.data.map((room: any) => ({
        id: String(room.id),
        label: room.name || `Room #${room.id}`,
        sublabel: room.lastMessage?.content ?? "",
        icon:
          room.type === "rfq"
            ? "session"
            : room.type === "product"
              ? "product"
              : "person",
        time: room.lastMessageAt
          ? Math.floor(
              (Date.now() - new Date(room.lastMessageAt).getTime()) / 60000,
            )
          : 999,
        unread: room.unreadCount ?? 0,
        online: room.otherParticipantOnline ?? false,
        children: room.children?.map((ch: any) => ({
          id: String(ch.id),
          label: ch.name || ch.label || `Room #${ch.id}`,
          lastMsg: ch.lastMessage?.content ?? "",
          time: ch.lastMessageAt
            ? Math.floor(
                (Date.now() - new Date(ch.lastMessageAt).getTime()) / 60000,
              )
            : 999,
          unread: ch.unreadCount ?? 0,
          online: ch.otherParticipantOnline ?? false,
        })),
      }));
      setChannelItems(selectedChannelId, items);
    }
  }, [selectedChannelId, convoData, setChannelItems]);

  // ─── P4/P5: Chat messages (when room selected) ────────────
  const { data: msgData } = useChatHistory(chatRoomId);

  useEffect(() => {
    if (chatRoomId && msgData?.data) {
      const messages = msgData.data.map((m: any) => ({
        id: String(m.id),
        roomId: String(m.roomId),
        senderId: m.userId ?? m.user?.id ?? 0,
        senderName: m.user?.firstName ?? m.user?.name ?? "User",
        content: m.content ?? "",
        contentType: m.contentType ?? "text",
        createdAt: m.createdAt ?? new Date().toISOString(),
        readAt: m.status === "READ" ? m.updatedAt : null,
        attachments:
          m.attachments?.map((a: any) => ({
            url: a.presignedUrl ?? a.filePath,
            name: a.fileName,
            type: a.fileType,
          })) ?? [],
      }));
      setMessages(chatRoomId, messages);
    }
  }, [chatRoomId, msgData, setMessages]);

  // ─── P6: RFQ products (when room selected) ────────────────
  const { data: rfqData } = useRfqProductsForRoom(chatRoomId);

  useEffect(() => {
    if (chatRoomId && rfqData?.data) {
      const products = rfqData.data.map((p: any) => ({
        id: String(p.id),
        requestedName:
          p.requestedName ??
          p.rfqProductDetails?.productName_en ??
          `Product #${p.id}`,
        requestedQty: p.quantity ?? 1,
        requestedBudget:
          p.offerPriceFrom && p.offerPriceTo
            ? `${p.offerPriceFrom}-${p.offerPriceTo} OMR`
            : p.offerPrice
              ? `${p.offerPrice} OMR`
              : "N/A",
        alternatives: (p.alternatives ?? p.suggestedProducts ?? []).map(
          (a: any) => ({
            id: String(a.id),
            name:
              a.suggestedProduct?.productName_en ??
              a.name ??
              `Alt #${a.id}`,
            seller: a.vendor?.firstName ?? a.seller ?? "Vendor",
            price: Number(a.offerPrice ?? a.price ?? 0),
            stock: a.quantity ?? a.stock ?? 0,
            rating: a.suggestedProduct?.averageRating ?? 4.5,
          }),
        ),
      }));
      setRfqProducts(chatRoomId, products);
    }
  }, [chatRoomId, rfqData, setRfqProducts]);
}
