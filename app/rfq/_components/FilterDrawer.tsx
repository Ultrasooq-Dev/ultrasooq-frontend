"use client";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ReactSlider from "react-slider";
import { ISelectOptions } from "@/utils/types/common.types";

interface FilterDrawerProps {
  t: (key: string) => string;
  langDir: string;
  currency: { symbol: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterSheetSide: "left" | "right";
  memoizedBrands: ISelectOptions[];
  selectedBrandIds: number[];
  searchTermBrand: string;
  onSelectAll: () => void;
  onClearFilter: () => void;
  onBrandSearchChange: (event: any) => void;
  onBrandSearch: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  onPriceDebounce: (value: any) => void;
  onMinPriceChange: (event: any) => void;
  onMaxPriceChange: (event: any) => void;
  onClearPrice: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  t,
  langDir,
  currency,
  open,
  onOpenChange,
  filterSheetSide,
  memoizedBrands,
  selectedBrandIds,
  searchTermBrand,
  onSelectAll,
  onClearFilter,
  onBrandSearchChange,
  onBrandSearch,
  onBrandChange,
  onPriceDebounce,
  onMinPriceChange,
  onMaxPriceChange,
  onClearPrice,
}) => {
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
                      onChange={onBrandSearchChange}
                      dir={langDir}
                      translate="no"
                    />
                    <Button
                      type="button"
                      onClick={onBrandSearch}
                      disabled={!searchTermBrand.trim()}
                      size="sm"
                      className="h-8 bg-primary px-3 text-xs hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted-foreground"
                    >
                      {t("search")}
                    </Button>
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
                      renderThumb={(
                        props: any,
                        state: { valueNow: number },
                      ) => (
                        <div {...props} key={props.key}>
                          {state.valueNow}
                        </div>
                      )}
                      pearling
                      minDistance={10}
                      onChange={(value: number | number[]) =>
                        onPriceDebounce(value)
                      }
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

export default FilterDrawer;
