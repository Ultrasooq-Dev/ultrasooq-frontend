"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactSlider from "react-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface PriceFilterProps {
  onPriceDebounce: (value: number | number[]) => void;
  onClearPrice: () => void;
  onMinPriceChange: (e: any) => void;
  onMaxPriceChange: (e: any) => void;
  minPriceInputRef?: React.RefObject<HTMLInputElement | null>;
  maxPriceInputRef?: React.RefObject<HTMLInputElement | null>;
  isMobile?: boolean;
}

export default function PriceFilter({
  onPriceDebounce,
  onClearPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minPriceInputRef,
  maxPriceInputRef,
  isMobile = false,
}: PriceFilterProps) {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={["price"]}
        className={
          isMobile ? "" : "overflow-hidden rounded-lg border border-border"
        }
      >
        <AccordionItem value="price" className={isMobile ? "" : "border-0"}>
          <AccordionTrigger
            className={
              isMobile
                ? "text-base hover:no-underline!"
                : "bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted"
            }
          >
            {isMobile ? (
              t("price")
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <span>{t("price")}</span>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent className={isMobile ? "" : "bg-card px-4 py-4"}>
            <div className={isMobile ? "px-4" : "mb-4 px-2"}>
              <div className={isMobile ? "px-2" : ""}>
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
                  onChange={(value: number | number[]) => onPriceDebounce(value)}
                  max={500}
                  min={0}
                />
              </div>
              <div className={`flex justify-center ${isMobile ? "" : "mb-4"}`}>
                <Button
                  variant="outline"
                  className={isMobile ? "mb-4" : "h-9 px-4 text-sm"}
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
                  className={
                    isMobile
                      ? "custom-form-control-s1 rounded-none"
                      : "custom-form-control-s1 rounded-lg border-border focus:border-primary focus:ring-primary"
                  }
                  onChange={onMinPriceChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  ref={isMobile ? undefined : minPriceInputRef}
                />
                <div className="center-divider"></div>
                <Input
                  type="number"
                  placeholder={`${currency.symbol}500`}
                  className={
                    isMobile
                      ? "custom-form-control-s1 rounded-none"
                      : "custom-form-control-s1 rounded-lg border-border focus:border-primary focus:ring-primary"
                  }
                  onChange={onMaxPriceChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  ref={isMobile ? undefined : maxPriceInputRef}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
