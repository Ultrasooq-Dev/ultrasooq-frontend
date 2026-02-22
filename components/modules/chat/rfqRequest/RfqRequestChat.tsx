import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import AttachIcon from "@/public/images/attach.svg";
import SmileIcon from "@/public/images/smile.svg";
import Link from "next/link";
import SendIcon from "@/public/images/send-button.png";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import OfferPriceCard from "@/components/modules/rfqRequest/OfferPriceCard";
import RequestProductCard from "@/components/modules/rfqRequest/RequestProductCard";
import {
  useAllRfqQuotesUsersByBuyerId,
  useFindOneRfqQuotesUsersByBuyerID,
} from "@/apis/queries/rfq.queries";
import {
  findRoomId,
  getChatHistory,
  updateUnreadMessages,
  uploadAttachment,
  selectSuggestedProducts,
} from "@/apis/requests/chat.requests";
import RfqRequestChatHistory from "./RfqRequestChatHistory";
import RfqRequestVendorCard from "./RfqRequestVendorCard";
import BuyerProductSelectionModal from "./BuyerProductSelectionModal";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/ui/use-toast";
import { CHAT_REQUEST_MESSAGE } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { generateUniqueNumber } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/orderStore";

interface RfqRequestChatProps {
  rfqQuoteId: any;
  layoutMode?: "grid" | "column";
  viewMode?: "vendors" | "details";
  selectedVendorId?: number | null;
  onSelectVendor?: (vendor: any) => void;
}

interface RfqRequestVendorDetailsProps {
  id: number;
  sellerID: number;
  buyerID: number;
  rfqQuotesId: number;
  offerPrice: string;
  sellerIDDetail: {
    firstName: string;
    lastName: string;
    profilePicture: string;
    accountName?: string;
    email?: string;
  };
  lastUnreadMessage: {
    content: string;
    createdAt: string;
  };
  unreadMsgCount: number;
  rfqQuotesUser_rfqQuotes?: any;
  rfqProductPriceRequests?: any[];
  rfqQuotesProducts?: any[];
}

const RfqRequestChat: React.FC<RfqRequestChatProps> = ({ 
  rfqQuoteId,
  layoutMode = "grid",
  viewMode,
  selectedVendorId,
  onSelectVendor,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const [activeSellerId, setActiveSellerId] = useState<number>();
  const [selectedChatHistory, setSelectedChatHistory] = useState<any>([]);
  const [rfqQuotesUserId, setRfqQuotesUserId] = useState<number>();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<any>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] =
    useState<boolean>(false);
  const [selectingSuggestions, setSelectingSuggestions] = useState<Set<number>>(new Set());
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<{
    rfqQuoteProductId: number;
    rfqQuotesUserId: number;
  } | null>(null);
  const [pendingProductSelections, setPendingProductSelections] = useState<Map<number, number[]>>(new Map());
  const [hasPendingSelections, setHasPendingSelections] = useState(false);
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

  // Collect suggested products for a given RFQ quote product from chat history,
  // deduped by suggestedProductId and ignoring removed ones (quantity <= 0)
  const getSuggestionsForRfqQuoteProduct = (productId: number) => {
    const suggestions = selectedChatHistory
      .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
      .filter((s: any) => s?.rfqQuoteProductId === productId);

    const byProductId = new Map<number, any>();
    suggestions.forEach((s: any) => {
      if (!s?.suggestedProductId) return;
      byProductId.set(s.suggestedProductId, s);
    });

    let result = Array.from(byProductId.values()).filter(
      (s: any) => (s.quantity ?? 0) > 0,
    );

    // Merge pending selections for UI preview
    const pendingIds = pendingProductSelections.get(productId) || [];
    result = result.map((s: any) => {
      const isPendingSelected = pendingIds.includes(s.id);
      return {
        ...s,
        isSelectedByBuyer: isPendingSelected || s.isSelectedByBuyer,
      };
    });

    return result;
  };

  // Handle selecting/deselecting suggested products
  const handleSelectSuggestedProducts = async (
    suggestionIds: number[],
    rfqQuoteProductId: number,
    rfqQuotesUserId: number,
  ) => {
    if (!user?.id) return;

    // Mark all suggestions as "selecting" for better UX
    const allSuggestionIds = selectedChatHistory
      .flatMap((chat: any) => chat?.rfqSuggestedProducts?.map((s: any) => s.id) || [])
      .filter((id: number) => id);
    
    setSelectingSuggestions(new Set(allSuggestionIds));
    try {
      const response = await selectSuggestedProducts({
        selectedSuggestionIds: suggestionIds,
        rfqQuoteProductId,
        rfqQuotesUserId,
      });

      if (response.data?.status === 200) {
        toast({
          title: t("success") || "Success",
          description: suggestionIds.length > 0 
            ? (t("products_selected_successfully") || "Products selected successfully")
            : (t("products_deselected_successfully") || "Products deselected successfully"),
          variant: "success",
        });
        // Refresh chat history to see updated selection status
        if (selectedRoom) {
          await handleChatHistory();
        }
      }
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.response?.data?.message || (t("something_went_wrong") || "Something went wrong"),
        variant: "danger",
      });
    } finally {
      setSelectingSuggestions(new Set());
    }
  };

  // Handle opening product selection modal
  const handleOpenProductSelectionModal = (rfqQuoteProductId: number, rfqQuotesUserId: number) => {
    setSelectedProductForModal({ rfqQuoteProductId, rfqQuotesUserId });
    setShowProductSelectionModal(true);
  };

  const handleCloseProductSelectionModal = () => {
    setShowProductSelectionModal(false);
    setSelectedProductForModal(null);
  };

  const handleProductSelectionFromModal = (suggestionIds: number[]) => {
    if (!selectedProductForModal) return;
    
    const { rfqQuoteProductId, rfqQuotesUserId } = selectedProductForModal;
    
    // Store pending selections locally
    setPendingProductSelections((prev) => {
      const newMap = new Map(prev);
      newMap.set(rfqQuoteProductId, suggestionIds);
      return newMap;
    });
    
    // Update local state immediately for UI feedback
    // We'll actually send the update when "Send Update" is pressed
    setHasPendingSelections(true);
    
    // Close modal
    handleCloseProductSelectionModal();
  };

  // Handle sending update to vendor
  const handleSendUpdateToVendor = async () => {
    if (!selectedRoom || !hasPendingSelections || !selectedVendor) return;

    try {
      // Send all pending selections
      for (const [rfqQuoteProductId, suggestionIds] of pendingProductSelections.entries()) {
        await handleSelectSuggestedProducts(
          suggestionIds,
          rfqQuoteProductId,
          selectedVendor.id,
        );
      }

      // Send notification message to vendor
      const notificationMessage = "Customer selected products from your suggestions.";
      
      sendNewMessage(
        selectedRoom,
        notificationMessage,
        undefined,
        selectedVendor.sellerID,
      );

      // Clear pending selections
      setPendingProductSelections(new Map());
      setHasPendingSelections(false);

      toast({
        title: t("success") || "Success",
        description: "Update sent to vendor",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.response?.data?.message || (t("something_went_wrong") || "Something went wrong"),
        variant: "danger",
      });
    }
  };

  const allRfqQuotesQuery = useAllRfqQuotesUsersByBuyerId(
    {
      page: 1,
      limit: 10,
      rfqQuotesId: rfqQuoteId ?? 0,
    },
    !!rfqQuoteId,
  );
  const rfqQuotesUsersByBuyerIdQuery = useFindOneRfqQuotesUsersByBuyerID(
    {
      rfqQuotesId: rfqQuoteId ? rfqQuoteId : undefined,
    },
    !!rfqQuoteId,
  );

  const rfqQuoteDetailsById = rfqQuotesUsersByBuyerIdQuery.data?.data;

  useEffect(() => {
    const rfqQuotesDetails = allRfqQuotesQuery.data?.data;

    if (rfqQuotesDetails) {
      setVendorList(rfqQuotesDetails);
      // Auto-select first vendor only in grid mode
      if (layoutMode === "grid" && rfqQuotesDetails[0] && !selectedVendorId) {
        handleRfqProducts(rfqQuotesDetails[0]);
        setActiveSellerId(rfqQuotesDetails[0]?.sellerID);
        setRfqQuotesUserId(rfqQuotesDetails[0]?.id);
      }
      // In column mode, select vendor by selectedVendorId
      if (layoutMode === "column" && selectedVendorId && rfqQuotesDetails.length > 0) {
        const vendor = rfqQuotesDetails.find(
          (v: any) => v.id === selectedVendorId || v.sellerID === selectedVendorId
        );
        if (vendor) {
          handleRfqProducts(vendor);
          setActiveSellerId(vendor?.sellerID);
          setRfqQuotesUserId(vendor?.id);
        }
      }
      // In column mode vendors view, auto-select first vendor if none selected
      if (layoutMode === "column" && viewMode === "vendors" && !selectedVendorId && rfqQuotesDetails[0]) {
        // Don't auto-select, just show the list
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRfqQuotesQuery.data?.data, selectedVendorId, layoutMode, viewMode]);

  // check room id
  useEffect(() => {
    if (selectedVendor?.sellerID && selectedVendor?.buyerID) {
      checkRoomId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendor]);

  // receive a message
  useEffect(() => {
    if (newMessage?.rfqId === parseInt(rfqQuoteId)) {
      handleNewMessage(newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // update the new message status
  useEffect(() => {
    if (newMessage?.rfqId === parseInt(rfqQuoteId)) {
      handleUpdateNewMessageStatus(newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // get chat history
  useEffect(() => {
    if (selectedRoom) {
      handleChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  // if new room crated
  useEffect(() => {
    if (
      newRoom?.roomId &&
      (newRoom?.creatorId === activeSellerId || newRoom?.creatorId === user?.id)
    ) {
      setSelectedRoom(newRoom?.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRoom]);

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

  // if rfqRequest
  useEffect(() => {
    if (rfqRequest) {
      handleRfqRequest(rfqRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqRequest]);

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
        rfqQuotesUserId === message?.rfqQuotesUserId &&
        message?.userId !== user?.id
      ) {
        if (activeSellerId && selectedRoom) {
          const payload = {
            userId: activeSellerId,
            roomId: selectedRoom,
          };
          await updateUnreadMessages(payload);
        }
      }
    } catch (error) {}
  };

  const updateVendorMessageCount = () => {
    const index = vendorList.findIndex(
      (vendor: RfqRequestVendorDetailsProps) =>
        vendor.sellerID === activeSellerId,
    );
    if (index !== -1) {
      const vList = [...vendorList];
      vList[index]["unreadMsgCount"] = 0;
      setVendorList(vList);
    }
  };

  const handleNewMessage = (message: any) => {
    try {
      const index = vendorList.findIndex(
        (vendor: RfqRequestVendorDetailsProps) =>
          message?.participants?.includes(vendor.sellerID),
      );
      if (index !== -1) {
        const vList = [...vendorList];
        const [item] = vList.splice(index, 1);
        let newItem = {
          ...item,
          lastUnreadMessage: {
            content: message.content,
            createdAt: message.createdAt,
          },
        };

        if (rfqQuotesUserId !== message?.rfqQuotesUserId) {
          newItem = {
            ...newItem,
            unreadMsgCount: newItem?.unreadMsgCount + 1,
          };

          if (message?.rfqProductPriceRequest) {
            const rList = newItem.rfqProductPriceRequests;
            rList.push(message?.rfqProductPriceRequest);
            newItem = {
              ...newItem,
              rfqProductPriceRequests: rList,
            };
          }
        }
        vList.unshift(newItem);
        setVendorList(vList);
        if (selectedRoom === message?.roomId) {
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

  const checkRoomId = async () => {
    try {
      const payloadRoomFind = {
        rfqId: selectedVendor?.rfqQuotesId,
        userId: selectedVendor?.sellerID,
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

  const handleSendMessage = async () => {
    try {
      if (message || attachments.length) {
        if (selectedRoom) {
          sendNewMessage(selectedRoom, message);
        } else if (
          !selectedRoom &&
          selectedVendor?.sellerID &&
          selectedVendor?.buyerID
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
    buyerId?: number,
    requestedPrice?: number,
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
      content: message,
      userId: user?.id,
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      rfqQuotesUserId: null,
      attachments: attach,
      uniqueId,
      status: "SD",
      createdAt: new Date(),
    };
    const chatHistory = [...selectedChatHistory];
    chatHistory.push(newMessage);
    setSelectedChatHistory(chatHistory);

    const msgPayload = {
      roomId: roomId,
      content,
      rfqId: parseInt(rfqQuoteId),
      rfqQuoteProductId,
      buyerId,
      requestedPrice,
      rfqQuotesUserId: selectedVendor?.id,
      userId: activeSellerId,
      uniqueId,
      attachments: attach,
    };
    sendMessage(msgPayload);
  };

  const handleCreateRoom = async (
    content: string,
    rfqQuoteProductId?: number,
    buyerId?: number,
    requestedPrice?: number,
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
        content: message,
        userId: user?.id,
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
        rfqQuotesUserId: null,
        attachments: attach,
        uniqueId,
        status: "SD",
        createdAt: new Date(),
      };
      const chatHistory = [...selectedChatHistory];
      chatHistory.push(newMessage);
      setSelectedChatHistory(chatHistory);

      const payload = {
        participants: [selectedVendor?.sellerID, selectedVendor?.buyerID],
        content,
        rfqId: parseInt(rfqQuoteId),
        rfqQuoteProductId,
        buyerId,
        requestedPrice,
        rfqQuotesUserId: selectedVendor?.id,
        uniqueId,
        attachments: attach,
      };
      cratePrivateRoom(payload);
    } catch (error) {
      toast({
        title: "Chat",
        description: "Failed!",
        variant: "danger",
      });
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

  const handleRequestPrice = (productId: number, requestedPrice: number) => {
    if (selectedRoom && requestedPrice) {
      sendNewMessage(
        selectedRoom,
        CHAT_REQUEST_MESSAGE.priceRequest.value,
        productId,
        selectedVendor?.buyerID,
        requestedPrice,
      );
    } else if (
      !selectedRoom &&
      requestedPrice &&
      selectedVendor?.sellerID &&
      selectedVendor?.buyerID
    ) {
      handleCreateRoom(
        CHAT_REQUEST_MESSAGE.priceRequest.value,
        productId,
        selectedVendor?.buyerID,
        requestedPrice,
      );
    }
  };

  const handleRfqRequest = (rRequest: {
    id: number;
    messageId: number;
    requestedPrice: number;
    rfqQuoteProductId: number;
    status: string;
    requestedById: number;
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
    if (rRequest.status === "APPROVED" || rRequest.status === "REJECTED") {
      const vDor = selectedVendor;
      if (vDor?.rfqQuotesProducts) {
        const index = vDor?.rfqQuotesProducts.findIndex(
          (product: any) => product.id === rRequest.rfqQuoteProductId,
        );
        if (index !== -1) {
          const pList = vDor?.rfqQuotesProducts;
          let offerPrice = pList[index].offerPrice;
          if (rRequest.status === "APPROVED") {
            offerPrice = rRequest?.requestedPrice;
          }

          let priceRequest = pList[index]?.priceRequest || null;
          if (priceRequest) {
            priceRequest = {
              ...priceRequest,
              id: rRequest.id,
              requestedPrice: rRequest.requestedPrice,
              rfqQuoteProductId: rRequest.rfqQuoteProductId,
              status: rRequest?.status,
            };
          } else if (priceRequest === null) {
            priceRequest = {
              ...rRequest,
            };
          }
          pList[index]["priceRequest"] = priceRequest;
          pList[index]["offerPrice"] = offerPrice;

          const newData = {
            ...vDor,
            offerPrice: vDor.offerPrice,
            rfqQuotesProducts: pList,
          };
          if (rRequest.newTotalOfferPrice) {
            newData.offerPrice = rRequest.newTotalOfferPrice;
          }
          setSelectedVendor(newData);
        }
      }
    }
  };

  const handleRfqProducts = (item: any) => {
    // Check if there's at least one approved price request from vendor (first vendor approval)
    const hasFirstVendorApproval =
      item?.rfqProductPriceRequests?.some(
        (request: any) =>
          request?.status === "APPROVED" &&
          request?.requestedById === item?.sellerID,
      ) || false;

    const newData =
      item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts.map((i: any) => {
        let priceRequest = null;
        let offerPrice = i.offerPrice;
        const pRequest = item?.rfqProductPriceRequests?.find(
          (request: any) => request?.rfqQuoteProductId === i.id,
        );
        if (pRequest) priceRequest = pRequest;

        if (
          pRequest &&
          pRequest?.status &&
          typeof pRequest?.status == "string"
        ) {
          if (pRequest?.status === "APPROVED") {
            offerPrice = pRequest?.requestedPrice;
          } else if (pRequest?.status === "REJECTED") {
            offerPrice = i.offerPrice;
          }
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
    const vendorDetails = {
      ...item,
      rfqQuotesProducts: newData,
    };
    setSelectedVendor(vendorDetails);
  };

  // Check if checkout is allowed (all products must have approved prices)
  const canCheckout = () => {
    if (
      !selectedVendor ||
      !selectedVendor?.rfqQuotesProducts ||
      selectedVendor.rfqQuotesProducts.length === 0
    ) {
      return false;
    }

    // Check if all products have approved price requests
    const allApproved = selectedVendor.rfqQuotesProducts.every(
      (product: any) => {
        return (
          product?.priceRequest &&
          product?.priceRequest?.status === "APPROVED" &&
          product?.offerPrice &&
          parseFloat(product.offerPrice) > 0
        );
      },
    );

    return allApproved;
  };

  // Calculate total price from approved product prices
  const calculateTotalPrice = () => {
    if (
      !selectedVendor?.rfqQuotesProducts ||
      selectedVendor.rfqQuotesProducts.length === 0
    ) {
      return 0;
    }

    return selectedVendor.rfqQuotesProducts.reduce(
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

    // NEW: Extract selected suggested products from chat history
    const selectedSuggestedProducts: any[] = [];
    selectedChatHistory.forEach((chat: any) => {
      if (chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0) {
        chat.rfqSuggestedProducts.forEach((suggestion: any) => {
          if (suggestion.isSelectedByBuyer && suggestion.suggestedProduct) {
            selectedSuggestedProducts.push({
              id: suggestion.id, // RfqSuggestedProduct ID
              suggestedProductId: suggestion.suggestedProductId,
              rfqQuoteProductId: suggestion.rfqQuoteProductId,
              offerPrice: parseFloat(suggestion.offerPrice || "0"),
              quantity: suggestion.quantity || 1,
              productName: suggestion.suggestedProduct?.productName || "Product",
              productImage: suggestion.suggestedProduct?.productImages?.[0]?.image ||
                            suggestion.suggestedProduct?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image,
              isSuggested: true, // Flag to indicate this is a suggested product
            });
          }
        });
      }
    });

    // Store RFQ quote data in order store for checkout
    const rfqQuoteData = {
      rfqQuotesUserId: selectedVendor?.id,
      rfqQuotesId: selectedVendor?.rfqQuotesId,
      sellerId: selectedVendor?.sellerID,
      buyerId: selectedVendor?.buyerID,
      totalPrice: calculatedTotal + selectedSuggestedProducts.reduce((sum, p) => sum + (p.offerPrice * p.quantity), 0),
      quoteProducts:
        selectedVendor?.rfqQuotesProducts?.map((product: any) => ({
          id: product.id,
          offerPrice: parseFloat(product.offerPrice || "0"),
          quantity: product.quantity || 1,
          priceRequestId: product.priceRequest?.id,
          isSuggested: false,
        })) || [],
      suggestedProducts: selectedSuggestedProducts, // NEW: Include selected suggested products
    };

    // Store RFQ quote data in sessionStorage for checkout page to access
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rfqQuoteData", JSON.stringify(rfqQuoteData));
    }

    // Store in order store (without rfqQuoteData to avoid type errors)
    orderStore.setOrders({
      ...orderStore.orders,
    });
    orderStore.setTotal(rfqQuoteData.totalPrice);

    // Redirect to checkout page with RFQ flag
    router.push("/checkout?fromRfq=true");
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

  // Column layout - Vendors List View
  if (layoutMode === "column" && viewMode === "vendors") {
    return (
      <div className="flex h-full flex-col">
        {allRfqQuotesQuery?.isLoading ? (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : !vendorList?.length ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p
              className="text-center text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("no_data_found")}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {vendorList?.map((item: RfqRequestVendorDetailsProps) => {
              const getVendorName = () => {
                const seller = item?.sellerIDDetail;
                if (seller?.accountName) {
                  return seller.accountName;
                }
                if (seller?.firstName && seller?.lastName) {
                  return `${seller.firstName} ${seller.lastName}`;
                }
                if (seller?.firstName) {
                  return seller.firstName;
                }
                if (seller?.email) {
                  return seller.email;
                }
                if (item?.sellerID) {
                  return `Vendor ${item.sellerID}`;
                }
                return "Unknown Vendor";
              };

              const getVendorOfferPrice = () => {
                const products =
                  item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
                const hasPriceRequests =
                  item?.rfqProductPriceRequests &&
                  item.rfqProductPriceRequests.length > 0;

                if (hasPriceRequests && products.length > 0) {
                  const calculatedTotal = products.reduce(
                    (total: number, product: any) => {
                      const priceRequest = item.rfqProductPriceRequests?.find(
                        (request: any) =>
                          request.rfqQuoteProductId === product.id,
                      );
                      if (priceRequest) {
                        const price = parseFloat(
                          priceRequest.requestedPrice || "0",
                        );
                        const quantity = product.quantity || 1;
                        return total + price * quantity;
                      }
                      return total;
                    },
                    0,
                  );
                  return calculatedTotal > 0 ? calculatedTotal.toString() : "-";
                }

                if (products.length > 0) {
                  const allHaveBudgetRange = products.every(
                    (product: any) =>
                      product.offerPriceFrom &&
                      product.offerPriceTo &&
                      product.offerPriceFrom > 0 &&
                      product.offerPriceTo > 0,
                  );
                  if (allHaveBudgetRange) {
                    const budgetMaxTotal = products.reduce(
                      (total: number, product: any) => {
                        const maxPrice = parseFloat(
                          product.offerPriceTo || "0",
                        );
                        const quantity = product.quantity || 1;
                        return total + maxPrice * quantity;
                      },
                      0,
                    );
                    const currentOfferPrice = parseFloat(
                      item?.offerPrice || "0",
                    );
                    if (Math.abs(currentOfferPrice - budgetMaxTotal) < 0.01) {
                      return "-";
                    }
                  }
                }
                return item?.offerPrice || "-";
              };

              const isSelected = selectedVendorId === item?.id || selectedVendorId === item?.sellerID;

              return (
                <div
                  key={item?.id}
                  onClick={() => {
                    handleRfqProducts(item);
                    setActiveSellerId(item?.sellerID);
                    setRfqQuotesUserId(item.id);
                    onSelectVendor?.(item);
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 p-1.5 transition-all hover:shadow-md",
                    isSelected
                      ? "border-warning bg-warning/5"
                      : "border-border bg-card hover:border-border",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white ring-1 ring-gray-100">
                      <Image
                        src={
                          item?.sellerIDDetail?.profilePicture ||
                          PlaceholderImage
                        }
                        alt={getVendorName()}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {getVendorName()}
                      </h4>
                      {getVendorOfferPrice() && getVendorOfferPrice() !== "-" ? (
                        <p className="mt-0.5 text-[10px] font-bold text-success">
                          {t("offer_price")}: {currency.symbol}
                          {getVendorOfferPrice()}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {t("no_offer_yet") || "No offer yet"}
                        </p>
                      )}
                      {item.unreadMsgCount > 0 && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="text-[9px] text-primary font-medium">
                            {item.unreadMsgCount} {t("unread_messages")}
                          </span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-warning"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Column layout - Details/Chat View
  if (layoutMode === "column" && viewMode === "details") {
    if (!selectedVendor) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <p className="text-center text-sm text-muted-foreground">
            Select a vendor to view details
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header with Vendor Info, Price and Checkout */}
        <div className="flex-shrink-0 border-b border-border bg-card px-3 py-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Vendor Info */}
            <div className="flex items-center gap-2">
              {selectedVendor?.sellerIDDetail?.profilePicture && (
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-warning/20 shadow-sm">
                  <Image
                    src={selectedVendor.sellerIDDetail.profilePicture}
                    alt="Vendor"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {selectedVendor?.sellerIDDetail?.accountName ||
                    `${selectedVendor?.sellerIDDetail?.firstName || ""} ${selectedVendor?.sellerIDDetail?.lastName || ""}`.trim() ||
                    selectedVendor?.sellerIDDetail?.email ||
                    `Vendor ${selectedVendor?.sellerID}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("vendor_details") || "Vendor Details"}
                </p>
              </div>
            </div>

            {/* Price and Checkout */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-success/5 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-success shadow-sm">
                  <svg
                    className="h-3 w-3 text-white"
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
                  <span
                    className="text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                    dir={langDir}
                    translate="no"
                  >
                    Total Price
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {(() => {
                      // Calculate main products total
                      let mainProductsTotal = 0;
                      if (
                        selectedVendor?.rfqQuotesProducts &&
                        selectedVendor.rfqQuotesProducts.length > 0
                      ) {
                        mainProductsTotal =
                        selectedVendor.rfqQuotesProducts.reduce(
                          (total: number, product: any) => {
                            if (
                              product?.priceRequest &&
                              product?.priceRequest?.status === "APPROVED" &&
                              product?.offerPrice
                            ) {
                              const price = parseFloat(
                                product.offerPrice || "0",
                              );
                              const quantity = product.quantity || 1;
                              return total + price * quantity;
                            }
                            return total;
                          },
                          0,
                        );
                      } else {
                        mainProductsTotal = parseFloat(
                          selectedVendor?.offerPrice || "0",
                        );
                      }

                      // Calculate selected suggested products total (including pending selections)
                      const selectedSuggestedTotal = (() => {
                        // Get all suggestions from chat history
                        const allSuggestions = selectedChatHistory
                          .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
                          .filter((s: any) => (s.quantity ?? 0) > 0);
                        
                        // Create a map of productId -> selected suggestion IDs (from chat + pending)
                        const selectedByProduct = new Map<number, Set<number>>();
                        
                        // Add selections from chat history
                        allSuggestions.forEach((s: any) => {
                          if (s.isSelectedByBuyer && s.rfqQuoteProductId) {
                            if (!selectedByProduct.has(s.rfqQuoteProductId)) {
                              selectedByProduct.set(s.rfqQuoteProductId, new Set());
                            }
                            selectedByProduct.get(s.rfqQuoteProductId)!.add(s.id);
                          }
                        });
                        
                        // Merge pending selections
                        pendingProductSelections.forEach((pendingIds, productId) => {
                          if (!selectedByProduct.has(productId)) {
                            selectedByProduct.set(productId, new Set());
                          }
                          pendingIds.forEach(id => {
                            selectedByProduct.get(productId)!.add(id);
                          });
                        });
                        
                        // Calculate total from selected suggestions
                        return allSuggestions.reduce((total: number, suggestion: any) => {
                          const productId = suggestion.rfqQuoteProductId;
                          const selectedIds = selectedByProduct.get(productId);
                          if (selectedIds && selectedIds.has(suggestion.id)) {
                            const price = parseFloat(suggestion.offerPrice || "0");
                            const quantity = suggestion.quantity || 1;
                            return total + price * quantity;
                          }
                          return total;
                        }, 0);
                      })();

                      const totalPrice = mainProductsTotal + selectedSuggestedTotal;

                      // Check if we have approved prices or if we should show the original offer price
                      const hasApprovedPrices =
                        selectedVendor?.rfqQuotesProducts?.some(
                          (product: any) =>
                            product?.priceRequest &&
                            product?.priceRequest?.status === "APPROVED",
                        ) || false;

                      if (hasApprovedPrices && mainProductsTotal > 0) {
                        return `${currency.symbol}${totalPrice}`;
                      } else if (selectedSuggestedTotal > 0) {
                        // If we have selected suggested products but no approved main products
                        return `${currency.symbol}${totalPrice}`;
                      } else if (selectedVendor?.offerPrice) {
                        return `${currency.symbol}${selectedVendor?.offerPrice}`;
                      }
                      return "-";
                    })()}
                  </span>
                </div>
              </div>
              {(() => {
                if (
                  !selectedVendor?.rfqQuotesProducts ||
                  selectedVendor.rfqQuotesProducts.length === 0
                ) {
                  return selectedVendor?.offerPrice ? true : false;
                }
                const hasApprovedPrices =
                  selectedVendor.rfqQuotesProducts.some(
                    (product: any) =>
                      product?.priceRequest &&
                      product?.priceRequest?.status === "APPROVED",
                  );
                return hasApprovedPrices || selectedVendor?.offerPrice;
              })() && (
                <button
                  onClick={handleCheckout}
                  disabled={!canCheckout()}
                  className="bg-dark-orange inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  dir={langDir}
                  translate="no"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {t("checkout")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Table and Chat */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 px-2 py-1.5 gap-1.5">
          {/* Product Details Table - list style like vendor side */}
          {selectedVendor?.rfqQuotesProducts?.length > 0 ? (
            <div className="flex-shrink-0 overflow-hidden rounded border border-border bg-card">
              <div className="grid grid-cols-4 gap-1 border-b border-border bg-muted px-3 py-1.5">
                <div
                  className="text-[11px] font-semibold text-muted-foreground"
                  dir={langDir}
                  translate="no"
                >
                  {t("component") || "Component"}
                </div>
                <div
                  className="text-[11px] font-semibold text-muted-foreground text-center"
                  dir={langDir}
                  translate="no"
                >
                  {t("selection") || "Selection"}
                </div>
                <div
                  className="text-[11px] font-semibold text-muted-foreground text-center"
                  dir={langDir}
                  translate="no"
                >
                  {t("price") || "Price"}
                </div>
                <div
                  className="text-[11px] font-semibold text-muted-foreground text-center"
                  dir={langDir}
                  translate="no"
                >
                  {t("address") || "Address"}
                </div>
                </div>
              <div className="overflow-y-auto max-h-[220px]">
                <div className="min-w-[700px]">
                {rfqQuotesUsersByBuyerIdQuery.isLoading ? (
                  <div className="space-y-1 p-2">
                    {Array.from({ length: 1 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                    selectedVendor?.rfqQuotesProducts?.map((item: any) => {
                      const suggestions = getSuggestionsForRfqQuoteProduct(
                        item.id,
                      );

                      return (
                        <div
                          key={item.id}
                          className="border-b border-border"
                        >
                          {/* Main requested product row */}
                          <div className="grid grid-cols-4 items-center gap-2 px-3 py-2.5 bg-card">
                            {/* Requested product info */}
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                                <Image
                                  src={
                                    item?.rfqProductDetails?.productImages?.[0]
                                      ?.image || PlaceholderImage
                                  }
                                  alt={
                                    item?.rfqProductDetails?.productName ||
                                    "Product"
                                  }
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {translate(item?.rfqProductDetails?.productName || "-")}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {item?.deliveryDate ||
                                    rfqQuoteDetailsById
                                      ?.rfqQuotes_rfqQuoteAddress?.rfqDate ||
                                    "-"}
                                </p>
                              </div>
                            </div>

                            {/* Selection column */}
                            <div className="flex justify-center">
                              {(() => {
                                const suggestions = getSuggestionsForRfqQuoteProduct(item.id);
                                const hasSuggestions = suggestions.length > 0;
                                
                                if (!hasSuggestions) {
                                  return (
                                    <span className="text-[10px] text-muted-foreground">
                                      {item?.productType === "SIMILAR"
                                        ? t("similar_product") || "Similar product"
                                        : t("same_product") || "Same product"}
                                    </span>
                                  );
                                }
                                
                                return (
                                  <button
                                    onClick={() => handleOpenProductSelectionModal(item.id, selectedVendor?.id || 0)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white text-[10px] font-medium hover:bg-primary/90 transition-colors"
                                    translate="no"
                                  >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t("choose") || "Choose"}
                                  </button>
                                );
                              })()}
                            </div>

                            {/* Price column */}
                            <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
                              <span className="font-bold">
                                {(() => {
                                  // Multiply price by quantity
                                  const quantity = item?.quantity || 1;
                                  if (item?.offerPrice) {
                                    const totalPrice = parseFloat(item.offerPrice.toString()) * quantity;
                                    return `${currency.symbol}${totalPrice}`;
                                  }
                                  return "-";
                                })()}
                              </span>
                            </div>

                            {/* Address column */}
                            <div className="text-center text-[10px] text-muted-foreground">
                              <span className="line-clamp-2">
                                {item?.address ||
                                  rfqQuoteDetailsById
                                    ?.rfqQuotes_rfqQuoteAddress?.address ||
                                  "-"}
                              </span>
                            </div>
                          </div>

                          {/* Suggested products under this requested product - only show selected ones */}
                          {(() => {
                            const suggestions = getSuggestionsForRfqQuoteProduct(item.id);
                            const selectedSuggestions = suggestions.filter((s: any) => s.isSelectedByBuyer);
                            
                            if (selectedSuggestions.length === 0) return null;
                            
                            return (
                              <div className="border-t border-border bg-muted px-3 py-2">
                                {selectedSuggestions.map((s: any) => {
                                const p = s.suggestedProduct;
                                const imageUrl =
                                  p?.product_productPrice?.[0]
                                    ?.productPrice_productSellerImage?.[0]
                                    ?.image ||
                                  p?.productImages?.[0]?.image ||
                                  PlaceholderImage;
                                const unitPrice =
                                  s.offerPrice ||
                                  p?.product_productPrice?.[0]?.offerPrice ||
                                  p?.product_productPrice?.[0]?.productPrice ||
                                  0;
                                // Multiply price by quantity
                                const quantity = s.quantity || 1;
                                const price = parseFloat(unitPrice.toString()) * quantity;
                                const isSelected = !!s.isSelectedByBuyer;
                                const isSelecting = selectingSuggestions.has(s.id);
                                const rfqQuotesUserId = selectedVendor?.id;

                                // Collect all currently selected product IDs for this RFQ product
                                const allSelectedIds = suggestions
                                  .filter((sug: any) => sug.isSelectedByBuyer)
                                  .map((sug: any) => sug.id);

                                return (
                                  <div
                                    key={s.id}
                                    className="grid grid-cols-4 items-center gap-2 py-1.5 pl-8 text-[11px]"
                                  >
                                    {/* Component column */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-border bg-card">
                                        <Image
                                          src={imageUrl}
                                          alt={p?.productName || "Product"}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="truncate block text-[11px]">
                                          {translate(p?.productName || "-")}
                                        </span>
                                        {s.quantity && s.quantity > 0 && (
                                          <span className="text-[9px] text-muted-foreground">
                                            Qty: {s.quantity}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Selection column - show selected badge */}
                                    <div className="flex justify-center">
                                      {isSelected && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 text-success text-[9px] font-medium">
                                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                          {t("selected") || "Selected"}
                                        </span>
                                      )}
                                    </div>

                                    {/* Price column */}
                                    <div className="text-center text-[10px] text-muted-foreground">
                                      <span>
                                        {price ? `${currency.symbol}${price}` : "-"}
                                      </span>
                                    </div>

                                    {/* Address column - empty for suggested products */}
                                    <div className="text-center text-[10px] text-muted-foreground">
                                      <span>-</span>
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Send Update and Cancel Buttons */}
          {hasPendingSelections && (
            <div className="border-t border-border bg-muted px-3 py-2 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setPendingProductSelections(new Map());
                  setHasPendingSelections(false);
                }}
                className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSendUpdateToVendor}
                className="px-4 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
              >
                {"Send Update"}
              </button>
            </div>
          )}

          {/* Product Selection Modal */}
          <BuyerProductSelectionModal
            isOpen={showProductSelectionModal}
            onClose={handleCloseProductSelectionModal}
            onSelectProducts={handleProductSelectionFromModal}
            suggestedProducts={selectedProductForModal 
              ? getSuggestionsForRfqQuoteProduct(selectedProductForModal.rfqQuoteProductId)
              : []
            }
            rfqQuoteProductId={selectedProductForModal?.rfqQuoteProductId || 0}
            rfqQuotesUserId={selectedProductForModal?.rfqQuotesUserId || 0}
          />

          {/* Chat History - Takes remaining space */}
          <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-sm min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-0">
              <RfqRequestChatHistory
                roomId={selectedRoom}
                selectedChatHistory={selectedChatHistory}
                chatHistoryLoading={chatHistoryLoading}
                activeSellerId={activeSellerId}
                unreadMsgCount={selectedVendor?.unreadMsgCount}
                rfqUserId={selectedVendor?.id}
                updateVendorMessageCount={updateVendorMessageCount}
                onProductSelected={handleChatHistory}
              />
            </div>
          </div>
        </div>

        {/* Message Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-card px-3 py-2">
          {/* Attachment Preview */}
          {!isAttachmentUploading && attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {attachments.map((file: any, index: any) => (
                <div
                  key={index}
                  className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 shadow-sm transition-all hover:border-destructive/30 hover:bg-destructive/5"
                >
                  <svg
                    className="h-3 w-3 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span className="max-w-[150px] truncate text-xs text-muted-foreground">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-0.5 rounded-full p-0.5 text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <svg
                      className="h-3 w-3"
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
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="mb-2 rounded-lg border border-border bg-card p-1 shadow-lg">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-end gap-2">
            {/* File Attachment Button */}
            <label className="hover:border-dark-orange hover:text-dark-orange flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5">
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <Image src={AttachIcon} alt="attach-icon" className="h-4 w-4" />
            </label>

            {/* Text Input */}
            <div className="focus-within:border-dark-orange flex-1 rounded-lg border-2 border-border bg-card transition-all focus-within:ring-1 focus-within:ring-orange-100">
              <textarea
                placeholder={t("type_your_message") || "Type your message..."}
                className="w-full resize-none rounded-lg border-0 bg-transparent px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
                rows={1}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                }}
                onKeyDown={handleSendMessageKeyDown}
              />
            </div>

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={cn(
                "hover:border-dark-orange hover:text-dark-orange flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5",
                showEmoji &&
                  "border-dark-orange text-dark-orange bg-warning/5",
              )}
            >
              <Image src={SmileIcon} alt="smile-icon" className="h-4 w-4" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              type="button"
              disabled={!message.trim() && attachments.length === 0}
              className={cn(
                "bg-dark-orange flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted-foreground",
              )}
            >
              <Image src={SendIcon} alt="send-icon" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default) - Show everything
  return (
    <div className="space-y-6">
      {/* Request Info Section - Top */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
        <div className="bg-dark-orange flex min-h-[70px] w-full items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/20 backdrop-blur-sm">
              <svg
                className="h-6 w-6 text-white"
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
              <h2
                className="text-lg font-bold text-white"
                dir={langDir}
                translate="no"
              >
                {t("request_for_rfq")}
              </h2>
              <p className="mt-0.5 text-xs text-white/90">
                {t("view_request_details") || "View your request details"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <RequestProductCard
            rfqId={rfqQuoteId}
            productImages={selectedVendor?.rfqQuotesProducts
              ?.map((item: any) => item?.rfqProductDetails?.productImages)
              ?.map((item: any) => item?.[0])}
          />
        </div>
      </div>

      {/* Vendor List Section - Middle */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
        <div className="flex min-h-[50px] w-full items-center justify-between border-b border-border bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
              <svg
                className="h-4 w-4 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-sm font-bold text-foreground"
                dir={langDir}
                translate="no"
              >
                {t("vendor_lists")}
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {t("select_vendor_to_chat") ||
                  "Select a vendor to view details and chat"}
              </p>
            </div>
          </div>
          {vendorList?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white shadow-md">
                {vendorList.length}
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          {allRfqQuotesQuery?.isLoading ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : null}

          {!allRfqQuotesQuery?.isLoading && !vendorList?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-10 w-10 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p
                className="text-center text-base font-medium text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("no_data_found")}
              </p>
            </div>
          ) : null}

          {!allRfqQuotesQuery?.isLoading && vendorList?.length > 0 && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {vendorList?.map((item: RfqRequestVendorDetailsProps) => {
                // Get vendor name with priority: accountName > firstName+lastName > firstName > email > fallback
                const getVendorName = () => {
                  const seller = item?.sellerIDDetail;
                  if (seller?.accountName) {
                    return seller.accountName;
                  }
                  if (seller?.firstName && seller?.lastName) {
                    return `${seller.firstName} ${seller.lastName}`;
                  }
                  if (seller?.firstName) {
                    return seller.firstName;
                  }
                  if (seller?.email) {
                    return seller.email;
                  }
                  if (item?.sellerID) {
                    return `Vendor ${item.sellerID}`;
                  }
                  return "Unknown Vendor";
                };

                // Calculate actual vendor offer price from price requests
                const getVendorOfferPrice = () => {
                  const products =
                    item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];

                  // Check if vendor has provided any price requests
                  const hasPriceRequests =
                    item?.rfqProductPriceRequests &&
                    item.rfqProductPriceRequests.length > 0;

                  if (hasPriceRequests && products.length > 0) {
                    // Vendor has provided price requests - calculate total from those
                    const calculatedTotal = products.reduce(
                      (total: number, product: any) => {
                        const priceRequest = item.rfqProductPriceRequests?.find(
                          (request: any) =>
                            request.rfqQuoteProductId === product.id,
                        );

                        if (priceRequest) {
                          // Use the price from the price request (vendor's actual offer)
                          const price = parseFloat(
                            priceRequest.requestedPrice || "0",
                          );
                          const quantity = product.quantity || 1;
                          return total + price * quantity;
                        }

                        return total;
                      },
                      0,
                    );

                    return calculatedTotal > 0
                      ? calculatedTotal.toString()
                      : "-";
                  }

                  // No price requests from vendor - check if offerPrice is from customer's budget range
                  if (products.length > 0) {
                    // Check if all products have budget range
                    const allHaveBudgetRange = products.every(
                      (product: any) =>
                        product.offerPriceFrom &&
                        product.offerPriceTo &&
                        product.offerPriceFrom > 0 &&
                        product.offerPriceTo > 0,
                    );

                    if (allHaveBudgetRange) {
                      // Calculate total budget range maximum
                      const budgetMaxTotal = products.reduce(
                        (total: number, product: any) => {
                          const maxPrice = parseFloat(
                            product.offerPriceTo || "0",
                          );
                          const quantity = product.quantity || 1;
                          return total + maxPrice * quantity;
                        },
                        0,
                      );

                      // If offerPrice matches the budget range maximum, it's not a vendor offer
                      const currentOfferPrice = parseFloat(
                        item?.offerPrice || "0",
                      );
                      if (Math.abs(currentOfferPrice - budgetMaxTotal) < 0.01) {
                        // This is the customer's budget range, not vendor's offer
                        return "-";
                      }
                    }
                  }

                  // Return original offerPrice if it exists and is not from budget range
                  return item?.offerPrice || "-";
                };

                return (
                  <RfqRequestVendorCard
                    key={item?.id}
                    name={getVendorName()}
                    profilePicture={item?.sellerIDDetail?.profilePicture}
                    offerPrice={getVendorOfferPrice()}
                    onClick={() => {
                      setActiveSellerId(item?.sellerID);
                      setRfqQuotesUserId(item.id);
                      handleRfqProducts(item);
                      if (layoutMode === "column" && onSelectVendor) {
                        onSelectVendor(item);
                      }
                    }}
                    seller={item.sellerIDDetail}
                    isSelected={
                      layoutMode === "column"
                        ? selectedVendorId === item?.id ||
                          selectedVendorId === item?.sellerID
                        : activeSellerId === item?.sellerID
                    }
                    vendor={item}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat & Product Details Section - Bottom */}
      {selectedVendor && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
          {/* Header with Vendor Info, Price and Checkout */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Vendor Info */}
              <div className="flex items-center gap-4">
                {selectedVendor?.sellerIDDetail?.profilePicture && (
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-warning/20 shadow-md">
                    <Image
                      src={selectedVendor.sellerIDDetail.profilePicture}
                      alt="Vendor"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedVendor?.sellerIDDetail?.accountName ||
                      `${selectedVendor?.sellerIDDetail?.firstName || ""} ${selectedVendor?.sellerIDDetail?.lastName || ""}`.trim() ||
                      selectedVendor?.sellerIDDetail?.email ||
                      `Vendor ${selectedVendor?.sellerID}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("vendor_details") || "Vendor Details"}
                  </p>
                </div>
              </div>

              {/* Price and Checkout */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-success/5 px-5 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success shadow-md">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <span
                      className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                      dir={langDir}
                      translate="no"
                    >
                      {t("offering_price")}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {(() => {
                        // Calculate total from approved product prices
                        if (
                          !selectedVendor?.rfqQuotesProducts ||
                          selectedVendor.rfqQuotesProducts.length === 0
                        ) {
                          return selectedVendor?.offerPrice
                            ? `${currency.symbol}${selectedVendor?.offerPrice}`
                            : "-";
                        }
                        const calculatedTotal =
                          selectedVendor.rfqQuotesProducts.reduce(
                            (total: number, product: any) => {
                              if (
                                product?.priceRequest &&
                                product?.priceRequest?.status === "APPROVED" &&
                                product?.offerPrice
                              ) {
                                const price = parseFloat(
                                  product.offerPrice || "0",
                                );
                                const quantity = product.quantity || 1;
                                return total + price * quantity;
                              }
                              return total;
                            },
                            0,
                          );
                        // If we have approved prices, show calculated total, otherwise show original offer price
                        const hasApprovedPrices =
                          selectedVendor.rfqQuotesProducts.some(
                            (product: any) =>
                              product?.priceRequest &&
                              product?.priceRequest?.status === "APPROVED",
                          );
                        return hasApprovedPrices && calculatedTotal > 0
                          ? `${currency.symbol}${calculatedTotal}`
                          : selectedVendor?.offerPrice
                            ? `${currency.symbol}${selectedVendor?.offerPrice}`
                            : "-";
                      })()}
                    </span>
                  </div>
                </div>
                {(() => {
                  // Show checkout button if there are approved prices or original offer price exists
                  if (
                    !selectedVendor?.rfqQuotesProducts ||
                    selectedVendor.rfqQuotesProducts.length === 0
                  ) {
                    return selectedVendor?.offerPrice ? true : false;
                  }
                  const hasApprovedPrices =
                    selectedVendor.rfqQuotesProducts.some(
                      (product: any) =>
                        product?.priceRequest &&
                        product?.priceRequest?.status === "APPROVED",
                    );
                  return hasApprovedPrices || selectedVendor?.offerPrice;
                })() && (
                  <button
                    onClick={handleCheckout}
                    disabled={!canCheckout()}
                    className="bg-dark-orange inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    dir={langDir}
                    translate="no"
                  >
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {t("checkout")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {selectedVendor?.rfqQuotesProducts?.length > 0 ? (
              <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-md">
                <div className="sticky top-0 z-10 grid grid-cols-6 gap-4 border-b border-border bg-card px-4 py-4">
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("product")}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("delivery_date")}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("brand")}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("number_of_piece")}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("price")}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground md:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("address")}
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {rfqQuotesUsersByBuyerIdQuery.isLoading ? (
                    <div className="space-y-2 p-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    selectedVendor?.rfqQuotesProducts?.map(
                      (item: {
                        id: number;
                        priceRequest: any;
                        offerPrice: string;
                        note: string;
                        quantity: number;
                        offerPriceFrom?: number;
                        offerPriceTo?: number;
                        productType?: string;
                        hasFirstVendorApproval?: boolean;
                        rfqProductDetails: {
                          productName: string;
                          productImages: {
                            id: number;
                            image: string;
                          }[];
                        };
                      }) => (
                        <OfferPriceCard
                          key={item?.id}
                          productId={item?.id}
                          offerPrice={item?.offerPrice}
                          note={item?.note}
                          quantity={item?.quantity}
                          productType={item?.productType}
                          offerPriceFrom={item?.offerPriceFrom}
                          offerPriceTo={item?.offerPriceTo}
                          address={
                            rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress
                              ?.address
                          }
                          deliveryDate={
                            rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress
                              ?.rfqDate
                          }
                          productImage={
                            item?.rfqProductDetails?.productImages[0]?.image
                          }
                          productName={item?.rfqProductDetails?.productName}
                          onRequestPrice={handleRequestPrice}
                          priceRequest={item?.priceRequest}
                          isBuyer={true}
                          hasFirstVendorApproval={
                            item?.hasFirstVendorApproval || false
                          }
                        />
                      ),
                    )
                  )}
                </div>
              </div>
            ) : !rfqQuotesUsersByBuyerIdQuery?.isLoading &&
              !selectedVendor?.rfqQuotesProducts?.length ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <p
                  className="text-center text-sm font-medium text-muted-foreground"
                  dir={langDir}
                  translate="no"
                >
                  {t("no_data_found")}
                </p>
              </div>
            ) : null}

            {/* Chat History */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              <RfqRequestChatHistory
                roomId={selectedRoom}
                selectedChatHistory={selectedChatHistory}
                chatHistoryLoading={chatHistoryLoading}
                activeSellerId={activeSellerId}
                unreadMsgCount={selectedVendor?.unreadMsgCount}
                rfqUserId={selectedVendor?.id}
                updateVendorMessageCount={updateVendorMessageCount}
                onProductSelected={handleChatHistory}
              />
            </div>
          </div>

          {/* Message Input Area */}
          <div className="border-t border-border bg-card px-6 py-5">
            {/* Attachment Preview */}
            {!isAttachmentUploading && attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file: any, index: any) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm transition-all hover:border-destructive/30 hover:bg-destructive/5"
                  >
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 rounded-full p-1 text-destructive transition-colors hover:bg-destructive/10"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="mb-3 rounded-lg border border-border bg-card p-2 shadow-lg">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-3">
              {/* File Attachment Button */}
              <label className="hover:border-dark-orange hover:text-dark-orange flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5">
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <Image src={AttachIcon} alt="attach-icon" className="h-5 w-5" />
              </label>

              {/* Text Input */}
              <div className="focus-within:border-dark-orange flex-1 rounded-lg border-2 border-border bg-card transition-all focus-within:ring-2 focus-within:ring-orange-100">
                <textarea
                  placeholder={t("type_your_message") || "Type your message..."}
                  className="w-full resize-none rounded-lg border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                  rows={1}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleSendMessageKeyDown}
                />
              </div>

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={cn(
                  "hover:border-dark-orange hover:text-dark-orange flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5",
                  showEmoji &&
                    "border-dark-orange text-dark-orange bg-warning/5",
                )}
              >
                <Image src={SmileIcon} alt="smile-icon" className="h-5 w-5" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                type="button"
                disabled={!message.trim() && attachments.length === 0}
                className={cn(
                  "bg-dark-orange flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-muted-foreground disabled:hover:scale-100",
                )}
              >
                <Image src={SendIcon} alt="send-icon" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RfqRequestChat;
