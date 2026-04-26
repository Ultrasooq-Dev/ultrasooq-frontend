"use client";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ISelectOptions } from "@/utils/types/common.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Building2 } from "lucide-react";

interface BrandFilterProps {
  memoizedBrands: ISelectOptions[];
  selectedBrandIds: number[];
  searchTermBrand: string;
  onBrandSearchChange: (e: any) => void;
  onBrandSearch: () => void;
  onBrandChange: (checked: boolean | string, item: ISelectOptions) => void;
  isMobile?: boolean;
}

export default function BrandFilter({
  memoizedBrands,
  selectedBrandIds,
  searchTermBrand,
  onBrandSearchChange,
  onBrandSearch,
  onBrandChange,
  isMobile = false,
}: BrandFilterProps) {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="mb-6">
      <Accordion
        type="multiple"
        defaultValue={["brand"]}
        className={
          isMobile ? "mb-4" : "overflow-hidden rounded-lg border border-border"
        }
      >
        <AccordionItem value="brand" className={isMobile ? "" : "border-0"}>
          <AccordionTrigger
            className={
              isMobile
                ? "text-base hover:no-underline!"
                : "bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted"
            }
          >
            {isMobile ? (
              t("by_brand")
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{t("by_brand")}</span>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent className={isMobile ? "" : "bg-card px-4 py-4"}>
            <div className="mb-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={t("search_brand")}
                  className={
                    isMobile
                      ? "h-8 flex-1 text-sm"
                      : "h-9 flex-1 border-border text-sm focus:border-primary focus:ring-primary"
                  }
                  onChange={onBrandSearchChange}
                  dir={langDir}
                  translate="no"
                />
                <Button
                  type="button"
                  onClick={onBrandSearch}
                  disabled={!searchTermBrand.trim()}
                  size="sm"
                  className={
                    isMobile
                      ? "h-8 bg-primary px-3 text-xs hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted-foreground"
                      : "h-9 bg-primary px-4 text-xs font-medium hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted-foreground"
                  }
                >
                  {t("search")}
                </Button>
              </div>
            </div>
            <div
              className={`space-y-2 overflow-y-auto pe-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 ${isMobile ? "max-h-40" : "max-h-48"}`}
              style={{ scrollbarWidth: "thin" }}
            >
              {!memoizedBrands.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("no_data_found")}
                </p>
              ) : null}
              {memoizedBrands.map((item: ISelectOptions) => (
                <div
                  key={item.value}
                  className={
                    isMobile
                      ? "flex items-center space-x-2"
                      : "flex items-center space-x-2 rounded px-2 py-1 transition-colors hover:bg-muted"
                  }
                >
                  <Checkbox
                    id={isMobile ? `mobile-${item.label}` : item.label}
                    className={
                      isMobile
                        ? "border border-border data-[state=checked]:bg-primary!"
                        : "border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    }
                    onCheckedChange={(checked) => onBrandChange(checked, item)}
                    checked={selectedBrandIds.includes(item.value)}
                  />
                  <label
                    htmlFor={isMobile ? `mobile-${item.label}` : item.label}
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
  );
}
