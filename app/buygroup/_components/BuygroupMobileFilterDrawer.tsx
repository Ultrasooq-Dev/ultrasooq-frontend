"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ISelectOptions } from "@/utils/types/common.types";
import ReactSlider from "react-slider";
import CategoryFilter from "@/components/modules/manageProducts/CategoryFilter";

interface BuygroupMobileFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "left" | "right";
  langDir: string;
  currency: { symbol: string };
  memoizedBrands: ISelectOptions[];
  selectedBrandIds: number[];
  categoryIds: string;
  onSelectAll: () => void;
  onClearFilter: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  onBrandSearch: (event: any) => void;
  onCategoryChange: (categoryIds: number[]) => void;
  onCategoryClear: () => void;
  onPriceSliderChange: (value: number | number[]) => void;
  onMinPriceChange: (event: any) => void;
  onMaxPriceChange: (event: any) => void;
  onClearPrice: () => void;
}

const BuygroupMobileFilterDrawer: React.FC<BuygroupMobileFilterDrawerProps> = ({
  open,
  onOpenChange,
  side,
  langDir,
  currency,
  memoizedBrands,
  selectedBrandIds,
  categoryIds,
  onSelectAll,
  onClearFilter,
  onBrandChange,
  onBrandSearch,
  onCategoryChange,
  onCategoryClear,
  onPriceSliderChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClearPrice,
}) => {
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className="w-[300px] overflow-y-auto sm:w-[400px]"
      >
        <SheetHeader>
          <SheetTitle>{t("filters")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <div className="mb-4">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                className="rounded bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
              >
                {t("select_all")}
              </button>
              <button
                type="button"
                onClick={onClearFilter}
                className="rounded bg-muted px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {t("clean_select")}
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <Accordion
            type="multiple"
            defaultValue={["category_filter"]}
            className="mb-4"
          >
            <AccordionItem value="category_filter">
              <AccordionTrigger className="text-base hover:no-underline!">
                {t("by_category")}
              </AccordionTrigger>
              <AccordionContent>
                <CategoryFilter
                  selectedCategoryIds={
                    categoryIds ? categoryIds.split(",").map(Number) : []
                  }
                  onCategoryChange={onCategoryChange}
                  onClear={onCategoryClear}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Brand Filter */}
          <Accordion
            type="multiple"
            defaultValue={["brand"]}
            className="mb-4"
          >
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
                      className="h-8 flex-1 text-sm"
                      onChange={onBrandSearch}
                      dir={langDir}
                      translate="no"
                    />
                  </div>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {!memoizedBrands.length ? (
                    <p className="text-center text-sm text-muted-foreground">
                      {t("no_data_found")}
                    </p>
                  ) : null}
                  {memoizedBrands.map((item: ISelectOptions) => (
                    <div
                      key={item.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`mobile-${item.label}`}
                        className="border border-border data-[state=checked]:bg-primary!"
                        onCheckedChange={(checked) =>
                          onBrandChange(checked, item)
                        }
                        checked={selectedBrandIds.includes(item.value)}
                      />
                      <label
                        htmlFor={`mobile-${item.label}`}
                        className="cursor-pointer text-sm leading-none font-medium"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Price Filter */}
          <Accordion type="multiple" defaultValue={["price"]}>
            <AccordionItem value="price">
              <AccordionTrigger className="text-base hover:no-underline!">
                {t("price")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4">
                  <div className="px-2">
                    <ReactSlider
                      className="horizontal-slider"
                      thumbClassName="example-thumb"
                      trackClassName="example-track"
                      defaultValue={[0, 500]}
                      ariaLabel={["Lower thumb", "Upper thumb"]}
                      ariaValuetext={(state: { valueNow: number }) =>
                        `Thumb value ${state.valueNow}`
                      }
                      renderThumb={(props: any, state: { valueNow: number }) => (
                        <div {...props} key={props.key}>
                          {state.valueNow}
                        </div>
                      )}
                      pearling
                      minDistance={10}
                      onChange={onPriceSliderChange}
                      max={500}
                      min={0}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="mb-4"
                      onClick={onClearPrice}
                      dir={langDir}
                      translate="no"
                    >
                      {t("clear")}
                    </Button>
                  </div>
                  <div className="range-price-left-right-info">
                    <Input
                      type="number"
                      placeholder={`${currency.symbol}0`}
                      className="custom-form-control-s1 rounded-none"
                      onChange={onMinPriceChange}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <div className="center-divider"></div>
                    <Input
                      type="number"
                      placeholder={`${currency.symbol}500`}
                      className="custom-form-control-s1 rounded-none"
                      onChange={onMaxPriceChange}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BuygroupMobileFilterDrawer;
