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

interface ExistingProductsFiltersProps {
  searchTermBrand: string;
  existingProductsSelectedBrandIds: number[];
  existingProductsSelectedCategoryIds: number[];
  existingProductsSelectedType: string;
  memoizedExistingProductsBrands: ISelectOptions[];
  existingProductsBrandsQuery: any;
  categoriesQuery: any;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBrandSearchChange: (e: any) => void;
  onBrandSearch: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  onCategoryChange: (ids: number[]) => void;
  onCategoryClear: () => void;
  setExistingProductsSelectedType: (type: string) => void;
}

const ExistingProductsFilters: React.FC<ExistingProductsFiltersProps> = ({
  searchTermBrand,
  existingProductsSelectedBrandIds,
  existingProductsSelectedCategoryIds,
  existingProductsSelectedType,
  memoizedExistingProductsBrands,
  existingProductsBrandsQuery,
  categoriesQuery,
  onSelectAll,
  onClearAll,
  onBrandSearchChange,
  onBrandSearch,
  onBrandChange,
  onCategoryChange,
  onCategoryClear,
  setExistingProductsSelectedType,
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
            onClick={onClearAll}
            className="px-3 py-2 bg-muted text-muted-foreground rounded hover:bg-muted transition-colors text-sm"
          >
            {t("clean_select")}
          </button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["category"]} className="mb-4">
        <AccordionItem value="category">
          <AccordionTrigger className="text-base hover:no-underline!">
            {t("by_category")}
          </AccordionTrigger>
          <AccordionContent>
            <CategoryFilter
              selectedCategoryIds={existingProductsSelectedCategoryIds}
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
              {!memoizedExistingProductsBrands.length ? (
                <p className="text-center text-sm text-muted-foreground">
                  {t("no_data_found")}
                </p>
              ) : null}
              {memoizedExistingProductsBrands.map((item: ISelectOptions) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`existing-${item.label}`}
                    className="border border-border data-[state=checked]:bg-primary!"
                    onCheckedChange={(checked) => onBrandChange(checked, item)}
                    checked={existingProductsSelectedBrandIds.includes(item.value)}
                  />
                  <label
                    htmlFor={`existing-${item.label}`}
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

      <Accordion type="multiple" defaultValue={["type"]} className="mb-4">
        <AccordionItem value="type">
          <AccordionTrigger className="text-base hover:no-underline!">
            {t("by_product_type")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="existing-type-p"
                  className="border border-border data-[state=checked]:bg-primary!"
                  onCheckedChange={(checked) => {
                    setExistingProductsSelectedType(checked ? "P" : "");
                  }}
                  checked={existingProductsSelectedType === "P"}
                />
                <label htmlFor="existing-type-p" className="text-sm font-medium leading-none cursor-pointer">
                  {t("regular_products")}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="existing-type-r"
                  className="border border-border data-[state=checked]:bg-primary!"
                  onCheckedChange={(checked) => {
                    setExistingProductsSelectedType(checked ? "R" : "");
                  }}
                  checked={existingProductsSelectedType === "R"}
                />
                <label htmlFor="existing-type-r" className="text-sm font-medium leading-none cursor-pointer">
                  {t("rfq_products")}
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ExistingProductsFilters;
