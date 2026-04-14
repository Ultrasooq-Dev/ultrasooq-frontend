"use client";
import React from "react";
import { ISelectOptions } from "@/utils/types/common.types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import TrendingFilterPanel from "./TrendingFilterPanel";

interface TrendingMobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export default function TrendingMobileFilterSheet({
  open,
  onOpenChange,
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
}: TrendingMobileFilterSheetProps) {
  const t = useTranslations();
  const { langDir } = useAuth();
  const isRTL = langDir === "rtl";
  const filterSheetSide: "left" | "right" = isRTL ? "right" : "left";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={filterSheetSide}
        className="w-[300px] overflow-y-auto sm:w-[400px]"
      >
        <SheetHeader>
          <SheetTitle>{t("filters")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <TrendingFilterPanel
            memoizedBrands={memoizedBrands}
            selectedBrandIds={selectedBrandIds}
            searchTermBrand={searchTermBrand}
            specFilters={specFilters}
            selectedSpecFilters={selectedSpecFilters}
            isMounted={isMounted}
            onSelectAll={onSelectAll}
            onClearFilter={onClearFilter}
            onBrandSearchChange={onBrandSearchChange}
            onBrandSearch={onBrandSearch}
            onBrandChange={onBrandChange}
            onPriceDebounce={onPriceDebounce}
            onClearPrice={onClearPrice}
            onMinPriceChange={onMinPriceChange}
            onMaxPriceChange={onMaxPriceChange}
            onSpecFilterChange={onSpecFilterChange}
            onSpecRangeChange={onSpecRangeChange}
            isMobile
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
