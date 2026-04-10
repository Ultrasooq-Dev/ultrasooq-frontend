"use client";
import { useEffect } from "react";
import { useMessageStore } from "@/lib/messageStore";
import {
  useChannelSummary,
  useChannelConversations,
  useChatHistory,
  useRfqProductsForRoom,
} from "@/apis/queries/chat.queries";
import { useAllRfqQuotesUsersBySellerId } from "@/apis/queries/rfq.queries";

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

  // ─── P2 fallback: RFQ quotes for vendor channel ────────────
  const isRfqChannel = selectedChannelId === "v_rfq";
  const rfqQuotesQuery = useAllRfqQuotesUsersBySellerId(
    { page: 1, limit: 100 },
    isRfqChannel, // only fetch when RFQ channel is selected
  );

  useEffect(() => {
    if (!isRfqChannel || !rfqQuotesQuery.data?.data) return;
    const quotes: any[] = rfqQuotesQuery.data.data;
    if (quotes.length === 0) return;

    // Map RFQ quotes → TreeItem[] for MsgPanel2
    const items = quotes.map((q: any) => {
      const buyer = q.buyerIDDetail || {};
      const products = q.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      const firstName = buyer.firstName || "Buyer";
      const productNames = products.map((p: any) => p.rfqProductDetails?.productName || "Product").join(", ");
      const totalQty = products.reduce((s: number, p: any) => s + (p.quantity || 0), 0);

      return {
        id: String(q.rfqQuotesId || q.id),
        label: `${firstName} — ${products.length} product${products.length > 1 ? "s" : ""}`,
        sublabel: productNames.slice(0, 50) + (productNames.length > 50 ? "..." : ""),
        icon: "session" as const,
        time: q.createdAt
          ? Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 60000)
          : 999,
        unread: q.unreadMsgCount ?? 0,
        online: false,
        children: products.map((p: any, i: number) => ({
          id: `${q.rfqQuotesId || q.id}-p${i}`,
          label: p.rfqProductDetails?.productName || `Product ${i + 1}`,
          lastMsg: p.note ? p.note.slice(0, 40) : `Qty: ${p.quantity || 0}`,
          time: q.createdAt
            ? Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 60000)
            : 999,
          unread: 0,
          online: false,
        })),
      };
    });

    setChannelItems("v_rfq", items);
  }, [isRfqChannel, rfqQuotesQuery.data, setChannelItems]);

  // ─── P6 fallback: RFQ products for selected quote ──────────
  useEffect(() => {
    if (!isRfqChannel || !chatRoomId || !rfqQuotesQuery.data?.data) return;
    const quotes: any[] = rfqQuotesQuery.data.data;
    // Find the quote matching the selected chatRoomId
    const quote = quotes.find((q: any) => String(q.rfqQuotesId || q.id) === chatRoomId);
    if (!quote) return;

    const products = quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
    const mappedProducts = products.map((p: any) => ({
      id: String(p.id || p.rfqProductId),
      requestedName: p.rfqProductDetails?.productName || `Product #${p.rfqProductId}`,
      requestedQty: p.quantity || 1,
      requestedBudget:
        p.offerPriceFrom && p.offerPriceTo
          ? `${p.offerPriceFrom}-${p.offerPriceTo} OMR`
          : p.offerPrice
            ? `${p.offerPrice} OMR`
            : "N/A",
      alternatives: [], // Seller will add their own products via "Add Product from Store"
    }));

    setRfqProducts(chatRoomId, mappedProducts);
  }, [isRfqChannel, chatRoomId, rfqQuotesQuery.data, setRfqProducts]);

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
