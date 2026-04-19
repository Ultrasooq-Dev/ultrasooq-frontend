import { useEffect } from "react";
import { findRoomId, getChatHistory, updateUnreadMessages } from "@/apis/requests/chat.requests";
import { generateUniqueNumber } from "@/utils/helper";
import { SellerChatStateReturn } from "./useSellerChatState";
import { buildAttachList } from "./sellerChatUtils";
import { useSellerChatReceive } from "./useSellerChatReceive";

/**
 * Handles room creation/lookup, sending messages, chat history loading,
 * and wires socket-event effects for incoming messages and attachments.
 */
export function useSellerChatMessaging(s: SellerChatStateReturn) {
  const { t, toast, user, socket } = s;
  const receive = useSellerChatReceive(s);

  useEffect(() => {
    if (s.selectedRfqQuote?.sellerID && s.selectedRfqQuote?.buyerID) {
      checkRoomId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.selectedRfqQuote]);

  useEffect(() => {
    if (s.selectedRoom) {
      handleChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.selectedRoom]);

  useEffect(() => {
    if (socket.newMessage) {
      receive.handleNewMessage(socket.newMessage, receive.handleUploadedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.newMessage]);

  useEffect(() => {
    if (socket.newMessage?.rfqId === s.selectedRfqQuote?.rfqQuotesId) {
      handleUpdateNewMessageStatus(socket.newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.newMessage]);

  useEffect(() => {
    if (socket.newAttachment) {
      receive.handleUpdateAttachmentStatus(socket.newAttachment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.newAttachment]);

  const handleUpdateNewMessageStatus = async (message: any) => {
    try {
      if (s.selectedRfqQuote?.rfqQuotesId === message?.rfqId && message?.userId !== user?.id) {
        if (s.selectedRfqQuote?.buyerID && s.selectedRoom) {
          await updateUnreadMessages({ userId: s.selectedRfqQuote?.buyerID, roomId: s.selectedRoom });
        }
      }
    } catch (error) {}
  };

  const sendNewMessage = (
    roomId: number,
    content: string,
    rfqQuoteProductId?: number,
    sellerId?: number,
    requestedPrice?: number,
    suggestForRfqQuoteProductId?: number,
    suggestedProducts?: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number }>,
  ) => {
    const uniqueId = generateUniqueNumber();
    const attach = buildAttachList(s.attachments);
    const newMsg = {
      roomId: "", rfqId: "", content: s.message || content, userId: user?.id,
      user: { firstName: user?.firstName, lastName: user?.lastName, accountName: (user as any)?.accountName },
      rfqQuotesUserId: null, attachments: attach,
      rfqSuggestedProducts: suggestedProducts || [], uniqueId, status: "SD", createdAt: new Date(),
    };
    s.setSelectedChatHistory([...s.selectedChatHistory, newMsg]);
    (socket.sendMessage as any)({
      roomId, content: content || "", rfqId: s.selectedRfqQuote?.rfqQuotesId,
      requestedPrice, rfqQuoteProductId, sellerId, rfqQuotesUserId: s.activeSellerId,
      suggestForRfqQuoteProductId, suggestedProducts, uniqueId, attachments: attach,
    });
  };

  const handleCreateRoom = async (
    content: string,
    rfqQuoteProductId?: number,
    sellerId?: number,
    requestedPrice?: number,
    suggestForRfqQuoteProductId?: number,
    suggestedProducts?: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number }>,
  ) => {
    try {
      const uniqueId = generateUniqueNumber();
      const attach = buildAttachList(s.attachments);
      const newMsg = {
        roomId: "", rfqId: "", content: s.message || content, userId: user?.id,
        user: { firstName: user?.firstName, lastName: user?.lastName, accountName: (user as any)?.accountName },
        rfqQuotesUserId: null, attachments: attach,
        rfqSuggestedProducts: suggestedProducts || [], uniqueId, status: "SD", createdAt: new Date(),
      };
      s.setSelectedChatHistory([...s.selectedChatHistory, newMsg]);
      (socket.cratePrivateRoom as any)({
        participants: [s.selectedRfqQuote?.sellerID, s.selectedRfqQuote?.buyerID],
        content: content || "", rfqId: s.selectedRfqQuote?.rfqQuotesId,
        requestedPrice, rfqQuoteProductId, sellerId, rfqQuotesUserId: s.activeSellerId,
        suggestForRfqQuoteProductId, suggestedProducts, uniqueId, attachments: attach,
      });
    } catch (error) {
      return "";
    }
  };

  const checkRoomId = async () => {
    try {
      const room = await findRoomId({ rfqId: s.selectedRfqQuote?.rfqQuotesId, userId: s.selectedRfqQuote?.sellerID });
      if (room?.data?.roomId) { s.setSelectedRoom(room?.data?.roomId); }
      else { s.setSelectedRoom(null); s.setChatHistoryLoading(false); s.setSelectedChatHistory([]); }
    } catch (error) { s.setChatHistoryLoading(false); }
  };

  const handleChatHistory = async () => {
    try {
      s.setChatHistoryLoading(true);
      const res = await getChatHistory({ roomId: s.selectedRoom });
      if (res?.data?.status === 200) s.setSelectedChatHistory(res.data.data);
      s.setChatHistoryLoading(false);
    } catch (error) { s.setChatHistoryLoading(false); }
  };

  const handleSendMessage = async () => {
    try {
      if (s.message || s.attachments.length) {
        if (s.selectedRoom) { sendNewMessage(s.selectedRoom, s.message); }
        else if (!s.selectedRoom && s.selectedRfqQuote?.sellerID && s.selectedRfqQuote?.buyerID) { handleCreateRoom(s.message); }
        s.setMessage("");
        s.setShowEmoji(false);
      } else {
        toast({ title: t("chat"), description: t("please_type_your_message"), variant: "danger" });
      }
    } catch (error) {
      toast({ title: t("chat"), description: t("failed"), variant: "danger" });
    }
  };

  const handleSendMessageKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    const newData = files.map((file: any) => {
      file.uniqueId = `${user?.id}-${generateUniqueNumber()}`;
      return file;
    });
    s.setAttachments(newData);
  };

  const removeFile = (index: number) => {
    s.setAttachments((prevFiles: any) => prevFiles.filter((_: any, i: any) => i !== index));
  };

  return {
    sendNewMessage, handleCreateRoom, handleSendMessage, handleSendMessageKeyDown,
    handleFileChange, removeFile,
    handleRfqProductPriceUpdate: receive.handleRfqProductPriceUpdate,
  };
}
