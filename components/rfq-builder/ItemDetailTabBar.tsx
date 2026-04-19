"use client";
/**
 * ItemDetailTabBar — the three-tab selector row (Products / Buy / Specs)
 * plus the SortViewBar + AdvancedFilterPanel shown below tabs in ItemDetailPanel.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import {
  SortViewBar, AdvancedFilterPanel, type FilterChipKey,
} from "./cards/FilterChipBar";

interface ItemDetailTabBarProps {
  isAr: boolean;
  locale: string;
  activeTab: "products" | "customize" | "buynow";
  setActiveTab: (tab: "products" | "customize" | "buynow") => void;
  selectedProductId: number | null;
  productCount: number;
  // Sort/filter props
  sortBy: string;
  setSortBy: (v: string) => void;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
  activeChips: Set<FilterChipKey>;
  filtersOpen: boolean;
  minRating: number;
  setMinRating: (v: number) => void;
  stockOnly: boolean;
  setStockOnly: (v: boolean) => void;
  discountOnly: boolean;
  setDiscountOnly: (v: boolean) => void;
  filterValues: Record<string, any>;
  setFilterValue: (key: string, value: any) => void;
  toggleMultiSelect: (key: string, option: string) => void;
}

export function ItemDetailTabBar({
  isAr,
  locale,
  activeTab,
  setActiveTab,
  selectedProductId,
  productCount,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  activeChips,
  filtersOpen,
  minRating,
  setMinRating,
  stockOnly,
  setStockOnly,
  discountOnly,
  setDiscountOnly,
  filterValues,
  setFilterValue,
  toggleMultiSelect,
}: ItemDetailTabBarProps) {
  return (
    <>
      <div className="flex border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {isAr ? "المنتجات" : "Products"}{" "}
          {productCount > 0 ? `(${productCount})` : ""}
        </button>
        <button
          type="button"
          onClick={() => { if (selectedProductId) setActiveTab("buynow"); }}
          disabled={!selectedProductId}
          className={cn(
            "flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "buynow"
              ? "border-green-600 text-green-600"
              : selectedProductId
              ? "border-transparent text-muted-foreground hover:text-foreground"
              : "border-transparent text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <span className="flex items-center justify-center gap-1">
            <ShoppingCart className="h-3 w-3" />{" "}
            {isAr ? "شراء / تخصيص" : "Buy / Customize"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { if (selectedProductId) setActiveTab("customize"); }}
          disabled={!selectedProductId}
          className={cn(
            "flex-1 py-2 text-xs font-medium border-b-2 transition-colors truncate",
            activeTab === "customize"
              ? "border-primary text-primary"
              : selectedProductId
              ? "border-transparent text-muted-foreground hover:text-foreground"
              : "border-transparent text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          {isAr ? "المواصفات" : "Specs & Req."}
        </button>
      </div>

      {(activeTab === "products" || activeTab === "buynow") && (
        <div className="border-b border-border shrink-0">
          <SortViewBar
            locale={locale}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeChips={activeChips}
            includeDeliverySort
          />
          {filtersOpen && (
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
              showCategoryFilters
            />
          )}
        </div>
      )}
    </>
  );
}
