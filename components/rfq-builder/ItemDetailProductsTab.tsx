"use client";
/**
 * ItemDetailProductsTab — Products tab body for ItemDetailPanel.
 * Renders RFQ/AI buttons, loading states, no-results messages,
 * browse-mode header, and the product list/grid with recommendations.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Tag, Zap } from "lucide-react";
import { FILTER_CHIPS, type FilterChipKey } from "./cards/FilterChipBar";
import { ProductGridCard } from "./cards/ProductGridCard";
import { ProductListCard } from "./cards/ProductListCard";
import type { MappedProduct } from "./itemDetailTypes";

interface ItemDetailProductsTabProps {
  isAr: boolean;
  locale: string;
  searchTerm?: string;
  hasActiveChips: boolean;
  isBrowseMode: boolean;
  activeChips: Set<FilterChipKey>;
  isLoading: boolean;
  realProducts: MappedProduct[] | null;
  recommendedProducts: any[];
  viewMode: "list" | "grid";
  currencySymbol: string;
  selectedProductId: number | null;
  aiUsedToday: number;
  cardCallbacks: {
    onSelectProduct: (product: any) => void;
    onSetSelectedProductId: (id: number) => void;
    onSetActiveTab: (tab: any) => void;
    onSetReqMode: (mode: any) => void;
    onSetViewingProductId: (id: number) => void;
    onOpenBuygroupDisclaimer: (priceId: number, qty: number) => void;
    getCardQty: (id: number) => number;
    setCardQty: (id: number, qty: number) => void;
    hasSeenBuygroupDisclaimer: boolean;
    currencySymbol: string;
  };
  onCreateRfq: () => void;
}

export function ItemDetailProductsTab({
  isAr,
  locale,
  searchTerm,
  hasActiveChips,
  isBrowseMode,
  activeChips,
  isLoading,
  realProducts,
  recommendedProducts,
  viewMode,
  currencySymbol,
  selectedProductId,
  aiUsedToday,
  cardCallbacks,
  onCreateRfq,
}: ItemDetailProductsTabProps) {
  const { getCardQty, setCardQty } = cardCallbacks;

  return (
    <div className="p-3 space-y-2">
      {(!!searchTerm || activeChips.has("rfq")) && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCreateRfq}
            className="flex-1 flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-start"
          >
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-primary block">
                {isAr ? "طلب أسعار" : "Create RFQ"}
              </span>
              <span className="text-[7px] text-muted-foreground">
                {isAr ? "يدوياً" : "Manual"}
              </span>
            </div>
          </button>
          <button
            type="button"
            disabled={aiUsedToday >= 50}
            className={cn(
              "flex-1 flex items-center gap-2 p-2 rounded-lg border text-start relative",
              aiUsedToday >= 50
                ? "border-border opacity-50"
                : "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50"
            )}
          >
            <Zap className="h-4 w-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-purple-700 block">
                {isAr ? "اقتراح AI" : "AI Suggest"}
              </span>
              <span className="text-[7px] text-muted-foreground">
                {50 - aiUsedToday}/50
              </span>
            </div>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-[10px] text-muted-foreground ms-2">
            {isAr ? "جاري البحث..." : "Searching..."}
          </span>
        </div>
      )}

      {!isLoading &&
        (searchTerm || hasActiveChips) &&
        (realProducts ?? []).length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
              {searchTerm
                ? isAr
                  ? `لا توجد نتائج لـ "${searchTerm}"`
                  : `No results for "${searchTerm}"`
                : isAr
                ? "لا توجد منتجات لهذا الفلتر"
                : "No products found for this filter"}
            </span>
            <span className="text-[10px] text-amber-600/70 mt-1 block">
              {searchTerm
                ? isAr
                  ? "جرب كلمات مختلفة أو أنشئ طلب أسعار مخصص"
                  : "Try different keywords or create a custom RFQ above"
                : isAr
                ? "جرب فلاتر أخرى أو ابحث عن منتج"
                : "Try other filters or search for a product"}
            </span>
          </div>
        )}

      {isBrowseMode && (realProducts ?? []).length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground font-medium px-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {isAr ? "الأكثر شعبية في" : "Trending in"}{" "}
            <span className="font-bold text-foreground">
              {Array.from(activeChips)
                .map((k) => {
                  const chip = FILTER_CHIPS.find((c) => c.key === k);
                  return chip ? (isAr ? chip.labelAr : chip.label) : k;
                })
                .join(" + ")}
            </span>
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {(realProducts ?? []).map((p) => (
            <ProductGridCard
              key={`grid-${p.id}`}
              product={p}
              locale={locale}
              selectedProductId={selectedProductId}
              cardQty={getCardQty(p.id)}
              onSetCardQty={setCardQty}
              {...cardCallbacks}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      ) : (
        (realProducts ?? []).map((p) => (
          <ProductListCard
            key={p.id}
            product={p}
            locale={locale}
            selectedProductId={selectedProductId}
            showSelection
            {...cardCallbacks}
          />
        ))
      )}

      {recommendedProducts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[9px] text-muted-foreground font-medium px-2">
              {isAr ? "منتجات مشابهة قد تهمك" : "Similar products you might like"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {recommendedProducts.map((p: any) => (
            <ProductListCard
              key={p.id}
              product={p}
              locale={locale}
              selectedProductId={selectedProductId}
              isRecommended
              showSelection
              {...cardCallbacks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
