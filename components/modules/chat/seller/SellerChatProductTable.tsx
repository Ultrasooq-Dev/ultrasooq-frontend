import React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useAuth } from "@/context/AuthContext";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import SellerChatSuggestedProducts from "./SellerChatSuggestedProducts";

interface SellerChatProductTableProps {
  isLoading: boolean;
  quoteProducts: any[];
  pendingPriceUpdates: Map<number, number>;
  editingPriceProductId: number | null;
  editingPriceValue: string;
  hasPendingUpdates: boolean;
  getSuggestionsForProduct: (productId: number) => any[];
  onSetEditingPriceProductId: (id: number | null) => void;
  onSetEditingPriceValue: (value: string) => void;
  onRequestPrice: (productId: number, price: number) => void;
  onSuggestProduct: (productId: number, quantity: number) => void;
  onSendUpdate: () => void;
  onCancelUpdates: () => void;
}

/**
 * The product table section inside the detail view:
 * shows requested products, inline price editing, and suggested products.
 */
const SellerChatProductTable: React.FC<SellerChatProductTableProps> = ({
  isLoading, quoteProducts, pendingPriceUpdates, editingPriceProductId, editingPriceValue,
  hasPendingUpdates, getSuggestionsForProduct, onSetEditingPriceProductId,
  onSetEditingPriceValue, onRequestPrice, onSuggestProduct, onSendUpdate, onCancelUpdates,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();
  const { langDir, currency } = useAuth();

  return (
    <div className="mb-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm flex-shrink-0 max-h-[180px] overflow-y-auto">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Table Header */}
          <div className="sticky top-0 z-10 grid grid-cols-4 gap-1 border-b border-border bg-muted px-3 py-1.5">
            {[t("component") || "Component", t("selection") || "Selection", t("price") || "Price", t("address") || "Address"].map((header) => (
              <div key={header} className="text-[11px] font-semibold text-muted-foreground" dir={langDir} translate="no">
                {header}
              </div>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2 p-4">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !quoteProducts?.length && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground" dir={langDir} translate="no">
                {t("no_data_found")}
              </p>
            </div>
          )}

          {/* Rows */}
          {quoteProducts?.map((item: any) => {
            const isSimilar = item?.productType === "SIMILAR";
            const suggestions = getSuggestionsForProduct(item.id);
            const isEditingPrice = editingPriceProductId === item.id;

            return (
              <div key={item.id} className="border-b border-border">
                <div className="grid grid-cols-4 items-center gap-2 px-3 py-2.5 bg-card">
                  {/* Product info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                      <Image src={item?.rfqProductDetails?.productImages?.[0]?.image || PlaceholderImage} alt={item?.rfqProductDetails?.productName || "Product"} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{translate(item?.rfqProductDetails?.productName || "-")}</p>
                      <p className="text-[10px] text-muted-foreground">{item?.deliveryDate || "-"}</p>
                    </div>
                  </div>

                  {/* Selection */}
                  <div className="flex justify-center">
                    {isSimilar ? (
                      <button type="button" onClick={() => onSuggestProduct(item.id, item.quantity || 1)}
                        className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90" dir={langDir} translate="no">
                        <span>+</span><span>Choose Alternative</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {item?.productType === "SAME" ? t("same_product") || "Same product" : "-"}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
                    {isEditingPrice ? (
                      <>
                        <input type="number" value={editingPriceValue} onChange={(e) => onSetEditingPriceValue(e.target.value)}
                          className="w-20 rounded border border-border px-1 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary" />
                        <div className="flex gap-1">
                          <button type="button" className="text-[9px] text-primary" onClick={() => {
                            const price = parseFloat(editingPriceValue);
                            if (!isNaN(price) && price > 0) onRequestPrice(item.id, price);
                            onSetEditingPriceProductId(null); onSetEditingPriceValue("");
                          }}>{t("save") || "Save"}</button>
                          <button type="button" className="text-[9px] text-muted-foreground" onClick={() => { onSetEditingPriceProductId(null); onSetEditingPriceValue(""); }}>
                            {t("cancel") || "Cancel"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">
                          {(() => {
                            const pendingPrice = pendingPriceUpdates.get(item.id);
                            const displayPrice = pendingPrice ?? item?.offerPrice;
                            const quantity = item?.quantity || 1;
                            if (displayPrice) return `${currency.symbol}${parseFloat(displayPrice.toString()) * quantity}`;
                            return "-";
                          })()}
                        </span>
                        <button type="button" className="text-[9px] text-primary" onClick={() => {
                          onSetEditingPriceProductId(item.id);
                          const pendingPrice = pendingPriceUpdates.get(item.id);
                          onSetEditingPriceValue(pendingPrice?.toString() || item?.offerPrice?.toString() || "");
                        }}>{t("edit") || "Edit"}</button>
                      </>
                    )}
                  </div>

                  {/* Address */}
                  <div className="text-center text-[10px] text-muted-foreground">
                    <span className="line-clamp-2">{item?.address || "-"}</span>
                  </div>
                </div>

                <SellerChatSuggestedProducts suggestions={suggestions} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Update / Cancel Buttons */}
      {quoteProducts && quoteProducts.length > 0 && (
        <div className="border-t border-border bg-muted px-3 py-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancelUpdates}
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted transition-colors" dir={langDir}>
            {t("cancel") || "Cancel"}
          </button>
          <button type="button" onClick={onSendUpdate} disabled={!hasPendingUpdates}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${hasPendingUpdates ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`} dir={langDir}>
            Send Update
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerChatProductTable;
