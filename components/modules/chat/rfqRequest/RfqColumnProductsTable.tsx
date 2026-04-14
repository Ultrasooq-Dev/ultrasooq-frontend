import React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { getSuggestionsForRfqQuoteProduct } from "./rfqChatUtils";
import RfqSuggestedProductRow from "./RfqSuggestedProductRow";

interface RfqColumnProductsTableProps {
  selectedVendor: any;
  rfqQuoteDetailsById: any;
  isLoading: boolean;
  selectedChatHistory: any[];
  pendingProductSelections: Map<number, number[]>;
  selectingSuggestions: Set<number>;
  hasPendingSelections: boolean;
  onOpenSelectionModal: (rfqQuoteProductId: number, rfqQuotesUserId: number) => void;
  onCancelPending: () => void;
  onSendUpdate: () => void;
}

const RfqColumnProductsTable: React.FC<RfqColumnProductsTableProps> = ({
  selectedVendor,
  rfqQuoteDetailsById,
  isLoading,
  selectedChatHistory,
  pendingProductSelections,
  hasPendingSelections,
  onOpenSelectionModal,
  onCancelPending,
  onSendUpdate,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();

  if (!selectedVendor?.rfqQuotesProducts?.length) return null;

  const headers = [
    t("component") || "Component",
    t("selection") || "Selection",
    t("price") || "Price",
    t("address") || "Address",
  ];

  return (
    <>
      <div className="flex-shrink-0 overflow-hidden rounded border border-border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-1 border-b border-border bg-muted px-3 py-1.5">
          {headers.map((header, i) => (
            <div
              key={i}
              className={`text-[11px] font-semibold text-muted-foreground ${i > 0 ? "text-center" : ""}`}
              dir={langDir}
              translate="no"
            >
              {header}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[220px]">
          <div className="min-w-[700px]">
            {isLoading ? (
              <div className="space-y-1 p-2">
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : (
              selectedVendor?.rfqQuotesProducts?.map((item: any) => {
                const suggestions = getSuggestionsForRfqQuoteProduct(
                  item.id,
                  selectedChatHistory,
                  pendingProductSelections,
                );
                const selectedSuggestions = suggestions.filter(
                  (s: any) => s.isSelectedByBuyer,
                );
                const hasSuggestions = suggestions.length > 0;
                const totalPrice = item?.offerPrice
                  ? parseFloat(item.offerPrice.toString()) * (item?.quantity || 1)
                  : null;

                return (
                  <div key={item.id} className="border-b border-border">
                    {/* Main product row */}
                    <div className="grid grid-cols-4 items-center gap-2 px-3 py-2.5 bg-card">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                          <Image
                            src={item?.rfqProductDetails?.productImages?.[0]?.image || PlaceholderImage}
                            alt={item?.rfqProductDetails?.productName || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {translate(item?.rfqProductDetails?.productName || "-")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {item?.deliveryDate || rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress?.rfqDate || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        {!hasSuggestions ? (
                          <span className="text-[10px] text-muted-foreground">
                            {item?.productType === "SIMILAR"
                              ? t("similar_product") || "Similar product"
                              : t("same_product") || "Same product"}
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenSelectionModal(item.id, selectedVendor?.id || 0)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white text-[10px] font-medium hover:bg-primary/90 transition-colors"
                            translate="no"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t("choose") || "Choose"}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
                        <span className="font-bold">
                          {totalPrice ? `${currency.symbol}${totalPrice}` : "-"}
                        </span>
                      </div>

                      <div className="text-center text-[10px] text-muted-foreground">
                        <span className="line-clamp-2">
                          {item?.address || rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress?.address || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Selected suggested products */}
                    {selectedSuggestions.length > 0 && (
                      <div className="border-t border-border bg-muted px-3 py-2">
                        {selectedSuggestions.map((s: any) => (
                          <RfqSuggestedProductRow key={s.id} suggestion={s} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {hasPendingSelections && (
        <div className="border-t border-border bg-muted px-3 py-2 flex items-center justify-end gap-2">
          <button
            onClick={onCancelPending}
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted transition-colors"
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            onClick={onSendUpdate}
            className="px-4 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
          >
            {"Send Update"}
          </button>
        </div>
      )}
    </>
  );
};

export default RfqColumnProductsTable;
