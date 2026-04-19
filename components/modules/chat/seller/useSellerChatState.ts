import { useEffect, useState } from "react";
import { useAllRfqQuotesUsersBySellerId, useHideRfqRequest } from "@/apis/queries/rfq.queries";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

/**
 * Manages all state and socket-driven side-effects for the SellerChat feature.
 * Returns state slices, setters, socket values, and query/mutation instances.
 * Action handlers live in useSellerChatActions.
 */
export function useSellerChatState() {
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();

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
  const [isAttachmentUploading, setIsAttachmentUploading] = useState<boolean>(false);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [showProductSuggestionModal, setShowProductSuggestionModal] = useState<boolean>(false);
  const [suggestingForProductId, setSuggestingForProductId] = useState<number | null>(null);
  const [suggestingForProductQuantity, setSuggestingForProductQuantity] = useState<number>(1);
  const [editingPriceProductId, setEditingPriceProductId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [showHiddenRequests, setShowHiddenRequests] = useState<boolean>(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [pendingPriceUpdates, setPendingPriceUpdates] = useState<Map<number, number>>(new Map());
  const [pendingSuggestionUpdates, setPendingSuggestionUpdates] = useState<
    Map<number, Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>>
  >(new Map());
  const [hasPendingUpdates, setHasPendingUpdates] = useState<boolean>(false);

  const socket = useSocket();
  const allRfqQuotesQuery = useAllRfqQuotesUsersBySellerId({ page: 1, limit: 10, showHidden: showHiddenRequests });
  const hideRfqRequestMutation = useHideRfqRequest();

  // Populate rfqQuotes from API response
  useEffect(() => {
    const rfqQuotesDetails = allRfqQuotesQuery.data?.data;
    if (rfqQuotesDetails) {
      setRfqQuotes(rfqQuotesDetails);
    }
  }, [allRfqQuotesQuery.data?.data]);

  // Surface socket error as toast
  useEffect(() => {
    if (socket.errorMessage) {
      toast({ title: t("chat"), description: socket.errorMessage, variant: "danger" });
      socket.clearErrorMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.errorMessage]);

  // Update selectedRoom when a new room is created
  useEffect(() => {
    if (socket.newRoom?.roomId) {
      setSelectedRoom(socket.newRoom.roomId);
    }
  }, [socket.newRoom]);

  return {
    // auth
    user, t, toast,
    // state
    activeSellerId, setActiveSellerId,
    quoteProducts, setQuoteProducts,
    rfqQuotes, setRfqQuotes,
    selectedRfqQuote, setSelectedRfqQuote,
    chatHistoryLoading, setChatHistoryLoading,
    selectedChatHistory, setSelectedChatHistory,
    selectedRoom, setSelectedRoom,
    message, setMessage,
    showEmoji, setShowEmoji,
    attachments, setAttachments,
    isAttachmentUploading, setIsAttachmentUploading,
    showDetailView, setShowDetailView,
    showProductSuggestionModal, setShowProductSuggestionModal,
    suggestingForProductId, setSuggestingForProductId,
    suggestingForProductQuantity, setSuggestingForProductQuantity,
    editingPriceProductId, setEditingPriceProductId,
    editingPriceValue, setEditingPriceValue,
    showHiddenRequests, setShowHiddenRequests,
    selectedRequests, setSelectedRequests,
    isSelectMode, setIsSelectMode,
    pendingPriceUpdates, setPendingPriceUpdates,
    pendingSuggestionUpdates, setPendingSuggestionUpdates,
    hasPendingUpdates, setHasPendingUpdates,
    // query / mutation
    allRfqQuotesQuery,
    hideRfqRequestMutation,
    // socket
    socket,
  };
}

export type SellerChatStateReturn = ReturnType<typeof useSellerChatState>;
