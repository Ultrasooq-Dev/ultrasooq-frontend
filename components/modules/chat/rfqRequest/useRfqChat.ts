import { useEffect, useState } from "react";
import { findRoomId, getChatHistory, updateUnreadMessages, uploadAttachment } from "@/apis/requests/chat.requests";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/ui/use-toast";
import { CHAT_REQUEST_MESSAGE } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { generateUniqueNumber } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useRfqSuggestions } from "./useRfqSuggestions";
import { useRfqVendors } from "./useRfqVendors";

export function useRfqChat(
  rfqQuoteId: any,
  layoutMode: "grid" | "column" = "grid",
  viewMode?: "vendors" | "details",
  selectedVendorId?: number | null,
  onSelectVendor?: (vendor: any) => void,
) {
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();

  // Chat state
  const [selectedChatHistory, setSelectedChatHistory] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] = useState<boolean>(false);

  const { sendMessage, cratePrivateRoom, newMessage, newRoom, errorMessage, clearErrorMessage, rfqRequest, newAttachment } = useSocket();

  // Vendor sub-hook
  const vendors = useRfqVendors({ rfqQuoteId, layoutMode, viewMode, selectedVendorId });

  // Suggestions sub-hook
  const suggestions = useRfqSuggestions({
    selectedChatHistory,
    selectedVendor: vendors.selectedVendor,
    selectedRoom,
    onSendMessage: sendNewMessage,
    onRefreshChatHistory: handleChatHistory,
  });

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const list = vendors.allRfqQuotesQuery.data?.data;
    if (!list) return;
    vendors.setVendorList(list);
    if (layoutMode === "grid" && list[0] && !selectedVendorId) {
      vendors.handleRfqProducts(list[0]);
      vendors.setActiveSellerId(list[0]?.sellerID);
      vendors.setRfqQuotesUserId(list[0]?.id);
    }
    if (layoutMode === "column" && selectedVendorId && list.length > 0) {
      const v = list.find((v: any) => v.id === selectedVendorId || v.sellerID === selectedVendorId);
      if (v) { vendors.handleRfqProducts(v); vendors.setActiveSellerId(v?.sellerID); vendors.setRfqQuotesUserId(v?.id); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors.allRfqQuotesQuery.data?.data, selectedVendorId, layoutMode, viewMode]);

  useEffect(() => {
    if (vendors.selectedVendor?.sellerID && vendors.selectedVendor?.buyerID) checkRoomId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors.selectedVendor]);

  useEffect(() => {
    if (newMessage?.rfqId === parseInt(rfqQuoteId)) { handleNewMessage(newMessage); handleUpdateNewMessageStatus(newMessage); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  useEffect(() => {
    if (selectedRoom) handleChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  useEffect(() => {
    if (newRoom?.roomId && (newRoom?.creatorId === vendors.activeSellerId || newRoom?.creatorId === user?.id)) setSelectedRoom(newRoom?.roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRoom]);

  useEffect(() => {
    if (errorMessage) { toast({ title: t("chat"), description: errorMessage, variant: "danger" }); clearErrorMessage(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  useEffect(() => {
    if (rfqRequest) handleRfqRequest(rfqRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqRequest]);

  useEffect(() => {
    if (newAttachment) handleUpdateAttachmentStatus(newAttachment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAttachment]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleUpdateAttachmentStatus(attach: newAttachmentType) {
    try {
      if (attach?.senderId === user?.id) {
        setSelectedChatHistory((prev) => prev.map((item1: any) => ({ ...item1, attachments: item1?.attachments?.map((item2: any) => item2.uniqueId === attach.uniqueId ? { ...item2, status: attach.status, filePath: attach.filePath, presignedUrl: attach.presignedUrl, fileType: attach?.fileType } : item2) })));
      } else {
        const ch = [...selectedChatHistory];
        const idx = ch.findIndex((msg: any) => msg.id === attach.messageId);
        if (idx !== -1) { ch[idx]["attachments"].push(attach); setSelectedChatHistory(ch); }
      }
    } catch { toast({ title: t("chat"), description: t("attachment_update_status_failed"), variant: "danger" }); }
  }

  async function handleUpdateNewMessageStatus(msg: any) {
    try {
      if (vendors.rfqQuotesUserId === msg?.rfqQuotesUserId && msg?.userId !== user?.id && vendors.activeSellerId && selectedRoom) {
        await updateUnreadMessages({ userId: vendors.activeSellerId, roomId: selectedRoom });
      }
    } catch {}
  }

  function handleNewMessage(msg: any) {
    try {
      const { matched, hasPriceRequest, priceRequest } = vendors.applyNewMessage(msg, vendors.activeSellerId, vendors.rfqQuotesUserId);
      if (!matched) return;
      if (selectedRoom === msg?.roomId) {
        const ch = [...selectedChatHistory];
        const idx = ch.findIndex((chat) => chat?.uniqueId === msg?.uniqueId);
        if (idx !== -1) {
          if (ch[idx]?.attachments?.length) handleUploadedFile();
          ch[idx] = { ...msg, attachments: ch[idx]?.attachments || [], status: "sent" };
        } else { ch.push({ ...msg, attachments: [], status: "sent" }); }
        setSelectedChatHistory(ch);
      }
      if (hasPriceRequest) vendors.updateRFQProduct(priceRequest);
    } catch {}
  }

  async function checkRoomId() {
    try {
      const room = await findRoomId({ rfqId: vendors.selectedVendor?.rfqQuotesId, userId: vendors.selectedVendor?.sellerID });
      if (room?.data?.roomId) setSelectedRoom(room?.data?.roomId);
      else { setSelectedRoom(null); setChatHistoryLoading(false); setSelectedChatHistory([]); }
    } catch { setChatHistoryLoading(false); }
  }

  function buildAttachPayload() {
    return attachments.map((att: any) => ({ fileType: att?.type, fileName: att?.name, fileSize: att?.size, filePath: "", fileExtension: att?.name.split(".").pop(), uniqueId: att.uniqueId, status: "UPLOADING" }));
  }

  function buildOptimisticMsg(attach: any[]) {
    return { roomId: "", rfqId: "", content: message, userId: user?.id, user: { firstName: user?.firstName, lastName: user?.lastName }, rfqQuotesUserId: null, attachments: attach, uniqueId: generateUniqueNumber(), status: "SD", createdAt: new Date() };
  }

  function sendNewMessage(roomId: number, content: string, rfqQuoteProductId?: number, buyerId?: number, requestedPrice?: number) {
    const uniqueId = generateUniqueNumber();
    const attach = buildAttachPayload();
    setSelectedChatHistory((prev) => [...prev, { ...buildOptimisticMsg(attach), uniqueId }]);
    sendMessage({ roomId, content, rfqId: parseInt(rfqQuoteId), rfqQuoteProductId, buyerId, requestedPrice, rfqQuotesUserId: vendors.selectedVendor?.id, userId: vendors.activeSellerId, uniqueId, attachments: attach });
  }

  async function handleCreateRoom(content: string, rfqQuoteProductId?: number, buyerId?: number, requestedPrice?: number) {
    try {
      const attach = buildAttachPayload();
      setSelectedChatHistory((prev) => [...prev, buildOptimisticMsg(attach)]);
      cratePrivateRoom({ participants: [vendors.selectedVendor?.sellerID, vendors.selectedVendor?.buyerID], content, rfqId: parseInt(rfqQuoteId), rfqQuoteProductId, buyerId, requestedPrice, rfqQuotesUserId: vendors.selectedVendor?.id, uniqueId: generateUniqueNumber(), attachments: attach });
    } catch { toast({ title: t("chat"), description: t("failed"), variant: "danger" }); }
  }

  async function handleChatHistory() {
    try {
      setChatHistoryLoading(true);
      const res = await getChatHistory({ roomId: selectedRoom });
      if (res?.data?.status === 200) setSelectedChatHistory(res.data.data);
      setChatHistoryLoading(false);
    } catch { setChatHistoryLoading(false); }
  }

  async function handleSendMessage() {
    try {
      if (message || attachments.length) {
        if (selectedRoom) sendNewMessage(selectedRoom, message);
        else if (!selectedRoom && vendors.selectedVendor?.sellerID && vendors.selectedVendor?.buyerID) handleCreateRoom(message);
        setMessage(""); setShowEmoji(false);
      } else toast({ title: t("chat"), description: t("please_type_your_message"), variant: "danger" });
    } catch { toast({ title: t("chat"), description: t("failed"), variant: "danger" }); }
  }

  function handleSendMessageKeyDown(e: any) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }

  function handleRequestPrice(productId: number, requestedPrice: number) {
    if (selectedRoom && requestedPrice) sendNewMessage(selectedRoom, CHAT_REQUEST_MESSAGE.priceRequest.value, productId, vendors.selectedVendor?.buyerID, requestedPrice);
    else if (!selectedRoom && requestedPrice && vendors.selectedVendor?.sellerID && vendors.selectedVendor?.buyerID) handleCreateRoom(CHAT_REQUEST_MESSAGE.priceRequest.value, productId, vendors.selectedVendor?.buyerID, requestedPrice);
  }

  function handleRfqRequest(rRequest: { id: number; messageId: number; requestedPrice: number; rfqQuoteProductId: number; status: string; requestedById: number; newTotalOfferPrice: number }) {
    const ch = [...selectedChatHistory];
    const index = ch.findIndex((chat) => chat.id === rRequest.messageId);
    if (index !== -1) { const cur = ch[index]; ch[index] = { ...cur, rfqProductPriceRequest: { ...cur.rfqProductPriceRequest, status: rRequest.status } }; setSelectedChatHistory(ch); }
    vendors.updateRFQProduct(rRequest);
  }

  async function handleUploadedFile() {
    if (!attachments?.length) return;
    setIsAttachmentUploading(true);
    await Promise.all(attachments.map(async (file: any) => { const fd = new FormData(); fd.append("content", file); fd.append("uniqueId", file.uniqueId); try { await uploadAttachment(fd); } catch {} }));
    setAttachments([]); setIsAttachmentUploading(false);
  }

  function handleFileChange(e: any) { setAttachments(Array.from(e.target.files).map((file: any) => { file.uniqueId = `${user?.id}-${generateUniqueNumber()}`; return file; })); }
  function removeFile(index: number) { setAttachments((prev: any) => prev.filter((_: any, i: any) => i !== index)); }
  function onEmojiClick(emojiObject: { emoji: string }) { setMessage((prev) => prev + emojiObject.emoji); }

  return {
    // vendor state
    ...vendors,
    // chat state
    selectedChatHistory, selectedRoom, chatHistoryLoading, message, showEmoji, attachments, isAttachmentUploading,
    // setters
    setMessage, setShowEmoji,
    // handlers
    handleSendMessage, handleSendMessageKeyDown, handleRequestPrice, handleFileChange, removeFile, onEmojiClick, handleChatHistory,
    // suggestions
    ...suggestions,
    handleSendUpdateToVendor: suggestions.handleSendUpdateToVendor,
    handleCheckout: () => suggestions.handleCheckout(vendors.canCheckoutFn),
    onSelectVendor,
  };
}
