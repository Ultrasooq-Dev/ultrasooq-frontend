"use client";
import React from "react";
import { ISelectOptions } from "@/utils/types/common.types";
import { useTranslations } from "next-intl";
import BrandFilter from "./BrandFilter";
import PriceFilter from "./PriceFilter";
import SpecFilters from "./SpecFilters";

export interface TrendingFilterPanelProps {
  memoizedBrands: ISelectOptions[];
  selectedBrandIds: number[];
  searchTermBrand: string;
  specFilters: any[];
  selectedSpecFilters: Record<string, string[]>;
  isMounted: boolean;
  onSelectAll: () => void;
  onClearFilter: () => void;
  onBrandSearchChange: (e: any) => void;
  onBrandSearch: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  onPriceDebounce: (value: number | number[]) => void;
  onClearPrice: () => void;
  onMinPriceChange: (e: any) => void;
  onMaxPriceChange: (e: any) => void;
  onSpecFilterChange: (key: string, value: string, checked: boolean) => void;
  onSpecRangeChange: (key: string, min: string, max: string) => void;
  minPriceInputRef?: React.RefObject<HTMLInputElement | null>;
  maxPriceInputRef?: React.RefObject<HTMLInputElement | null>;
  isMobile?: boolean;
}

export default function TrendingFilterPanel({
  memoizedBrands,
  selectedBrandIds,
  searchTermBrand,
  specFilters,
  selectedSpecFilters,
  isMounted,
  onSelectAll,
  onClearFilter,
  onBrandSearchChange,
  onBrandSearch,
  onBrandChange,
  onPriceDebounce,
  onClearPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onSpecFilterChange,
  onSpecRangeChange,
  minPriceInputRef,
  maxPriceInputRef,
  isMobile = false,
}: TrendingFilterPanelProps) {
  const t = useTranslations();

  return (
    <>
      {/* Filter Header */}
      <div className={isMobile ? "mb-4" : "mb-6 border-b border-border pb-4"}>
        {!isMobile && (
          <h3 className="mb-3 text-lg font-bold text-foreground">
            {t("filters")}
          </h3>
        )}
        <div className={`flex gap-2 ${isMobile ? "mb-4" : ""}`}>
          <button
            type="button"
            onClick={onSelectAll}
            className={
              isMobile
                ? "rounded bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
                : "flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            }
          >
            {t("select_all")}
          </button>
          <button
            type="button"
            onClick={onClearFilter}
            className={
              isMobile
                ? "rounded bg-muted px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                : "flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            }
          >
            {t("clean_select")}
          </button>
        </div>
      </div>

      <BrandFilter
        memoizedBrands={memoizedBrands}
        selectedBrandIds={selectedBrandIds}
        searchTermBrand={searchTermBrand}
        onBrandSearchChange={onBrandSearchChange}
        onBrandSearch={onBrandSearch}
        onBrandChange={onBrandChange}
        isMobile={isMobile}
      />

      <PriceFilter
        onPriceDebounce={onPriceDebounce}
        onClearPrice={onClearPrice}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        minPriceInputRef={minPriceInputRef}
        maxPriceInputRef={maxPriceInputRef}
        isMobile={isMobile}
      />

      {isMounted && specFilters.length > 0 && (
        <SpecFilters
          specFilters={specFilters}
          selectedSpecFilters={selectedSpecFilters}
          onSpecFilterChange={onSpecFilterChange}
          onSpecRangeChange={onSpecRangeChange}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
