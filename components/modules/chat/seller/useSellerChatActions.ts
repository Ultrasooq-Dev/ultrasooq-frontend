import { useEffect } from "react";
import { EmojiClickData } from "emoji-picker-react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/orderStore";
import { SellerChatStateReturn } from "./useSellerChatState";
import { RfqQuoteType } from "./sellerChatTypes";
import { buildQuoteProducts, canCheckout, calculateTotalPrice, getSuggestionsForRfqQuoteProduct } from "./sellerChatUtils";
import { useSellerChatMessaging } from "./useSellerChatMessaging";

/**
 * Higher-level action handlers: RFQ product state, suggestions, pricing,
 * bulk hide/unhide, checkout, and emoji/file helpers.
 */
export function useSellerChatActions(s: SellerChatStateReturn) {
  const { t, toast, user, socket } = s;
  const router = useRouter();
  const orderStore = useOrderStore();
  const messaging = useSellerChatMessaging(s);

  // React to rfqRequest socket events
  useEffect(() => {
    if (socket.rfqRequest) {
      handleRfqRequest(socket.rfqRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket.rfqRequest]);

  const handleRfqRequest = (rRequest: { id: number; messageId: number; requestedPrice: number; rfqQuoteProductId: number; requestedById: number; status: string; newTotalOfferPrice: number }) => {
    const chatHistory = [...s.selectedChatHistory];
    const index = chatHistory.findIndex((chat) => chat.id === rRequest.messageId);
    if (index !== -1) {
      chatHistory[index] = { ...chatHistory[index], rfqProductPriceRequest: { ...chatHistory[index].rfqProductPriceRequest, status: rRequest.status } };
      s.setSelectedChatHistory(chatHistory);
    }
    if (rRequest.status === "APPROVED") {
      s.setSelectedRfqQuote((prev: any) => ({ ...prev, offerPrice: rRequest.newTotalOfferPrice }));
    }
    messaging.handleRfqProductPriceUpdate(rRequest);
  };

  const handleRfqProducts = (item: any) => { s.setQuoteProducts(buildQuoteProducts(item)); };

  const handleProductsSelected = async (
    products: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>,
  ) => {
    if (!s.suggestingForProductId || !s.selectedRfqQuote || !user?.id) return;
    s.setPendingSuggestionUpdates((prev) => { const m = new Map(prev); m.set(s.suggestingForProductId!, products); return m; });
    s.setHasPendingUpdates(true);
    s.setShowProductSuggestionModal(false);
    s.setSuggestingForProductId(null);
    s.setSuggestingForProductQuantity(1);
  };

  const handleRequestPrice = (productId: number, requestedPrice: number) => {
    if (requestedPrice && requestedPrice > 0) {
      s.setPendingPriceUpdates((prev) => { const m = new Map(prev); m.set(productId, requestedPrice); return m; });
      s.setHasPendingUpdates(true);
    }
    if (requestedPrice) s.setHasPendingUpdates(true);
  };

  const handleSendUpdate = async () => {
    if (!s.selectedRfqQuote?.sellerID || !s.hasPendingUpdates) return;
    if (!s.selectedRoom && s.selectedRfqQuote?.buyerID) {
      await messaging.handleCreateRoom("", undefined, s.selectedRfqQuote.sellerID, undefined);
    }
    if (!s.selectedRoom) return;
    for (const [productId, price] of s.pendingPriceUpdates.entries()) {
      messaging.sendNewMessage(s.selectedRoom, "", productId, s.selectedRfqQuote.sellerID, price);
    }
    for (const [productId, suggestedProducts] of s.pendingSuggestionUpdates.entries()) {
      const productsToSend = suggestedProducts.map((p: any) => ({ suggestedProductId: p.suggestedProductId, offerPrice: p.offerPrice, quantity: p.quantity }));
      messaging.sendNewMessage(s.selectedRoom, "", undefined, s.selectedRfqQuote.sellerID, undefined, productId, productsToSend);
    }
    messaging.sendNewMessage(s.selectedRoom, "Vendor made update in product list, you can check.", undefined, s.selectedRfqQuote.sellerID, undefined, undefined, undefined);
    s.setPendingPriceUpdates(new Map());
    s.setPendingSuggestionUpdates(new Map());
    s.setHasPendingUpdates(false);
  };

  const handleHideRequest = async (e: React.MouseEvent, rfqQuotesUserId: number) => {
    e.stopPropagation();
    try {
      await s.hideRfqRequestMutation.mutateAsync({ rfqQuotesUserId, isHidden: true });
      if (!s.showHiddenRequests) s.setRfqQuotes((prev) => prev.filter((q) => q.id !== rfqQuotesUserId));
      toast({ title: t("success") || "Success", description: t("request_hidden_successfully"), variant: "success" });
    } catch (error) {
      toast({ title: t("error") || "Error", description: t("failed_to_hide_request"), variant: "danger" });
    }
  };

  const handleUnhideRequest = async (e: React.MouseEvent, rfqQuotesUserId: number) => {
    e.stopPropagation();
    try {
      await s.hideRfqRequestMutation.mutateAsync({ rfqQuotesUserId, isHidden: false });
      if (s.showHiddenRequests) s.setRfqQuotes((prev) => prev.filter((q) => q.id !== rfqQuotesUserId));
      toast({ title: t("success") || "Success", description: t("request_unhidden_successfully"), variant: "success" });
    } catch (error) {
      toast({ title: t("error") || "Error", description: t("failed_to_unhide_request"), variant: "danger" });
    }
  };

  const handleToggleSelect = (rfqQuotesUserId: number) => {
    s.setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rfqQuotesUserId)) { newSet.delete(rfqQuotesUserId); } else { newSet.add(rfqQuotesUserId); }
      return newSet;
    });
  };

  const handleSelectAll = (groupedRfqQuotes: RfqQuoteType[][]) => {
    if (s.selectedRequests.size === groupedRfqQuotes.length) {
      s.setSelectedRequests(new Set());
    } else {
      s.setSelectedRequests(new Set(groupedRfqQuotes.map((group) => group[0].id)));
    }
  };

  const handleBulkHide = async (groupedRfqQuotes: RfqQuoteType[][]) => {
    if (s.selectedRequests.size === 0) {
      toast({ title: t("error") || "Error", description: t("please_select_at_least_one_request"), variant: "danger" });
      return;
    }
    try {
      const selectedIds = Array.from(s.selectedRequests);
      await Promise.all(selectedIds.map((id) => s.hideRfqRequestMutation.mutateAsync({ rfqQuotesUserId: id, isHidden: !s.showHiddenRequests })));
      s.setRfqQuotes((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
      toast({
        title: t("success") || "Success",
        description: `${s.showHiddenRequests ? "Unhidden" : "Hidden"} ${s.selectedRequests.size} request${s.selectedRequests.size > 1 ? "s" : ""} successfully`,
        variant: "success",
      });
      s.setSelectedRequests(new Set());
      s.setIsSelectMode(false);
    } catch (error) {
      toast({ title: t("error") || "Error", description: s.showHiddenRequests ? t("failed_to_unhide_requests") : t("failed_to_hide_requests"), variant: "danger" });
    }
  };

  const updateRfqMessageCount = () => {
    const index = s.rfqQuotes.findIndex((rfq: RfqQuoteType) => rfq.rfqQuotesId === s.selectedRfqQuote?.rfqQuotesId);
    if (index !== -1) {
      const rfqList = [...s.rfqQuotes];
      rfqList[index]["unreadMsgCount"] = 0;
      s.setRfqQuotes(rfqList);
    }
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => { s.setMessage((prev) => prev + emojiObject.emoji); };

  const handleCheckout = () => {
    if (!canCheckout(s.quoteProducts, s.selectedRfqQuote)) {
      toast({
        title: t("checkout_not_available") || "Checkout Not Available",
        description: t("all_prices_must_be_approved") || "All product prices must be approved before checkout",
        variant: "danger",
      });
      return;
    }
    const calculatedTotal = calculateTotalPrice(s.quoteProducts);
    const rfqQuoteData = {
      rfqQuotesUserId: s.selectedRfqQuote?.id,
      rfqQuotesId: s.selectedRfqQuote?.rfqQuotesId,
      sellerId: s.selectedRfqQuote?.sellerID,
      buyerId: s.selectedRfqQuote?.buyerID,
      totalPrice: calculatedTotal,
      quoteProducts: s.quoteProducts.map((product: any) => ({
        id: product.id, offerPrice: parseFloat(product.offerPrice || "0"),
        quantity: product.quantity || 1, priceRequestId: product.priceRequest?.id,
      })),
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rfqQuoteData", JSON.stringify(rfqQuoteData));
    }
    orderStore.setOrders({ ...orderStore.orders });
    orderStore.setTotal(calculatedTotal);
    router.push("/checkout?fromRfq=true");
  };

  const getProductSuggestions = (productId: number) =>
    getSuggestionsForRfqQuoteProduct(productId, s.selectedChatHistory, s.pendingSuggestionUpdates);

  const getTotalPrice = () => calculateTotalPrice(s.quoteProducts);

  return {
    // from messaging
    ...messaging,
    // local
    handleRfqProducts, handleProductsSelected, handleRequestPrice, handleSendUpdate,
    handleHideRequest, handleUnhideRequest, handleToggleSelect, handleSelectAll,
    handleBulkHide, updateRfqMessageCount, onEmojiClick, handleCheckout,
    getProductSuggestions, getTotalPrice,
  };
}
