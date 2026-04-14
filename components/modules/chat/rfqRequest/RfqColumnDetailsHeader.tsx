import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { calculateColumnTotalPrice } from "./rfqChatUtils";

interface RfqColumnDetailsHeaderProps {
  selectedVendor: any;
  selectedChatHistory: any[];
  pendingProductSelections: Map<number, number[]>;
  onCheckout: () => void;
  canCheckout: boolean;
}

const RfqColumnDetailsHeader: React.FC<RfqColumnDetailsHeaderProps> = ({
  selectedVendor,
  selectedChatHistory,
  pendingProductSelections,
  onCheckout,
  canCheckout,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  const { totalPrice, hasApprovedPrices } = calculateColumnTotalPrice(
    selectedVendor,
    selectedChatHistory,
    pendingProductSelections,
  );

  const selectedSuggestedTotal = (() => {
    const allSuggestions = selectedChatHistory
      .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
      .filter((s: any) => (s.quantity ?? 0) > 0);
    const selectedByProduct = new Map<number, Set<number>>();
    allSuggestions.forEach((s: any) => {
      if (s.isSelectedByBuyer && s.rfqQuoteProductId) {
        if (!selectedByProduct.has(s.rfqQuoteProductId))
          selectedByProduct.set(s.rfqQuoteProductId, new Set());
        selectedByProduct.get(s.rfqQuoteProductId)!.add(s.id);
      }
    });
    pendingProductSelections.forEach((pendingIds, productId) => {
      if (!selectedByProduct.has(productId))
        selectedByProduct.set(productId, new Set());
      pendingIds.forEach((id) => selectedByProduct.get(productId)!.add(id));
    });
    return allSuggestions.reduce((total: number, suggestion: any) => {
      const ids = selectedByProduct.get(suggestion.rfqQuoteProductId);
      if (ids && ids.has(suggestion.id)) {
        return total + parseFloat(suggestion.offerPrice || "0") * (suggestion.quantity || 1);
      }
      return total;
    }, 0);
  })();

  const showCheckout = (() => {
    if (
      !selectedVendor?.rfqQuotesProducts ||
      selectedVendor.rfqQuotesProducts.length === 0
    ) {
      return !!selectedVendor?.offerPrice;
    }
    const approved = selectedVendor.rfqQuotesProducts.some(
      (p: any) => p?.priceRequest && p?.priceRequest?.status === "APPROVED",
    );
    return approved || !!selectedVendor?.offerPrice;
  })();

  const priceDisplay = (() => {
    if (hasApprovedPrices && totalPrice > 0) {
      return `${currency.symbol}${totalPrice}`;
    }
    if (selectedSuggestedTotal > 0) {
      return `${currency.symbol}${totalPrice}`;
    }
    if (selectedVendor?.offerPrice) {
      return `${currency.symbol}${selectedVendor?.offerPrice}`;
    }
    return "-";
  })();

  const vendorName =
    selectedVendor?.sellerIDDetail?.accountName ||
    `${selectedVendor?.sellerIDDetail?.firstName || ""} ${selectedVendor?.sellerIDDetail?.lastName || ""}`.trim() ||
    selectedVendor?.sellerIDDetail?.email ||
    `Vendor ${selectedVendor?.sellerID}`;

  return (
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
            <h3 className="text-sm font-bold text-foreground">{vendorName}</h3>
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
                {priceDisplay}
              </span>
            </div>
          </div>

          {showCheckout && (
            <button
              onClick={onCheckout}
              disabled={!canCheckout}
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
  );
};

export default RfqColumnDetailsHeader;
