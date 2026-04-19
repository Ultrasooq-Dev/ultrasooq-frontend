import { newAttachmentType } from "@/context/SocketContext";
import { uploadAttachment } from "@/apis/requests/chat.requests";
import { SellerChatStateReturn } from "./useSellerChatState";

/**
 * Handles all received socket events that mutate chat history or quote products:
 * new messages, attachment status updates, and RFQ price updates.
 */
export function useSellerChatReceive(s: SellerChatStateReturn) {
  const { t, toast, user } = s;

  const handleUploadedFile = async () => {
    if (s.attachments?.length) {
      s.setIsAttachmentUploading(true);
      await Promise.all(
        s.attachments.map(async (file: any) => {
          const formData = new FormData();
          formData.append("content", file);
          formData.append("uniqueId", file.uniqueId);
          try { await uploadAttachment(formData); } catch (error) {}
        }),
      );
      s.setAttachments([]);
      s.setIsAttachmentUploading(false);
    }
  };

  const handleUpdateAttachmentStatus = (attach: newAttachmentType) => {
    try {
      if (attach?.senderId === user?.id) {
        s.setSelectedChatHistory((prev: any[]) =>
          prev.map((item1: any) => ({
            ...item1,
            attachments: item1?.attachments?.map((item2: any) =>
              item2.uniqueId === attach.uniqueId
                ? { ...item2, status: attach.status, filePath: attach.filePath, presignedUrl: attach.presignedUrl, fileType: attach?.fileType }
                : item2,
            ),
          })),
        );
      } else {
        const chatHistory = [...s.selectedChatHistory];
        const index = chatHistory.findIndex((msg: any) => msg.id === attach.messageId);
        if (index !== -1) {
          chatHistory[index]["attachments"].push(attach);
          s.setSelectedChatHistory(chatHistory);
        }
      }
    } catch (error) {
      toast({ title: t("chat"), description: t("attachment_update_status_failed"), variant: "danger" });
    }
  };

  const handleRfqProductPriceUpdate = (rRequest: {
    id: number; messageId: number; requestedPrice: number; rfqQuoteProductId: number;
    requestedById: number; status: string; newTotalOfferPrice: number;
  }) => {
    if (
      s.selectedRfqQuote?.buyerID === rRequest?.requestedById ||
      (rRequest?.requestedById === user?.id && rRequest?.status === "REJECTED")
    ) {
      const index = s.quoteProducts.findIndex((product: any) => product.id === rRequest.rfqQuoteProductId);
      if (index !== -1) {
        const pList = [...s.quoteProducts];
        const product = { ...pList[index] };
        let offerPrice = product.offerPrice;
        if (rRequest.status === "APPROVED") offerPrice = rRequest?.requestedPrice;
        let priceRequest = product?.priceRequest ? { ...product.priceRequest } : null;
        priceRequest = priceRequest
          ? { ...priceRequest, id: rRequest.id, requestedPrice: rRequest.requestedPrice, rfqQuoteProductId: rRequest.rfqQuoteProductId, status: rRequest?.status }
          : { ...rRequest };
        product.priceRequest = priceRequest;
        product.offerPrice = offerPrice;
        pList[index] = product;
        s.setQuoteProducts(pList);
      }
    }
  };

  const handleNewMessage = (message: any, handleUpload: () => void) => {
    try {
      const index = s.rfqQuotes.findIndex((rfq: any) => message?.rfqId === rfq.rfqQuotesId);
      if (index !== -1) {
        const rfqList = [...s.rfqQuotes];
        const [item] = rfqList.splice(index, 1);
        let newItem = { ...item, lastUnreadMessage: { content: message.content, createdAt: message.createdAt } };
        if (s.selectedRfqQuote?.rfqQuotesId !== message?.rfqId) {
          newItem = { ...newItem, unreadMsgCount: newItem?.unreadMsgCount + 1 };
        }
        rfqList.unshift(newItem);
        s.setRfqQuotes(rfqList);
        if (s.selectedRfqQuote?.rfqQuotesId === message.rfqId) {
          const chatHistory = [...s.selectedChatHistory];
          const idx = chatHistory.findIndex((chat) => chat?.uniqueId === message?.uniqueId);
          if (idx !== -1) {
            if (chatHistory[idx]?.attachments?.length) handleUpload();
            chatHistory[idx] = { ...message, attachments: chatHistory[idx]?.attachments || [], status: "sent" };
          } else {
            chatHistory.push({ ...message, attachments: [], status: "sent" });
          }
          s.setSelectedChatHistory(chatHistory);
        }
        if (message?.rfqProductPriceRequest) {
          handleRfqProductPriceUpdate(message?.rfqProductPriceRequest);
        }
      }
    } catch (error) {}
  };

  return { handleUpdateAttachmentStatus, handleRfqProductPriceUpdate, handleNewMessage, handleUploadedFile };
}
