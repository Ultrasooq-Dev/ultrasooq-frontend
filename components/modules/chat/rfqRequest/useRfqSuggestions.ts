import { useState } from "react";
import { selectSuggestedProducts } from "@/apis/requests/chat.requests";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/orderStore";
import { calculateTotalPrice } from "./rfqChatUtils";

interface UseRfqSuggestionsParams {
  selectedChatHistory: any[];
  selectedVendor: any;
  selectedRoom: number | null;
  onSendMessage: (
    roomId: number,
    content: string,
    rfqQuoteProductId?: number,
    buyerId?: number,
    requestedPrice?: number,
  ) => void;
  onRefreshChatHistory: () => Promise<void>;
}

export function useRfqSuggestions({
  selectedChatHistory,
  selectedVendor,
  selectedRoom,
  onSendMessage,
  onRefreshChatHistory,
}: UseRfqSuggestionsParams) {
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const orderStore = useOrderStore();

  const [selectingSuggestions, setSelectingSuggestions] = useState<Set<number>>(
    new Set(),
  );
  const [showProductSelectionModal, setShowProductSelectionModal] =
    useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<{
    rfqQuoteProductId: number;
    rfqQuotesUserId: number;
  } | null>(null);
  const [pendingProductSelections, setPendingProductSelections] = useState<
    Map<number, number[]>
  >(new Map());
  const [hasPendingSelections, setHasPendingSelections] = useState(false);

  const handleSelectSuggestedProducts = async (
    suggestionIds: number[],
    rfqQuoteProductId: number,
    rfqQuotesUserIdParam: number,
  ) => {
    if (!user?.id) return;
    const allSuggestionIds = selectedChatHistory
      .flatMap(
        (chat: any) => chat?.rfqSuggestedProducts?.map((s: any) => s.id) || [],
      )
      .filter((id: number) => id);

    setSelectingSuggestions(new Set(allSuggestionIds));
    try {
      const response = await selectSuggestedProducts({
        selectedSuggestionIds: suggestionIds,
        rfqQuoteProductId,
        rfqQuotesUserId: rfqQuotesUserIdParam,
      });

      if (response.data?.status === 200) {
        toast({
          title: t("success") || "Success",
          description:
            suggestionIds.length > 0
              ? t("products_selected_successfully") || "Products selected successfully"
              : t("products_deselected_successfully") || "Products deselected successfully",
          variant: "success",
        });
        if (selectedRoom) {
          await onRefreshChatHistory();
        }
      }
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description:
          error?.response?.data?.message ||
          t("something_went_wrong") ||
          "Something went wrong",
        variant: "danger",
      });
    } finally {
      setSelectingSuggestions(new Set());
    }
  };

  const handleOpenProductSelectionModal = (
    rfqQuoteProductId: number,
    rfqQuotesUserIdParam: number,
  ) => {
    setSelectedProductForModal({ rfqQuoteProductId, rfqQuotesUserId: rfqQuotesUserIdParam });
    setShowProductSelectionModal(true);
  };

  const handleCloseProductSelectionModal = () => {
    setShowProductSelectionModal(false);
    setSelectedProductForModal(null);
  };

  const handleProductSelectionFromModal = (suggestionIds: number[]) => {
    if (!selectedProductForModal) return;
    const { rfqQuoteProductId } = selectedProductForModal;
    setPendingProductSelections((prev) => {
      const newMap = new Map(prev);
      newMap.set(rfqQuoteProductId, suggestionIds);
      return newMap;
    });
    setHasPendingSelections(true);
    handleCloseProductSelectionModal();
  };

  const handleSendUpdateToVendor = async () => {
    if (!selectedRoom || !hasPendingSelections || !selectedVendor) return;
    try {
      for (const [rfqQuoteProductId, suggestionIds] of pendingProductSelections.entries()) {
        await handleSelectSuggestedProducts(
          suggestionIds,
          rfqQuoteProductId,
          selectedVendor.id,
        );
      }
      onSendMessage(
        selectedRoom,
        "Customer selected products from your suggestions.",
        undefined,
        selectedVendor.sellerID,
      );
      setPendingProductSelections(new Map());
      setHasPendingSelections(false);
      toast({
        title: t("success") || "Success",
        description: t("update_sent_to_vendor"),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description:
          error?.response?.data?.message ||
          t("something_went_wrong") ||
          "Something went wrong",
        variant: "danger",
      });
    }
  };

  const handleCheckout = (canCheckoutFn: () => boolean) => {
    if (!canCheckoutFn()) {
      toast({
        title: t("checkout_not_available") || "Checkout Not Available",
        description:
          t("all_prices_must_be_approved") ||
          "All product prices must be approved before checkout",
        variant: "danger",
      });
      return;
    }

    const calculatedTotal = calculateTotalPrice(selectedVendor);
    const selectedSuggestedProducts: any[] = [];

    selectedChatHistory.forEach((chat: any) => {
      if (chat?.rfqSuggestedProducts?.length > 0) {
        chat.rfqSuggestedProducts.forEach((suggestion: any) => {
          if (suggestion.isSelectedByBuyer && suggestion.suggestedProduct) {
            selectedSuggestedProducts.push({
              id: suggestion.id,
              suggestedProductId: suggestion.suggestedProductId,
              rfqQuoteProductId: suggestion.rfqQuoteProductId,
              offerPrice: parseFloat(suggestion.offerPrice || "0"),
              quantity: suggestion.quantity || 1,
              productName: suggestion.suggestedProduct?.productName || "Product",
              productImage:
                suggestion.suggestedProduct?.productImages?.[0]?.image ||
                suggestion.suggestedProduct?.product_productPrice?.[0]
                  ?.productPrice_productSellerImage?.[0]?.image,
              isSuggested: true,
            });
          }
        });
      }
    });

    const rfqQuoteData = {
      rfqQuotesUserId: selectedVendor?.id,
      rfqQuotesId: selectedVendor?.rfqQuotesId,
      sellerId: selectedVendor?.sellerID,
      buyerId: selectedVendor?.buyerID,
      totalPrice:
        calculatedTotal +
        selectedSuggestedProducts.reduce(
          (sum, p) => sum + p.offerPrice * p.quantity,
          0,
        ),
      quoteProducts:
        selectedVendor?.rfqQuotesProducts?.map((product: any) => ({
          id: product.id,
          offerPrice: parseFloat(product.offerPrice || "0"),
          quantity: product.quantity || 1,
          priceRequestId: product.priceRequest?.id,
          isSuggested: false,
        })) || [],
      suggestedProducts: selectedSuggestedProducts,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("rfqQuoteData", JSON.stringify(rfqQuoteData));
    }

    orderStore.setOrders({ ...orderStore.orders });
    orderStore.setTotal(rfqQuoteData.totalPrice);
    router.push("/checkout?fromRfq=true");
  };

  return {
    selectingSuggestions,
    showProductSelectionModal,
    selectedProductForModal,
    pendingProductSelections,
    hasPendingSelections,
    setPendingProductSelections,
    setHasPendingSelections,
    handleSelectSuggestedProducts,
    handleOpenProductSelectionModal,
    handleCloseProductSelectionModal,
    handleProductSelectionFromModal,
    handleSendUpdateToVendor,
    handleCheckout,
  };
}
