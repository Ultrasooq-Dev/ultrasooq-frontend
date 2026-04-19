"use client";
/**
 * ItemDetailBrowseView — shown when no item is selected.
 * Renders either a browse grid/list (chips active) or an empty-state prompt.
 */
import React from "react";
import { MessageSquare, Tag } from "lucide-react";
import {
  FilterChipBar,
  SortViewBar,
  AdvancedFilterPanel,
  FILTER_CHIPS,
  type FilterChipKey,
} from "./cards/FilterChipBar";
import { ProductGridCard } from "./cards/ProductGridCard";
import { ProductListCard } from "./cards/ProductListCard";
import type { MappedProduct } from "./itemDetailTypes";

interface ItemDetailBrowseViewProps {
  locale: string;
  isAr: boolean;
  activeChips: Set<FilterChipKey>;
  toggleChip: (key: FilterChipKey) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
  minRating: number;
  setMinRating: (v: number) => void;
  stockOnly: boolean;
  setStockOnly: (v: boolean) => void;
  discountOnly: boolean;
  setDiscountOnly: (v: boolean) => void;
  filterValues: Record<string, any>;
  setFilterValue: (key: string, value: any) => void;
  toggleMultiSelect: (key: string, option: string) => void;
  isLoading: boolean;
  realProducts: MappedProduct[] | null;
  currencySymbol: string;
  selectedProductId: number | null;
  getCardQty: (id: number) => number;
  setCardQty: (id: number, qty: number) => void;
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
}

export function ItemDetailBrowseView({
  locale,
  isAr,
  activeChips,
  toggleChip,
  filtersOpen,
  setFiltersOpen,
  activeFilterCount,
  clearAllFilters,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  minRating,
  setMinRating,
  stockOnly,
  setStockOnly,
  discountOnly,
  setDiscountOnly,
  filterValues,
  setFilterValue,
  toggleMultiSelect,
  isLoading,
  realProducts,
  currencySymbol,
  selectedProductId,
  getCardQty,
  setCardQty,
  cardCallbacks,
}: ItemDetailBrowseViewProps) {
  const hasActiveChips = activeChips.size > 0;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
      <FilterChipBar
        locale={locale}
        activeChips={activeChips}
        toggleChip={toggleChip}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount}
        clearAllFilters={clearAllFilters}
      />

      {hasActiveChips ? (
        <>
          <div className="border-b border-border shrink-0">
            <SortViewBar
              locale={locale}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeChips={activeChips}
            />
          </div>

          {filtersOpen && (
            <div className="border-b border-border shrink-0">
              <AdvancedFilterPanel
                locale={locale}
                filtersOpen={filtersOpen}
                minRating={minRating}
                setMinRating={setMinRating}
                stockOnly={stockOnly}
                setStockOnly={setStockOnly}
                discountOnly={discountOnly}
                setDiscountOnly={setDiscountOnly}
                filterValues={filterValues}
                setFilterValue={setFilterValue}
                toggleMultiSelect={toggleMultiSelect}
                showCategoryFilters={false}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <span className="text-[10px] text-muted-foreground ms-2">
                    {isAr ? "جاري التحميل..." : "Loading..."}
                  </span>
                </div>
              )}

              {!isLoading && (realProducts ?? []).length > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium px-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {isAr ? "الأكثر شعبية في" : "Trending in"}{" "}
                    <span className="font-bold text-foreground">
                      {Array.from(activeChips)
                        .map((k) => {
                          const chip = FILTER_CHIPS.find((c) => c.key === k);
                          return chip
                            ? isAr
                              ? chip.labelAr
                              : chip.label
                            : k;
                        })
                        .join(" + ")}
                    </span>
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {!isLoading && (realProducts ?? []).length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-center">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                    {isAr
                      ? "لا توجد منتجات لهذا الفلتر"
                      : "No products found for this filter"}
                  </span>
                  <span className="text-[10px] text-amber-600/70 mt-1 block">
                    {isAr
                      ? "جرب فلاتر أخرى أو ابحث عن منتج"
                      : "Try other filters or search for a product"}
                  </span>
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
                    {...cardCallbacks}
                  />
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <MessageSquare className="h-12 w-12 mb-3 opacity-15" />
          <h3 className="text-sm font-semibold mb-1">
            {isAr ? "تفاصيل العنصر" : "Item Details"}
          </h3>
          <p className="text-xs text-center max-w-[200px] opacity-60">
            {isAr
              ? "اختر فلتر أعلاه أو ابحث عن منتج"
              : "Select a filter above or search for a product"}
          </p>
        </div>
      )}
    </div>
  );
}
