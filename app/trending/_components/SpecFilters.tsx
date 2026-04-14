"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { SpecCheckboxFilter, SpecNumberFilter } from "./SpecFilterItems";

interface SpecFiltersProps {
  specFilters: any[];
  selectedSpecFilters: Record<string, string[]>;
  onSpecFilterChange: (key: string, value: string, checked: boolean) => void;
  onSpecRangeChange: (key: string, min: string, max: string) => void;
  isMobile?: boolean;
}

export default function SpecFilters({
  specFilters,
  selectedSpecFilters,
  onSpecFilterChange,
  onSpecRangeChange,
  isMobile = false,
}: SpecFiltersProps) {
  const t = useTranslations();

  return (
    <div className={isMobile ? "mt-4 space-y-3" : "mt-6 space-y-4"}>
      {!isMobile && (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("specifications") || "Specifications"}
        </h3>
      )}
      {isMobile && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("specifications") || "Specifications"}
        </p>
      )}
      {specFilters.map((filter: any) => {
        if (
          (filter.dataType === "SELECT" || filter.dataType === "MULTI_SELECT") &&
          filter.options?.length > 0
        ) {
          return (
            <SpecCheckboxFilter
              key={filter.key}
              filter={filter}
              selectedSpecFilters={selectedSpecFilters}
              onSpecFilterChange={onSpecFilterChange}
              isMobile={isMobile}
              values={filter.options}
            />
          );
        }
        if (
          filter.dataType === "NUMBER" &&
          filter.range &&
          (filter.range.min > 0 || filter.range.max > 0)
        ) {
          return (
            <SpecNumberFilter
              key={filter.key}
              filter={filter}
              selectedSpecFilters={selectedSpecFilters}
              onSpecRangeChange={onSpecRangeChange}
              isMobile={isMobile}
            />
          );
        }
        if (filter.dataType === "TEXT" && filter.topValues?.length > 0) {
          return (
            <SpecCheckboxFilter
              key={filter.key}
              filter={filter}
              selectedSpecFilters={selectedSpecFilters}
              onSpecFilterChange={onSpecFilterChange}
              isMobile={isMobile}
              values={filter.topValues}
            />
          );
        }
        if (filter.dataType === "BOOLEAN") {
          return (
            <SpecCheckboxFilter
              key={filter.key}
              filter={filter}
              selectedSpecFilters={selectedSpecFilters}
              onSpecFilterChange={onSpecFilterChange}
              isMobile={isMobile}
              values={["true", "false"]}
              labelMap={{ true: "Yes", false: "No" }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
