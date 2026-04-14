"use client";
import React from "react";
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
import { Building2 } from "lucide-react";
import { ISelectOptions } from "@/utils/types/common.types";

interface FilterSidebarProps {
  t: (key: string) => string;
  langDir: string;
  currency: { symbol: string };
  memoizedBrands: ISelectOptions[];
  selectedBrandIds: number[];
  searchTermBrand: string;
  minPriceInputRef: React.RefObject<HTMLInputElement | null>;
  maxPriceInputRef: React.RefObject<HTMLInputElement | null>;
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

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  t,
  langDir,
  currency,
  memoizedBrands,
  selectedBrandIds,
  searchTermBrand,
  minPriceInputRef,
  maxPriceInputRef,
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
    <div className="hidden flex-shrink-0 overflow-y-auto bg-card p-4 lg:block lg:w-1/4">
      <div className="sticky top-4 rounded-xl bg-card p-6 shadow-lg">
        {/* Filter Header */}
        <div className="mb-6 border-b border-border pb-4">
          <h3 className="mb-3 text-lg font-bold text-foreground">
            {t("filters")}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {t("select_all")}
            </button>
            <button
              type="button"
              onClick={onClearFilter}
              className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              {t("clean_select")}
            </button>
          </div>
        </div>

        {/* Brand Filter */}
        <div className="mb-6">
          <Accordion
            type="multiple"
            defaultValue={["brand"]}
            className="overflow-hidden rounded-lg border border-border"
          >
            <AccordionItem value="brand" className="border-0">
              <AccordionTrigger className="bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{t("by_brand")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-card px-4 py-4">
                <div className="mb-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t("search_brand")}
                      className="h-9 flex-1 border-border text-sm focus:border-primary focus:ring-primary"
                      value={searchTermBrand}
                      onChange={onBrandSearchChange}
                      dir={langDir}
                      translate="no"
                    />
                    <Button
                      type="button"
                      onClick={onBrandSearch}
                      disabled={!searchTermBrand.trim()}
                      size="sm"
                      className="h-9 bg-primary px-4 text-xs font-medium hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted-foreground"
                    >
                      {t("search")}
                    </Button>
                  </div>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {!memoizedBrands.length ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("no_data_found")}
                    </p>
                  ) : null}
                  {memoizedBrands.map((item: ISelectOptions) => (
                    <div
                      key={item.value}
                      className="flex items-center space-x-2 rounded px-2 py-1 transition-colors hover:bg-muted"
                    >
                      <Checkbox
                        id={item.label}
                        className="border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        onCheckedChange={(checked) =>
                          onBrandChange(checked, item)
                        }
                        checked={selectedBrandIds.includes(item.value)}
                      />
                      <label
                        htmlFor={item.label}
                        className="flex-1 cursor-pointer text-sm leading-none font-medium"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Price Filter */}
        <div>
          <Accordion
            type="multiple"
            defaultValue={["price"]}
            className="overflow-hidden rounded-lg border border-border"
          >
            <AccordionItem value="price" className="border-0">
              <AccordionTrigger className="bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span>{t("price")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-card px-4 py-4">
                <div className="mb-4 px-2">
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
                    onChange={(value: number | number[]) =>
                      onPriceDebounce(value)
                    }
                    max={500}
                    min={0}
                  />
                </div>
                <div className="mb-4 flex justify-center">
                  <Button
                    variant="outline"
                    className="h-9 px-4 text-sm"
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
                    className="custom-form-control-s1 rounded-lg border-border focus:border-primary focus:ring-primary"
                    onChange={onMinPriceChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    ref={minPriceInputRef}
                  />
                  <div className="center-divider"></div>
                  <Input
                    type="number"
                    placeholder={`${currency.symbol}500`}
                    className="custom-form-control-s1 rounded-lg border-border focus:border-primary focus:ring-primary"
                    onChange={onMaxPriceChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    ref={maxPriceInputRef}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
