"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ISelectOptions } from "@/utils/types/common.types";
import CategoryFilter from "@/components/modules/manageProducts/CategoryFilter";
import ProductConditionsFilter from "./ProductConditionsFilter";

interface MyProductsFiltersProps {
  searchTermBrand: string;
  selectedBrandIds: number[];
  selectedCategoryIds: number[];
  memoizedBrands: ISelectOptions[];
  displayStoreProducts: boolean;
  displayBuyGroupProducts: boolean;
  displayTrialProducts: boolean;
  displayWholesaleProducts: boolean;
  displayExpiredProducts: boolean;
  displayHiddenProducts: boolean;
  displayDiscountedProducts: boolean;
  onSelectAll: () => void;
  onClearFilter: () => void;
  onBrandSearchChange: (e: any) => void;
  onBrandSearch: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  onCategoryChange: (ids: number[]) => void;
  onCategoryClear: () => void;
  setDisplayStoreProducts: (v: boolean) => void;
  setDisplayBuyGroupProducts: (v: boolean) => void;
  setDisplayTrialProducts: (v: boolean) => void;
  setDisplayWholesaleProducts: (v: boolean) => void;
  setDisplayExpiredProducts: (v: boolean) => void;
  setDisplayHiddenProducts: (v: boolean) => void;
  setDisplayDiscountedProducts: (v: boolean) => void;
}

const MyProductsFilters: React.FC<MyProductsFiltersProps> = ({
  searchTermBrand,
  selectedBrandIds,
  selectedCategoryIds,
  memoizedBrands,
  displayStoreProducts,
  displayBuyGroupProducts,
  displayTrialProducts,
  displayWholesaleProducts,
  displayExpiredProducts,
  displayHiddenProducts,
  displayDiscountedProducts,
  onSelectAll,
  onClearFilter,
  onBrandSearchChange,
  onBrandSearch,
  onBrandChange,
  onCategoryChange,
  onCategoryClear,
  setDisplayStoreProducts,
  setDisplayBuyGroupProducts,
  setDisplayTrialProducts,
  setDisplayWholesaleProducts,
  setDisplayExpiredProducts,
  setDisplayHiddenProducts,
  setDisplayDiscountedProducts,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="bg-card rounded-lg shadow-xs p-6">
      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm"
          >
            {t("select_all")}
          </button>
          <button
            type="button"
            onClick={onClearFilter}
            className="px-3 py-2 bg-muted text-muted-foreground rounded hover:bg-muted transition-colors text-sm"
          >
            {t("clean_select")}
          </button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["category_filter"]} className="mb-4">
        <AccordionItem value="category_filter">
          <AccordionTrigger className="text-base hover:no-underline!">
            {t("by_category")}
          </AccordionTrigger>
          <AccordionContent>
            <CategoryFilter
              selectedCategoryIds={selectedCategoryIds}
              onCategoryChange={onCategoryChange}
              onClear={onCategoryClear}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="multiple" defaultValue={["brand"]} className="mb-4">
        <AccordionItem value="brand">
          <AccordionTrigger className="text-base hover:no-underline!">
            {t("by_brand")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="mb-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={t("search_brand")}
                  className="flex-1 h-8 text-sm"
                  onChange={onBrandSearchChange}
                  dir={langDir}
                  translate="no"
                />
                <Button
                  type="button"
                  onClick={onBrandSearch}
                  disabled={!searchTermBrand.trim()}
                  size="sm"
                  className="h-8 px-3 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed text-xs"
                >
                  {t("search")}
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {!memoizedBrands.length ? (
                <p className="text-center text-sm text-muted-foreground">
                  {t("no_data_found")}
                </p>
              ) : null}
              {memoizedBrands.map((item: ISelectOptions) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.label}
                    className="border border-border data-[state=checked]:bg-primary!"
                    onCheckedChange={(checked) => onBrandChange(checked, item)}
                    checked={selectedBrandIds.includes(item.value)}
                  />
                  <label
                    htmlFor={item.label}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ProductConditionsFilter
        displayStoreProducts={displayStoreProducts}
        displayBuyGroupProducts={displayBuyGroupProducts}
        displayTrialProducts={displayTrialProducts}
        displayWholesaleProducts={displayWholesaleProducts}
        displayExpiredProducts={displayExpiredProducts}
        displayHiddenProducts={displayHiddenProducts}
        displayDiscountedProducts={displayDiscountedProducts}
        setDisplayStoreProducts={setDisplayStoreProducts}
        setDisplayBuyGroupProducts={setDisplayBuyGroupProducts}
        setDisplayTrialProducts={setDisplayTrialProducts}
        setDisplayWholesaleProducts={setDisplayWholesaleProducts}
        setDisplayExpiredProducts={setDisplayExpiredProducts}
        setDisplayHiddenProducts={setDisplayHiddenProducts}
        setDisplayDiscountedProducts={setDisplayDiscountedProducts}
      />
    </div>
  );
};

export default MyProductsFilters;
