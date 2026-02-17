import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import AttachIcon from "@/public/images/attach.svg";
import SmileIcon from "@/public/images/smile.svg";
import Link from "next/link";
import SendIcon from "@/public/images/send-button.png";
import OfferPriceCard from "@/components/modules/rfqRequest/OfferPriceCard";
import {
  useAllRfqQuotesUsersBySellerId,
  useHideRfqRequest,
} from "@/apis/queries/rfq.queries";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import {
  findRoomId,
  getChatHistory,
  updateUnreadMessages,
  uploadAttachment,
} from "@/apis/requests/chat.requests";
import RequestProductCard from "@/components/modules/rfqRequest/RequestProductCard";
import SellerChatHistory from "./SellerChatHistory";
import ProductSuggestionModal from "../ProductSuggestionModal";
import { useToast } from "@/components/ui/use-toast";
import { CHAT_REQUEST_MESSAGE } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { generateUniqueNumber } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import moment from "moment";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/orderStore";
import { cn } from "@/lib/utils";

interface RfqQuoteType {
  id: number;
  rfqQuotesId: number;
  offerPrice: string;
  buyerID: number;
  buyerIDDetail: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  rfqQuotesUser_rfqQuotes: {
    rfqQuotesProducts: {
      rfqProductDetails: {
        productImages: {
          id: number;
          image: string;
        }[];
      };
    }[];
    rfqQuotes_rfqQuoteAddress: {
      address: string;
      rfqDate: string;
    };
  };
  lastUnreadMessage: {
    content: string;
    createdAt: string;
  };
  unreadMsgCount: number;
}
interface SellerChatProps {
  layoutMode?: "grid" | "column";
  viewMode?: "rfqRequests" | "customers" | "details";
  selectedRfqId?: number | null;
  selectedCustomerId?: number | null;
  onSelectRfq?: (rfq: any, rfqGroup?: any[]) => void;
  onSelectCustomer?: (customer: any) => void;
  displayMode?: "card" | "list"; // New prop to control card vs list display
}

const SellerChat: React.FC<SellerChatProps> = ({
  layoutMode = "grid",
  viewMode = "rfqRequests",
  selectedRfqId = null,
  selectedCustomerId = null,
  onSelectRfq,
  onSelectCustomer,
  displayMode = "card", // Default to card view
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const [activeSellerId, setActiveSellerId] = useState<number | undefined>();
  const [quoteProducts, setQuoteProducts] = useState<any[]>([]);
  const [rfqQuotes, setRfqQuotes] = useState<any[]>([]);
  const [selectedRfqQuote, setSelectedRfqQuote] = useState<any>("");
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false);
  const [selectedChatHistory, setSelectedChatHistory] = useState<any>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<any>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] =
    useState<boolean>(false);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [showProductSuggestionModal, setShowProductSuggestionModal] = useState<boolean>(false);
  const [suggestingForProductId, setSuggestingForProductId] = useState<number | null>(null);
  const [suggestingForProductQuantity, setSuggestingForProductQuantity] = useState<number>(1);
  const [editingPriceProductId, setEditingPriceProductId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [showHiddenRequests, setShowHiddenRequests] = useState<boolean>(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  // Track pending price updates (productId -> price) that haven't been sent yet
  const [pendingPriceUpdates, setPendingPriceUpdates] = useState<Map<number, number>>(new Map());
  // Track pending suggestion updates (productId -> suggested products array) that haven't been sent yet
  const [pendingSuggestionUpdates, setPendingSuggestionUpdates] = useState<Map<number, Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>>>(new Map());
  // Track if there are unsent changes (price updates or suggestion changes)
  const [hasPendingUpdates, setHasPendingUpdates] = useState<boolean>(false);
  const {
    sendMessage,
    cratePrivateRoom,
    newMessage,
    newRoom,
    errorMessage,
    clearErrorMessage,
    rfqRequest,
    newAttachment,
  } = useSocket();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const orderStore = useOrderStore();

  const allRfqQuotesQuery = useAllRfqQuotesUsersBySellerId({
    page: 1,
    limit: 10,
    showHidden: showHiddenRequests,
  });

  // Helper: collect suggested products for a given RFQ quote product from chat history.
  // We dedupe by suggestedProductId and always keep the latest entry,
  // so updates (or soft-deletes via quantity 0) override older ones.
  const getSuggestionsForRfqQuoteProduct = (productId: number) => {
    const suggestions = selectedChatHistory
      .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
      .filter((s: any) => s?.rfqQuoteProductId === productId);

    // Map by suggestedProductId so the last occurrence wins
    const byProductId = new Map<number, any>();
    suggestions.forEach((s: any) => {
      if (!s?.suggestedProductId) return;
      byProductId.set(s.suggestedProductId, s);
    });

    // Merge pending suggestions (these override existing ones)
    const pendingSuggestions = pendingSuggestionUpdates.get(productId) || [];
    pendingSuggestions.forEach((pending: any) => {
      if (pending.suggestedProductId) {
        // Convert pending suggestion format to match chat history format
        // Include product details if available
        byProductId.set(pending.suggestedProductId, {
          rfqQuoteProductId: productId,
          suggestedProductId: pending.suggestedProductId,
          offerPrice: pending.offerPrice,
          quantity: pending.quantity,
          suggestedProduct: pending.productDetails, // Include product details for display
        });
      }
    });

    return Array.from(byProductId.values());
  };

  const hideRfqRequestMutation = useHideRfqRequest();

  const handleHideRequest = async (
    e: React.MouseEvent,
    rfqQuotesUserId: number,
  ) => {
    e.stopPropagation(); // Prevent card click
    try {
      await hideRfqRequestMutation.mutateAsync({
        rfqQuotesUserId,
        isHidden: true,
      });
      // Remove from local state immediately if showing visible requests
      if (!showHiddenRequests) {
        setRfqQuotes((prev) =>
          prev.filter((quote) => quote.id !== rfqQuotesUserId),
        );
      }
      toast({
        title: t("success") || "Success",
        description: "Request hidden successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: "Failed to hide request",
        variant: "danger",
      });
    }
  };

  const handleUnhideRequest = async (
    e: React.MouseEvent,
    rfqQuotesUserId: number,
  ) => {
    e.stopPropagation(); // Prevent card click
    try {
      await hideRfqRequestMutation.mutateAsync({
        rfqQuotesUserId,
        isHidden: false,
      });
      // Remove from local state immediately if showing hidden requests
      if (showHiddenRequests) {
        setRfqQuotes((prev) =>
          prev.filter((quote) => quote.id !== rfqQuotesUserId),
        );
      }
      toast({
        title: t("success") || "Success",
        description: "Request unhidden successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: "Failed to unhide request",
        variant: "danger",
      });
    }
  };

  const handleToggleSelect = (rfqQuotesUserId: number) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rfqQuotesUserId)) {
        newSet.delete(rfqQuotesUserId);
      } else {
        newSet.add(rfqQuotesUserId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRequests.size === groupedRfqQuotes.length) {
      setSelectedRequests(new Set());
    } else {
      const allIds = new Set(
        groupedRfqQuotes.map((group) => group[0].id),
      );
      setSelectedRequests(allIds);
    }
  };

  const handleBulkHide = async () => {
    if (selectedRequests.size === 0) {
      toast({
        title: t("error") || "Error",
        description: "Please select at least one request",
        variant: "danger",
      });
      return;
    }

    try {
      const selectedIds = Array.from(selectedRequests);
      const promises = selectedIds.map((id) =>
        hideRfqRequestMutation.mutateAsync({
          rfqQuotesUserId: id,
          isHidden: !showHiddenRequests, // If showing hidden, unhide them; otherwise hide them
        }),
      );

      await Promise.all(promises);
      
      // Remove from local state immediately
      setRfqQuotes((prev) =>
        prev.filter((quote) => !selectedIds.includes(quote.id)),
      );
      
      toast({
        title: t("success") || "Success",
        description: `${
          showHiddenRequests ? "Unhidden" : "Hidden"
        } ${selectedRequests.size} request${selectedRequests.size > 1 ? "s" : ""} successfully`,
        variant: "success",
      });
      setSelectedRequests(new Set());
      setIsSelectMode(false);
    } catch (error) {
      toast({
        title: t("error") || "Error",
        description: `Failed to ${showHiddenRequests ? "unhide" : "hide"} requests`,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    const rfqQuotesDetails = allRfqQuotesQuery.data?.data;

    if (rfqQuotesDetails) {
      // Always update state, even if empty array (to clear hidden items)
      setRfqQuotes(rfqQuotesDetails);
      // Don't auto-select first item - let user click on cards
      // setActiveSellerId(rfqQuotesDetails[0]?.id);
      // setSelectedRfqQuote(rfqQuotesDetails[0]);
      // handleRfqProducts(rfqQuotesDetails[0]);
    }
  }, [allRfqQuotesQuery.data?.data]);

  // check room id
  useEffect(() => {
    if (selectedRfqQuote?.sellerID && selectedRfqQuote?.buyerID) {
      checkRoomId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRfqQuote]);

  // get chat history
  useEffect(() => {
    if (selectedRoom) {
      handleChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  // receive a messaage
  useEffect(() => {
    if (newMessage) {
      handleNewMessage(newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // update the new message status
  useEffect(() => {
    if (newMessage?.rfqId === selectedRfqQuote?.rfqQuotesId) {
      handleUpdateNewMessageStatus(newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // if new room crated
  useEffect(() => {
    if (newRoom?.roomId) {
      setSelectedRoom(newRoom?.roomId);
    }
  }, [newRoom]);

  // if rfqRequest
  useEffect(() => {
    if (rfqRequest) {
      handleRfqRequest(rfqRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqRequest]);

  // if any error exception
  useEffect(() => {
    if (errorMessage) {
      toast({
        title: t("chat"),
        description: errorMessage,
        variant: "danger",
      });
      clearErrorMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  // Update attachment status
  useEffect(() => {
    if (newAttachment) {
      handleUpdateAttachmentStatus(newAttachment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAttachment]);

  const handleUpdateAttachmentStatus = (attach: newAttachmentType) => {
    try {
      if (attach?.senderId === user?.id) {
        setSelectedChatHistory((prevChatHistory: any[]) =>
          prevChatHistory.map((item1: any) => ({
            ...item1,
            attachments: item1?.attachments?.map((item2: any) =>
              item2.uniqueId === attach.uniqueId
                ? {
                    ...item2,
                    status: attach.status,
                    filePath: attach.filePath,
                    presignedUrl: attach.presignedUrl,
                    fileType: attach?.fileType,
                  }
                : item2,
            ),
          })),
        );
      } else {
        const chatHistory = [...selectedChatHistory];
        const index = chatHistory.findIndex(
          (message: any) => message.id === attach.messageId,
        );
        if (index !== -1) {
          chatHistory[index]["attachments"].push(attach);
          setSelectedChatHistory(chatHistory);
        }
      }
    } catch (error) {
      toast({
        title: t("chat"),
        description: t("attachment_update_status_failed"),
        variant: "danger",
      });
    }
  };

  const handleUpdateNewMessageStatus = async (message: any) => {
    try {
      if (
        selectedRfqQuote?.rfqQuotesId === message?.rfqId &&
        message?.userId !== user?.id
      ) {
        if (selectedRfqQuote?.buyerID && selectedRoom) {
          const payload = {
            userId: selectedRfqQuote?.buyerID,
            roomId: selectedRoom,
          };
          await updateUnreadMessages(payload);
        }
      }
    } catch (error) {}
  };

  const handleNewMessage = (message: any) => {
    try {
      const index = rfqQuotes.findIndex(
        (rfq: any) => message?.rfqId === rfq.rfqQuotesId,
      );
      if (index !== -1) {
        const rfqList = [...rfqQuotes];
        const [item] = rfqList.splice(index, 1);
        let newItem = {
          ...item,
          lastUnreadMessage: {
            content: message.content,
            createdAt: message.createdAt,
          },
        };

        if (selectedRfqQuote?.rfqQuotesId !== message?.rfqId) {
          newItem = {
            ...newItem,
            unreadMsgCount: newItem?.unreadMsgCount + 1,
          };
        }
        rfqList.unshift(newItem);
        setRfqQuotes(rfqList);
        if (selectedRfqQuote?.rfqQuotesId === message.rfqId) {
          const chatHistory = [...selectedChatHistory];
          const index = chatHistory.findIndex(
            (chat) => chat?.uniqueId === message?.uniqueId,
          );
          if (index !== -1) {
            // upload attachment once the message saved in draft mode, if attachments are selected
            if (chatHistory[index]?.attachments?.length) handleUploadedFile();

            const nMessage = {
              ...message,
              attachments: chatHistory[index]?.attachments || [],
              status: "sent",
            };
            chatHistory[index] = nMessage;
          } else {
            const nMessage = {
              ...message,
              attachments: [],
              status: "sent",
            };
            chatHistory.push(nMessage);
          }
          setSelectedChatHistory(chatHistory);
        }

        if (message?.rfqProductPriceRequest) {
          updateRFQProduct(message?.rfqProductPriceRequest);
        }
      }
    } catch (error) {}
  };

  const handleSendMessage = async () => {
    try {
      if (message || attachments.length) {
        if (selectedRoom) {
          sendNewMessage(selectedRoom, message);
        } else if (
          !selectedRoom &&
          selectedRfqQuote?.sellerID &&
          selectedRfqQuote?.buyerID
        ) {
          handleCreateRoom(message);
        }
        setMessage("");
        setShowEmoji(false);
      } else {
        toast({
          title: t("chat"),
          description: t("please_type_your_message"),
          variant: "danger",
        });
      }
    } catch (error) {
      toast({
        title: t("chat"),
        description: t("failed"),
        variant: "danger",
      });
    }
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
    const attach = attachments.map((att: any) => {
      const extension = att?.name.split(".").pop();
      return {
        fileType: att?.type,
        fileName: att?.name,
        fileSize: att?.size,
        filePath: "",
        fileExtension: extension,
        uniqueId: att.uniqueId,
        status: "UPLOADING",
      };
    });

    const newMessage = {
      roomId: "",
      rfqId: "",
      content: message || content,
      userId: user?.id,
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        accountName: user?.accountName,
      },
      rfqQuotesUserId: null,
      attachments: attach,
      rfqSuggestedProducts: suggestedProducts || [],
      uniqueId,
      status: "SD",
      createdAt: new Date(),
    };
    const chatHistory = [...selectedChatHistory];
    chatHistory.push(newMessage);
    setSelectedChatHistory(chatHistory);

    const msgPayload = {
      roomId: roomId,
      content: content || "",
      rfqId: selectedRfqQuote?.rfqQuotesId,
      requestedPrice,
      rfqQuoteProductId,
      sellerId,
      rfqQuotesUserId: activeSellerId,
      suggestForRfqQuoteProductId,
      suggestedProducts,
      uniqueId,
      attachments: attach,
    };
    sendMessage(msgPayload);
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
      const attach = attachments.map((att: any) => {
        const extension = att?.name.split(".").pop();
        return {
          fileType: att?.type,
          fileName: att?.name,
          fileSize: att?.size,
          filePath: "",
          uniqueId: att.uniqueId,
          fileExtension: extension,
          status: "UPLOADING",
        };
      });

      const newMessage = {
        roomId: "",
        rfqId: "",
        content: message || content,
        userId: user?.id,
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          accountName: user?.accountName,
        },
        rfqQuotesUserId: null,
        attachments: attach,
        rfqSuggestedProducts: suggestedProducts || [],
        uniqueId,
        status: "SD",
        createdAt: new Date(),
      };
      const chatHistory = [...selectedChatHistory];
      chatHistory.push(newMessage);
      setSelectedChatHistory(chatHistory);

      const payload = {
        participants: [selectedRfqQuote?.sellerID, selectedRfqQuote?.buyerID],
        content: content || "",
        rfqId: selectedRfqQuote?.rfqQuotesId,
        requestedPrice,
        rfqQuoteProductId,
        sellerId,
        rfqQuotesUserId: activeSellerId,
        suggestForRfqQuoteProductId,
        suggestedProducts,
        uniqueId,
        attachments: attach,
      };
      cratePrivateRoom(payload);
    } catch (error) {
      return "";
    }
  };

  const checkRoomId = async () => {
    try {
      const payloadRoomFind = {
        rfqId: selectedRfqQuote?.rfqQuotesId,
        userId: selectedRfqQuote?.sellerID,
      };
      const room = await findRoomId(payloadRoomFind);
      if (room?.data?.roomId) {
        setSelectedRoom(room?.data?.roomId);
      } else {
        setSelectedRoom(null);
        setChatHistoryLoading(false);
        setSelectedChatHistory([]);
      }
    } catch (error) {
      setChatHistoryLoading(false);
    }
  };

  const handleChatHistory = async () => {
    try {
      setChatHistoryLoading(true);
      const payload = {
        roomId: selectedRoom,
      };
      const res = await getChatHistory(payload);
      if (res?.data?.status === 200) {
        setSelectedChatHistory(res.data.data);
      }
      setChatHistoryLoading(false);
    } catch (error) {
      setChatHistoryLoading(false);
    }
  };

  const handleSendMessageKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // NEW: Handle product selection from modal
  const handleProductsSelected = async (
    products: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>,
  ) => {
    if (!suggestingForProductId || !selectedRfqQuote || !user?.id) return;

    // Store suggestion updates locally - don't send message yet
    // Message will be sent only when "Send Update" is pressed
    setPendingSuggestionUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.set(suggestingForProductId, products);
      return newMap;
    });
    setHasPendingUpdates(true);

    setShowProductSuggestionModal(false);
    setSuggestingForProductId(null);
    setSuggestingForProductQuantity(1);
  };

  const handleRequestPrice = (productId: number, requestedPrice: number) => {
    // Store the price update locally - don't send message yet
    // Message will be sent only when "Send Update" is pressed
    if (requestedPrice && requestedPrice > 0) {
      setPendingPriceUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(productId, requestedPrice);
        return newMap;
      });
      setHasPendingUpdates(true);
    }

    if (requestedPrice) {
      setHasPendingUpdates(true);
    }
  };

  // Handle sending update notification to customer
  const handleSendUpdate = async () => {
    if (!selectedRfqQuote?.sellerID || !hasPendingUpdates) return;

    // Ensure room exists before sending updates
    if (!selectedRoom && selectedRfqQuote?.buyerID) {
      // Create room first if it doesn't exist - use empty content for initial room creation
      await handleCreateRoom(
        "", // Empty content for room creation
        undefined, // productId
        selectedRfqQuote.sellerID,
        undefined, // requestedPrice
      );
    }

    if (!selectedRoom) return;

    // Send all pending price updates first (with empty content - no chat message)
    for (const [productId, price] of pendingPriceUpdates.entries()) {
      sendNewMessage(
        selectedRoom,
        "", // Empty content - no chat message, just update the price in backend
        productId,
        selectedRfqQuote.sellerID,
        price,
      );
    }

    // Send all pending suggestion updates
    for (const [productId, suggestedProducts] of pendingSuggestionUpdates.entries()) {
      // Strip productDetails before sending (backend doesn't need it)
      const productsToSend = suggestedProducts.map((p: any) => ({
        suggestedProductId: p.suggestedProductId,
        offerPrice: p.offerPrice,
        quantity: p.quantity,
      }));
      sendNewMessage(
        selectedRoom,
        "", // Empty content - no chat message
        undefined, // rfqQuoteProductId - not a price request
        selectedRfqQuote.sellerID,
        undefined, // requestedPrice
        productId, // suggestForRfqQuoteProductId
        productsToSend, // suggestedProducts
      );
    }

    // Then send the notification message (only this one will appear in chat)
    const updateMessage =
      "Vendor made update in product list, you can check.";

    sendNewMessage(
      selectedRoom,
      updateMessage,
      undefined, // rfqQuoteProductId
      selectedRfqQuote.sellerID,
      undefined, // requestedPrice
      undefined, // suggestForRfqQuoteProductId
      undefined, // suggestedProducts
    );

    // Clear pending updates after sending
    setPendingPriceUpdates(new Map());
    setPendingSuggestionUpdates(new Map());
    setHasPendingUpdates(false);
  };

  const handleRfqRequest = (rRequest: {
    id: number;
    messageId: number;
    requestedPrice: number;
    rfqQuoteProductId: number;
    requestedById: number;
    status: string;
    newTotalOfferPrice: number;
  }) => {
    const chatHistory = [...selectedChatHistory];
    const index = chatHistory.findIndex(
      (chat) => chat.id === rRequest.messageId,
    );
    if (index !== -1) {
      const currentMsg = chatHistory[index];
      const updatedMessage = {
        ...currentMsg,
        rfqProductPriceRequest: {
          ...currentMsg.rfqProductPriceRequest,
          status: rRequest.status,
        },
      };
      chatHistory[index] = updatedMessage;
      setSelectedChatHistory(chatHistory);
    }

    // UPDATE TOTAL PRICE
    if (rRequest.status === "APPROVED") {
      setSelectedRfqQuote((prevSelectedRfqQuote: any) => ({
        ...prevSelectedRfqQuote,
        offerPrice: rRequest.newTotalOfferPrice,
      }));
    }

    // UPDATE RFQ PRODUCT
    updateRFQProduct(rRequest);
  };

  const updateRFQProduct = (rRequest: {
    id: number;
    messageId: number;
    requestedPrice: number;
    rfqQuoteProductId: number;
    requestedById: number;
    status: string;
    newTotalOfferPrice: number;
  }) => {
    if (
      selectedRfqQuote?.buyerID === rRequest?.requestedById ||
      (rRequest?.requestedById === user?.id && rRequest?.status === "REJECTED")
    ) {
      const index = quoteProducts.findIndex(
        (product: any) => product.id === rRequest.rfqQuoteProductId,
      );
      if (index !== -1) {
        const pList = [...quoteProducts];
        const product = { ...pList[index] };
        let offerPrice = product.offerPrice;
        if (rRequest.status === "APPROVED") {
          offerPrice = rRequest?.requestedPrice;
        }

        let priceRequest = product?.priceRequest
          ? { ...product.priceRequest }
          : null;

        if (priceRequest) {
          priceRequest = {
            ...priceRequest,
            id: rRequest.id,
            requestedPrice: rRequest.requestedPrice,
            rfqQuoteProductId: rRequest.rfqQuoteProductId,
            status: rRequest?.status,
          };
        } else {
          priceRequest = {
            ...rRequest,
          };
        }

        product.priceRequest = priceRequest;
        product.offerPrice = offerPrice;
        pList[index] = product;
        setQuoteProducts(pList);
      }
    }
  };

  const handleRfqProducts = (item: any) => {
    // Check if there's at least one approved price request from vendor (first vendor approval)
    const hasFirstVendorApproval = item?.rfqProductPriceRequests?.some(
      (request: any) => 
        request?.status === "APPROVED" && 
        request?.requestedById === item?.sellerID
    ) || false;

    const newData =
      item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts.map((i: any) => {
        let priceRequest = null;
        const pRequest = item?.rfqProductPriceRequests?.find(
          (request: any) =>
            request?.rfqQuoteProductId === i.id &&
            request?.status === "APPROVED",
        );
        if (pRequest) priceRequest = pRequest;
        let offerPrice = i.offerPrice;
        if (
          pRequest &&
          pRequest.status &&
          typeof pRequest.status == "string" &&
          pRequest?.status === "APPROVED"
        ) {
          offerPrice = pRequest?.requestedPrice;
        }
        return {
          ...i,
          priceRequest,
          offerPrice,
          offerPriceFrom: i.offerPriceFrom,
          offerPriceTo: i.offerPriceTo,
          hasFirstVendorApproval,
          address:
            item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.address,
          deliveryDate:
            item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.rfqDate,
        };
      }) || [];
    setQuoteProducts(newData);
  };

  // Check if checkout is allowed (all products must have approved prices)
  const canCheckout = () => {
    if (!selectedRfqQuote || !quoteProducts || quoteProducts.length === 0) {
      return false;
    }

    // Check if all products have approved price requests
    const allApproved = quoteProducts.every((product: any) => {
      return (
        product?.priceRequest &&
        product?.priceRequest?.status === "APPROVED" &&
        product?.offerPrice &&
        parseFloat(product.offerPrice) > 0
      );
    });

    return allApproved;
  };

  // Calculate total price from approved product prices
  const calculateTotalPrice = () => {
    if (!quoteProducts || quoteProducts.length === 0) {
      return 0;
    }

    return quoteProducts.reduce((total: number, product: any) => {
      if (
        product?.priceRequest &&
        product?.priceRequest?.status === "APPROVED" &&
        product?.offerPrice
      ) {
        const price = parseFloat(product.offerPrice || "0");
        const quantity = product.quantity || 1;
        return total + price * quantity;
      }
      return total;
    }, 0);
  };

  // Handle checkout - redirect to checkout page with RFQ quote data
  const handleCheckout = () => {
    if (!canCheckout()) {
      toast({
        title: t("checkout_not_available") || "Checkout Not Available",
        description:
          t("all_prices_must_be_approved") ||
          "All product prices must be approved before checkout",
        variant: "danger",
      });
      return;
    }

    // Calculate total from approved product prices
    const calculatedTotal = calculateTotalPrice();

    // Store RFQ quote data in order store for checkout
    const rfqQuoteData = {
      rfqQuotesUserId: selectedRfqQuote?.id,
      rfqQuotesId: selectedRfqQuote?.rfqQuotesId,
      sellerId: selectedRfqQuote?.sellerID,
      buyerId: selectedRfqQuote?.buyerID,
      totalPrice: calculatedTotal,
      quoteProducts: quoteProducts.map((product: any) => ({
        id: product.id,
        offerPrice: parseFloat(product.offerPrice || "0"),
        quantity: product.quantity || 1,
        priceRequestId: product.priceRequest?.id,
      })),
    };

    // Store RFQ quote data in sessionStorage for checkout page to access
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rfqQuoteData", JSON.stringify(rfqQuoteData));
    }

    // Store in order store
    orderStore.setOrders({
      ...orderStore.orders,
    });
    orderStore.setTotal(calculatedTotal);

    // Redirect to checkout page with RFQ flag
    router.push("/checkout?fromRfq=true");
  };

  const updateRfqMessageCount = () => {
    const index = rfqQuotes.findIndex(
      (rfq: RfqQuoteType) => rfq.rfqQuotesId === selectedRfqQuote?.rfqQuotesId,
    );
    if (index !== -1) {
      const rfqList = [...rfqQuotes];
      rfqList[index]["unreadMsgCount"] = 0;
      setRfqQuotes(rfqList);
    }
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleUploadedFile = async () => {
    if (attachments?.length) {
      setIsAttachmentUploading(true);
      const uploadPromises = attachments.map(async (file: any) => {
        const formData = new FormData();
        formData.append("content", file);
        formData.append("uniqueId", file.uniqueId);

        try {
          await uploadAttachment(formData);
        } catch (error) {}
      });
      await Promise.all(uploadPromises);
      setAttachments([]);
      setIsAttachmentUploading(false);
    }
  };

  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    const newData = files.map((file: any) => {
      const uniqueId = generateUniqueNumber();
      file.uniqueId = `${user?.id}-${uniqueId}`;
      return file;
    });
    setAttachments(newData);
  };

  const removeFile = (index: number) => {
    setAttachments((prevFiles: any) =>
      prevFiles.filter((_: any, i: any) => i !== index),
    );
  };

  // Group RFQ quotes by RFQ ID to show unique RFQ requests
  const groupedRfqQuotes = React.useMemo(() => {
    const grouped = new Map<number, RfqQuoteType[]>();
    rfqQuotes.forEach((quote) => {
      const rfqId = quote.rfqQuotesId;
      if (!grouped.has(rfqId)) {
        grouped.set(rfqId, []);
      }
      grouped.get(rfqId)!.push(quote);
    });
    return Array.from(grouped.values());
  }, [rfqQuotes]);

  // Handle selected customer in column mode
  useEffect(() => {
    if (layoutMode === "column" && viewMode === "details" && selectedCustomerId) {
      const customer = rfqQuotes.find((quote) => quote.id === selectedCustomerId);
      if (customer && (!selectedRfqQuote || selectedRfqQuote.id !== customer.id)) {
        setSelectedRfqQuote(customer);
        setActiveSellerId(customer.id);
        handleRfqProducts(customer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, layoutMode, viewMode, rfqQuotes]);

  // Column layout rendering
  if (layoutMode === "column") {
    // RFQ Requests List View (Column 2)
    if (viewMode === "rfqRequests") {
      return (
        <div className="flex h-full flex-col">
          {/* RFQ Requests List */}
          <div className="flex-1 overflow-y-auto p-4">
            {allRfqQuotesQuery?.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : groupedRfqQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-gray-500">{t("no_data_found")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedRfqQuotes.map((rfqGroup) => {
                  const mainQuote = rfqGroup[0];
                  const buyerInfo = mainQuote.buyerIDDetail;
                  const buyerName =
                    (buyerInfo as any)?.accountName ||
                    `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() ||
                    "Buyer";
                  
                  // Get all product names from all quotes in this group
                  const allProductNames = rfqGroup
                    .flatMap(
                      (quote) =>
                        quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                          (product: any) =>
                            product?.rfqProductDetails?.productName || "Product",
                        ) || [],
                    )
                    .filter(Boolean);
                  
                  // Get first product image from all quotes in this group
                  const firstProductImage = rfqGroup
                    .flatMap(
                      (quote) =>
                        quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                          (product: any) =>
                            product?.rfqProductDetails?.productImages?.[0]?.image,
                        ) || [],
                    )
                    .filter(Boolean)[0];
                  
                  // Create a display text from product names (translate each name)
                  const translatedProductNames = allProductNames.map(name => translate(name));
                  const productDisplayText = translatedProductNames.length > 0
                    ? translatedProductNames.length === 1
                      ? translatedProductNames[0]
                      : `${translatedProductNames[0]}${translatedProductNames.length > 1 ? ` +${translatedProductNames.length - 1} more` : ""}`
                    : "No products";
                  
                  return (
                    <div
                      key={mainQuote.rfqQuotesId}
                      onClick={() => {
                        if (onSelectRfq) {
                          // Pass the entire group so parent can access all quotes and products
                          onSelectRfq(mainQuote, rfqGroup);
                        }
                      }}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 bg-white p-4 transition-all hover:border-red-600 hover:bg-red-50",
                        selectedRfqId === mainQuote.rfqQuotesId
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                          {firstProductImage && validator.isURL(firstProductImage) ? (
                            <Image
                              src={firstProductImage}
                              alt={productDisplayText}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {productDisplayText}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {buyerName} - {rfqGroup.length} request{rfqGroup.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Customers List View (Column 3)
    if (viewMode === "customers") {
      const rfqCustomers = rfqQuotes.filter(
        (quote) => quote.rfqQuotesId === selectedRfqId
      );

      return (
        <div className="flex h-full flex-col">
          {/* Customers List */}
          <div className="flex-1 overflow-y-auto p-4">
            {rfqCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-gray-500">No customers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rfqCustomers.map((customer) => {
                  const buyerInfo = customer.buyerIDDetail;
                  const buyerName =
                    (buyerInfo as any)?.accountName ||
                    `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() ||
                    "Buyer";
                  
                  return (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedRfqQuote(customer);
                        setActiveSellerId(customer.id);
                        handleRfqProducts(customer);
                        if (onSelectCustomer) {
                          onSelectCustomer(customer);
                        }
                      }}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 bg-white p-4 transition-all hover:border-red-600 hover:bg-red-50",
                        selectedCustomerId === customer.id
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={buyerInfo?.profilePicture || PlaceholderImage}
                            alt={buyerName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{buyerName}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {customer.lastUnreadMessage?.content 
                              ? customer.lastUnreadMessage.content.substring(0, 50) + "..."
                              : "Lorem Ipsum Dolor Sit Amet,"}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {customer.lastUnreadMessage?.createdAt
                            ? moment(customer.lastUnreadMessage.createdAt).fromNow()
                            : "2hr Ago"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Details View (Column 4) - Use existing detail view code
    if (viewMode === "details") {
      // If selectedCustomerId is provided but selectedRfqQuote is not set yet, show loading
      if (selectedCustomerId && !selectedRfqQuote) {
        return (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <p className="text-sm text-gray-500">Loading details...</p>
            </div>
          </div>
        );
      }
      // If no customer selected, show empty state
      if (!selectedCustomerId) {
        return (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-center text-sm text-gray-500">
              Select a customer to view details and chat
            </p>
          </div>
        );
      }
      // If selectedRfqQuote is set, it will be handled by the detail view code below
      // Return null here to prevent falling through to grid view
      if (!selectedRfqQuote) {
        return null;
      }
    }
  }

  // If detail view is shown, render the detailed chat interface
  if ((showDetailView || (layoutMode === "column" && viewMode === "details")) && selectedRfqQuote) {
    return (
      <div className={cn(
        "flex h-full flex-col",
        layoutMode === "column" ? "bg-white" : ""
      )}>
        {/* Back Button - Only show in grid mode */}
        {layoutMode === "grid" && (
        <div className="mb-4">
          <button
            onClick={() => {
              setShowDetailView(false);
              setSelectedRfqQuote("");
              setActiveSellerId(undefined);
              setQuoteProducts([]);
              setSelectedRoom(null);
              setSelectedChatHistory([]);
              setMessage("");
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("back_to_requests") || "Back to Requests"}
          </button>
        </div>
        )}

        {/* Detailed View */}
        <div className={cn(
          "flex w-full flex-1 flex-col overflow-hidden",
          layoutMode === "column" ? "bg-white" : "rounded-xl border border-gray-200 bg-white shadow-lg"
        )}>
          {/* Header Section - Reduced Size */}
          <div className="flex w-full items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-green-100">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex flex-row items-center gap-2">
                <p
                  className="text-xs font-medium text-gray-600 whitespace-nowrap"
                  dir={langDir}
                  translate="no"
                >
                  {t("offering_price")}
                </p>
                <p
                  className="text-base font-bold text-green-600"
                  dir={langDir}
                  translate="no"
                >
                  {(() => {
                    // Calculate total from approved product prices
                    if (!quoteProducts || quoteProducts.length === 0) {
                      return selectedRfqQuote?.offerPrice
                        ? `${currency.symbol}${selectedRfqQuote?.offerPrice}`
                        : "-";
                    }
                    const calculatedTotal = quoteProducts.reduce(
                      (total: number, product: any) => {
                        if (
                          product?.priceRequest &&
                          product?.priceRequest?.status === "APPROVED" &&
                          product?.offerPrice
                        ) {
                          const price = parseFloat(product.offerPrice || "0");
                          const quantity = product.quantity || 1;
                          return total + price * quantity;
                        }
                        return total;
                      },
                      0,
                    );
                    // If we have approved prices, show calculated total, otherwise show original offer price
                    const hasApprovedPrices = quoteProducts.some(
                      (product: any) =>
                        product?.priceRequest &&
                        product?.priceRequest?.status === "APPROVED",
                    );
                    return hasApprovedPrices && calculatedTotal > 0
                      ? `${currency.symbol}${calculatedTotal}`
                      : selectedRfqQuote?.offerPrice
                        ? `${currency.symbol}${selectedRfqQuote?.offerPrice}`
                        : "-";
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-1 flex-col overflow-hidden min-h-0 p-2">
            {/* Product Table Section */}
            <div className="mb-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm flex-shrink-0 max-h-[180px] overflow-y-auto">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Table Header - list style like PCPartPicker */}
                  <div className="sticky top-0 z-10 grid grid-cols-4 gap-1 border-b border-gray-200 bg-gray-50 px-3 py-1.5">
                    <div
                      className="text-[11px] font-semibold text-gray-700"
                      dir={langDir}
                      translate="no"
                    >
                      {t("component") || "Component"}
                    </div>
                    <div
                      className="text-[11px] font-semibold text-gray-700 text-center"
                      dir={langDir}
                      translate="no"
                    >
                      {t("selection") || "Selection"}
                    </div>
                    <div
                      className="text-[11px] font-semibold text-gray-700 text-center"
                      dir={langDir}
                      translate="no"
                    >
                      {t("price") || "Price"}
                    </div>
                    <div
                      className="text-[11px] font-semibold text-gray-700 text-center"
                      dir={langDir}
                      translate="no"
                    >
                      {t("address") || "Address"}
                    </div>
                  </div>
                  {/* Table Body */}
                  {allRfqQuotesQuery.isLoading ? (
                    <div className="space-y-2 p-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : null}

                  {!allRfqQuotesQuery?.isLoading && !quoteProducts?.length ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p
                        className="text-center text-sm font-medium text-gray-500"
                        dir={langDir}
                        translate="no"
                      >
                        {t("no_data_found")}
                      </p>
                    </div>
                  ) : null}

                  {quoteProducts?.map((item: any) => {
                    const isSimilar = item?.productType === "SIMILAR";
                    const suggestions = getSuggestionsForRfqQuoteProduct(item.id);
                    const isEditingPrice = editingPriceProductId === item.id;

                    return (
                      <div key={item.id} className="border-b border-gray-200">
                        {/* Main requested product row */}
                        <div className="grid grid-cols-4 items-center gap-2 px-3 py-2.5 bg-white">
                          {/* Requested product info */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
                              <Image
                                src={
                                  item?.rfqProductDetails?.productImages?.[0]?.image ||
                                  PlaceholderImage
                                }
                                alt={item?.rfqProductDetails?.productName || "Product"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900">
                                {translate(item?.rfqProductDetails?.productName || "-")}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {item?.deliveryDate || "-"}
                              </p>
                            </div>
                          </div>

                          {/* Selection (button) */}
                          <div className="flex justify-center">
                            {isSimilar ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSuggestingForProductId(item.id);
                                  setSuggestingForProductQuantity(item.quantity || 1);
                                  setShowProductSuggestionModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                                dir={langDir}
                                translate="no"
                              >
                                <span>+</span>
                                <span>
                                  Choose Alternative
                                </span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-500">
                                {item?.productType === "SAME"
                                  ? t("same_product") || "Same product"
                                  : "-"}
                              </span>
                            )}
                          </div>

                          {/* Base column: main product price editor */}
                          <div className="flex flex-col items-center gap-0.5 text-[10px] text-gray-700">
                            {isEditingPrice ? (
                              <>
                                <input
                                  type="number"
                                  value={editingPriceValue}
                                  onChange={(e) =>
                                    setEditingPriceValue(e.target.value)
                                  }
                                  className="w-20 rounded border border-gray-300 px-1 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    className="text-[9px] text-blue-600"
                                    onClick={() => {
                                      const price = parseFloat(editingPriceValue);
                                      if (!isNaN(price) && price > 0) {
                                        handleRequestPrice(item.id, price);
                                      }
                                      setEditingPriceProductId(null);
                                      setEditingPriceValue("");
                                    }}
                                  >
                                    {t("save") || "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    className="text-[9px] text-gray-500"
                                    onClick={() => {
                                      setEditingPriceProductId(null);
                                      setEditingPriceValue("");
                                    }}
                                  >
                                    {t("cancel") || "Cancel"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="font-bold">
                                  {(() => {
                                    // Show pending price if available, otherwise show original offerPrice
                                    // Multiply by quantity
                                    const pendingPrice = pendingPriceUpdates.get(item.id);
                                    const displayPrice = pendingPrice ?? item?.offerPrice;
                                    const quantity = item?.quantity || 1;
                                    if (displayPrice) {
                                      const totalPrice = parseFloat(displayPrice.toString()) * quantity;
                                      return `${currency.symbol}${totalPrice}`;
                                    }
                                    return "-";
                                  })()}
                                </span>
                                <button
                                  type="button"
                                  className="text-[9px] text-blue-600"
                                  onClick={() => {
                                    setEditingPriceProductId(item.id);
                                    // Show pending price if available, otherwise show original offerPrice
                                    const pendingPrice = pendingPriceUpdates.get(item.id);
                                    setEditingPriceValue(
                                      pendingPrice?.toString() || item?.offerPrice?.toString() || "",
                                    );
                                  }}
                                >
                                  {t("edit") || "Edit"}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Address column */}
                          <div className="text-center text-[10px] text-gray-700">
                            <span className="line-clamp-2">
                              {item?.address || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Suggested products under this requested product */}
                        {suggestions.filter((s: any) => (s.quantity ?? 0) > 0).length > 0 && (
                          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                            {suggestions
                              .filter((s: any) => (s.quantity ?? 0) > 0)
                              .map((s: any) => {
                              const p = s.suggestedProduct;
                              const imageUrl =
                                p?.product_productPrice?.[0]
                                  ?.productPrice_productSellerImage?.[0]?.image ||
                                p?.productImages?.[0]?.image ||
                                PlaceholderImage;
                              const unitPrice =
                                s.offerPrice ||
                                p?.product_productPrice?.[0]?.offerPrice ||
                                p?.product_productPrice?.[0]?.productPrice ||
                                0;
                              // Multiply price by quantity
                              const quantity = s.quantity || 1;
                              const totalPrice = parseFloat(unitPrice.toString()) * quantity;
                              const isSelected = !!s.isSelectedByBuyer;

                              return (
                                <div
                                  key={s.id || `suggestion-${s.suggestedProductId}`}
                                  className={`grid grid-cols-4 items-center gap-2 py-1.5 pl-8 text-[11px] ${
                                    isSelected ? "bg-green-50 border-l-4 border-l-green-500" : ""
                                  }`}
                                >
                                  {/* Component column */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
                                      <Image
                                        src={imageUrl}
                                        alt={p?.productName || "Product"}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="truncate block text-[11px]">
                                        {p?.productName || "-"}
                                      </span>
                                      {s.quantity && s.quantity > 0 && (
                                        <span className="text-[9px] text-gray-500">
                                          Qty: {s.quantity}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Selection column */}
                                  <div className="flex justify-center">
                                    {isSelected && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-[9px] font-medium">
                                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {"Selected"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Price column */}
                                  <div className="text-center text-[10px] text-gray-700">
                                    <span>
                                      {totalPrice ? `${currency.symbol}${totalPrice}` : "-"}
                                    </span>
                                  </div>

                                  {/* Address column */}
                                  <div className="text-center text-[10px] text-gray-500">
                                    <span>-</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Send Update and Cancel Buttons */}
              {quoteProducts && quoteProducts.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Cancel - clear all pending updates
                      setPendingPriceUpdates(new Map());
                      setPendingSuggestionUpdates(new Map());
                      setHasPendingUpdates(false);
                    }}
                    className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    dir={langDir}
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendUpdate}
                    disabled={!hasPendingUpdates}
                    className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
                      hasPendingUpdates
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    dir={langDir}
                  >
                    Send Update
                  </button>
                </div>
              )}
            </div>

            {/* Chat Section - Scrollable */}
            {rfqQuotes?.length > 0 ? (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 w-full rounded-lg border border-gray-200 bg-white shadow-sm flex-shrink-0">
                <SellerChatHistory
                  roomId={selectedRoom}
                  selectedChatHistory={selectedChatHistory}
                  chatHistoryLoading={chatHistoryLoading}
                  buyerId={selectedRfqQuote?.buyerID}
                  rfqUserId={selectedRfqQuote?.id}
                  updateRfqMessageCount={updateRfqMessageCount}
                  unreadMsgCount={selectedRfqQuote?.unreadMsgCount}
                />
              </div>
            ) : null}

            {/* Message Input Section - Reduced Size */}
            {rfqQuotes?.length > 0 ? (
              <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-2">
                <div className="flex w-full items-end gap-2">
                  {/* Attachment Button */}
                  <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white transition-colors hover:bg-gray-50">
                    <input
                      type="file"
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Image
                      src={AttachIcon}
                      alt="attach-icon"
                      className="h-4 w-4"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="flex flex-1 items-end gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2">
                    <textarea
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                      placeholder={
                        t("type_your_message") || "Type your message...."
                      }
                      className="max-h-24 min-h-[32px] w-full resize-none border-0 text-xs focus:outline-none"
                      onKeyDown={handleSendMessageKeyDown}
                      rows={1}
                    />
                    <button
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                      type="button"
                    >
                      <Image
                        src={SmileIcon}
                        alt="smile-icon"
                        className="h-4 w-4"
                      />
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    type="button"
                    className="bg-dark-orange flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-orange-600"
                  >
                    <Image src={SendIcon} alt="send-icon" className="h-4 w-4" />
                  </button>
                </div>

                {/* Emoji Picker */}
                {showEmoji ? (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2">
                    <EmojiPicker
                      lazyLoadEmojis={true}
                      onEmojiClick={onEmojiClick}
                      className="mt-1"
                    />
                  </div>
                ) : null}

                {/* Attachments Preview */}
                {!isAttachmentUploading && attachments.length > 0 ? (
                  <div className="mt-2 flex w-full flex-wrap gap-1.5">
                    {attachments.map((file: any, index: any) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="max-w-[200px] truncate text-xs text-gray-700">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
                          type="button"
                        >
                          <svg
                            className="h-2.5 w-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Product Suggestion Modal */}
            {showProductSuggestionModal && suggestingForProductId && user?.id && (
              <ProductSuggestionModal
                isOpen={showProductSuggestionModal}
                onClose={() => {
                  setShowProductSuggestionModal(false);
                  setSuggestingForProductId(null);
                  setSuggestingForProductQuantity(1);
                }}
                onSelectProducts={handleProductsSelected}
                rfqQuoteProductId={suggestingForProductId}
                vendorId={user.id}
                defaultQuantity={suggestingForProductQuantity}
                defaultOfferPrice={
                  quoteProducts.find((p) => p.id === suggestingForProductId)
                    ?.offerPrice
                    ? parseFloat(
                        quoteProducts.find(
                          (p) => p.id === suggestingForProductId,
                        )?.offerPrice,
                      )
                    : undefined
                }
                mainProduct={{
                  id: suggestingForProductId,
                  name:
                    translate(quoteProducts.find((p) => p.id === suggestingForProductId)
                      ?.rfqProductDetails?.productName || ""),
                  image:
                    quoteProducts.find((p) => p.id === suggestingForProductId)
                      ?.rfqProductDetails?.productImages?.[0]?.image,
                  quantity:
                    quoteProducts.find((p) => p.id === suggestingForProductId)
                      ?.quantity || 1,
                  offerPrice:
                    quoteProducts.find((p) => p.id === suggestingForProductId)
                      ?.offerPrice
                      ? parseFloat(
                          quoteProducts.find(
                            (p) => p.id === suggestingForProductId,
                          )?.offerPrice,
                        )
                      : undefined,
                }}
                existingSuggestions={getSuggestionsForRfqQuoteProduct(
                  suggestingForProductId,
                ).map((s: any) => ({
                  suggestedProductId: s.suggestedProductId,
                  offerPrice: s.offerPrice,
                  quantity: s.quantity,
                }))}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card View - Show all RFQ requests as cards
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-bold text-gray-900"
              dir={langDir}
              translate="no"
            >
              {showHiddenRequests
                ? "Hidden Requests"
                : t("request_for_rfq")}
            </h2>
            <p className="mt-1 text-sm text-gray-600" dir={langDir} translate="no">
              {showHiddenRequests
                ? "View and restore hidden RFQ requests"
                : t("select_an_rfq_request_to_view_details") ||
                  "Select an RFQ request to view details and respond"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSelectMode && selectedRequests.size > 0 && (
              <button
                onClick={handleBulkHide}
                disabled={hideRfqRequestMutation.isPending}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                translate="no"
                type="button"
              >
                {hideRfqRequestMutation.isPending ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {showHiddenRequests ? (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Unhide Selected ({selectedRequests.size})
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        Hide Selected ({selectedRequests.size})
                      </>
                    )}
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedRequests(new Set());
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                isSelectMode
                  ? "border-dark-orange bg-orange-50 text-dark-orange hover:bg-orange-100"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              )}
              translate="no"
              type="button"
            >
              {isSelectMode ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel Selection
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Select Multiple
                </>
              )}
            </button>
            <button
              onClick={() => setShowHiddenRequests(!showHiddenRequests)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              translate="no"
              type="button"
            >
              {showHiddenRequests ? (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Show Visible Requests
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  Show Hidden Requests
                </>
              )}
            </button>
          </div>
        </div>
        {isSelectMode && (
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
              translate="no"
              type="button"
            >
              {selectedRequests.size === groupedRfqQuotes.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <span className="text-sm text-gray-600" translate="no">
              {selectedRequests.size} of {groupedRfqQuotes.length} selected
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {allRfqQuotesQuery?.isLoading ? (
        <div className={displayMode === "list" ? "space-y-0 border border-gray-200 rounded-lg bg-white overflow-hidden divide-y divide-gray-200" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={displayMode === "list" ? "h-24 w-full rounded-none" : "h-64 w-full rounded-xl"} />
          ))}
        </div>
      ) : null}

      {/* Empty State */}
      {!allRfqQuotesQuery?.isLoading && groupedRfqQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            {showHiddenRequests ? (
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
          <p
            className="text-center text-lg font-medium text-gray-500"
            dir={langDir}
            translate="no"
          >
            {showHiddenRequests
              ? "No hidden requests found"
              : t("no_data_found")}
          </p>
        </div>
      ) : null}

      {/* RFQ Request Cards Grid or List */}
      {!allRfqQuotesQuery?.isLoading && groupedRfqQuotes.length > 0 && (
        <div className={displayMode === "list" ? "space-y-0 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
          {/* List View Header */}
          {displayMode === "list" && (
            <div className={cn(
              "hidden lg:grid gap-6 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10",
              isSelectMode 
                ? "grid-cols-[auto_120px_auto_300px_160px_220px_auto]" 
                : "grid-cols-[120px_auto_300px_160px_220px_auto]"
            )}>
              {isSelectMode && <div></div>}
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">RFQ ID</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Products</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Product Details</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Buyer</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Latest Message</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">Actions</div>
            </div>
          )}
          {groupedRfqQuotes.map((rfqGroup, groupIndex) => {
            // Get the first quote from the group to display main info
            const mainQuote = rfqGroup[0];
            const rfqId = mainQuote.rfqQuotesId;

            // Get all product images and details from all quotes in this group
            const allProductImages = rfqGroup
              .flatMap(
                (quote) =>
                  quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                    (product: any) =>
                      product?.rfqProductDetails?.productImages?.[0],
                  ) || [],
              )
              .filter(Boolean);

            // Get product details (name, quantity) from all quotes in this group
            const allProductDetails = rfqGroup
              .flatMap(
                (quote) =>
                  quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                    (product: any) => ({
                      productName:
                        translate(product?.rfqProductDetails?.productName || "Product"),
                      quantity: product?.quantity || 1,
                      productType: product?.productType || "SAME",
                    }),
                  ) || [],
              )
              .filter(Boolean);

            // Get buyer info from first quote
            const buyerInfo = mainQuote.buyerIDDetail;
            const buyerName =
              (buyerInfo as any)?.accountName ||
              `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() ||
              "Buyer";

            // Calculate total unread messages for this RFQ
            const totalUnreadMessages = rfqGroup.reduce(
              (total, quote) => total + (quote.unreadMsgCount || 0),
              0,
            );

            // Get latest message
            const latestMessage = rfqGroup
              .map((q) => q.lastUnreadMessage)
              .filter(Boolean)
              .sort(
                (a, b) =>
                  new Date(b?.createdAt || 0).getTime() -
                  new Date(a?.createdAt || 0).getTime(),
              )[0];

            const isSelected = selectedRequests.has(mainQuote.id);

            return (
              <div
                key={rfqId}
                onClick={() => {
                  if (isSelectMode) {
                    handleToggleSelect(mainQuote.id);
                  } else {
                    // When in grid mode and onSelectRfq is provided, call it to navigate
                    if (layoutMode === "grid" && onSelectRfq) {
                      onSelectRfq(mainQuote, rfqGroup);
                    } else {
                      // Original behavior for column mode
                      setSelectedRfqQuote(mainQuote);
                      setActiveSellerId(mainQuote.id);
                      handleRfqProducts(mainQuote);
                      setShowDetailView(true);
                    }
                  }
                }}
                className={cn(
                  displayMode === "list"
                    ? cn(
                        "group border-b border-gray-200 bg-white px-4 py-4 lg:px-6 lg:py-5 transition-all hover:bg-gray-50/50 last:border-b-0 flex flex-col lg:grid gap-4 lg:gap-6 items-start lg:items-center",
                        isSelectMode 
                          ? "lg:grid-cols-[auto_120px_auto_300px_160px_220px_auto]" 
                          : "lg:grid-cols-[120px_auto_300px_160px_220px_auto]"
                      )
                    : "group overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all",
                  isSelectMode
                    ? "cursor-default"
                    : displayMode === "list"
                      ? "cursor-pointer"
                      : "hover:border-dark-orange cursor-pointer hover:shadow-md",
                  isSelected && displayMode === "list"
                    ? "bg-orange-50 border-l-4 border-l-dark-orange"
                    : isSelected
                      ? "border-dark-orange bg-orange-50"
                      : displayMode === "list"
                        ? ""
                        : "border-gray-200",
                )}
              >
                {displayMode === "list" ? (
                  /* List View Layout - Improved UI */
                  <>
                    {/* Checkbox */}
                    {isSelectMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(mainQuote.id);
                        }}
                        className={cn(
                          "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all",
                          isSelected
                            ? "border-dark-orange bg-dark-orange"
                            : "border-gray-300 hover:border-dark-orange"
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="h-3.5 w-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* RFQ ID Section - Only show ID text, no icon */}
                    <div className="flex items-center">
                      <p className="text-dark-orange text-base font-bold leading-tight" translate="no">
                        RFQ{String(rfqId || "").padStart(5, "0")}
                      </p>
                    </div>

                    {/* Product Images Section */}
                    <div className="flex gap-2">
                      {allProductImages.slice(0, 3).map((img: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 shadow-sm transition-all group-hover:border-dark-orange/30"
                        >
                          <Image
                            src={
                              img?.image && validator.isURL(img.image)
                                ? img.image
                                : PlaceholderImage
                            }
                            fill
                            alt={`Product ${idx + 1}`}
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {allProductImages.length > 3 && (
                        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
                          <span className="text-xs font-bold text-gray-600">
                            +{allProductImages.length - 3}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details Section */}
                    <div className="min-w-0">
                      {allProductDetails.length > 0 && (
                        <div className="space-y-1.5">
                          {allProductDetails.slice(0, 2).map((product: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="truncate text-sm font-medium text-gray-900">
                                {translate(product.productName)}
                              </span>
                              <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                Qty: {product.quantity}
                              </span>
                            </div>
                          ))}
                          {allProductDetails.length > 2 && (
                            <div className="text-xs font-medium text-gray-500">
                              +{allProductDetails.length - 2} more product{allProductDetails.length - 2 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Buyer Info Section */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white ring-2 ring-gray-100 shadow-sm flex-shrink-0">
                        <Image
                          src={buyerInfo?.profilePicture || PlaceholderImage}
                          alt={buyerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {buyerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rfqGroup.length} {rfqGroup.length === 1 ? "request" : "requests"}
                        </p>
                      </div>
                    </div>

                    {/* Latest Message Section */}
                    <div className="min-w-0">
                      {latestMessage?.content ? (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-200">
                          <p className="line-clamp-1 text-xs text-gray-700 truncate font-medium">
                            {latestMessage.content}
                          </p>
                          {latestMessage.createdAt && (
                            <p className="mt-1 text-[10px] text-gray-400 font-medium">
                              {moment(latestMessage.createdAt).fromNow()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Unread Count & Actions Section */}
                    <div className="flex items-center gap-3 justify-start lg:justify-end w-full lg:w-auto">
                      {totalUnreadMessages > 0 && !showHiddenRequests && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-lg ring-2 ring-blue-100">
                          {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                        </div>
                      )}
                      {!isSelectMode && (
                        <>
                          {showHiddenRequests ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnhideRequest(e, mainQuote.id);
                              }}
                              disabled={hideRfqRequestMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-all hover:bg-green-100 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                              title="Unhide Request"
                              type="button"
                            >
                              {hideRfqRequestMutation.isPending ? (
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                                </svg>
                              ) : (
                                <>
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>Unhide</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideRequest(e, mainQuote.id);
                              }}
                              disabled={hideRfqRequestMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                              title="Hide Request"
                              type="button"
                            >
                              {hideRfqRequestMutation.isPending ? (
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                                </svg>
                              ) : (
                                <>
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                  <span>Hide</span>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* Card View Layout (Original) */
                  <>
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isSelectMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(mainQuote.id);
                        }}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-gray-300 transition-all hover:border-dark-orange"
                      >
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-dark-orange"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="bg-dark-orange flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span
                        className="text-xs font-medium text-gray-500"
                        translate="no"
                      >
                        {t("rfq_id")}
                      </span>
                      <p
                        className="text-dark-orange text-base font-bold"
                        translate="no"
                      >
                        RFQ{String(rfqId || "").padStart(5, "0")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalUnreadMessages > 0 && !showHiddenRequests && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md">
                        {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                      </div>
                    )}
                    {!isSelectMode && (
                      <>
                        {showHiddenRequests ? (
                          <button
                            onClick={(e) => handleUnhideRequest(e, mainQuote.id)}
                            disabled={hideRfqRequestMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2 py-1.5 text-green-600 transition-all hover:bg-green-100 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Unhide Request"
                            type="button"
                          >
                            {hideRfqRequestMutation.isPending ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  fill="currentColor"
                                />
                              </svg>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                <span className="text-xs font-medium">Unhide</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleHideRequest(e, mainQuote.id)}
                            disabled={hideRfqRequestMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Hide Request"
                            type="button"
                          >
                            {hideRfqRequestMutation.isPending ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  fill="currentColor"
                                />
                              </svg>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                                <span className="text-xs font-medium">Hide</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Product Images and Details */}
                <div className="p-4">
                  <div className="mb-3 flex gap-2">
                    {allProductImages
                      .slice(0, 3)
                      .map((img: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                        >
                          <Image
                            src={
                              img?.image && validator.isURL(img.image)
                                ? img.image
                                : PlaceholderImage
                            }
                            fill
                            alt={`Product ${idx + 1}`}
                            className="object-cover"
                          />
                        </div>
                      ))}
                    {allProductImages.length > 3 && (
                      <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        <span className="text-sm font-bold text-gray-600">
                          +{allProductImages.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  {allProductDetails.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {allProductDetails
                        .slice(0, 2)
                        .map((product: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-xs"
                          >
                            <span className="flex-1 truncate font-medium text-gray-700">
                              {translate(product.productName)}
                            </span>
                            <span className="ml-2 flex-shrink-0 text-gray-500">
                              Qty: {product.quantity}
                            </span>
                          </div>
                        ))}
                      {allProductDetails.length > 2 && (
                        <div className="text-center text-xs text-gray-500">
                          +{allProductDetails.length - 2} more product
                          {allProductDetails.length - 2 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buyer Info */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white ring-2 ring-gray-100">
                      <Image
                        src={buyerInfo?.profilePicture || PlaceholderImage}
                        alt={buyerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {buyerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rfqGroup.length}{" "}
                        {rfqGroup.length === 1 ? "request" : "requests"}
                      </p>
                    </div>
                  </div>

                  {/* Latest Message Preview */}
                  {latestMessage?.content && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <p className="line-clamp-2 text-xs text-gray-600">
                        {latestMessage.content}
                      </p>
                      {latestMessage.createdAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          {moment(latestMessage.createdAt).fromNow()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delivery Date */}
                  {mainQuote.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress
                    ?.rfqDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {moment(
                          mainQuote.rfqQuotesUser_rfqQuotes
                            .rfqQuotes_rfqQuoteAddress.rfqDate,
                        ).format("MMM DD, YYYY")}
                      </span>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerChat;
