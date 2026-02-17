"use client";

/**
 * @component FilterSidebar
 * @description Product filter sidebar with dynamic spec-based filters.
 *   Renders filterable specs as collapsible accordion groups.
 *   Supports checkbox, range slider, and text filters.
 * @props filters - filterable specs from GET /specification/filters/:categoryId
 * @props activeFilters - currently active filter values
 * @props onFilterChange - callback when filter changes
 * @props onClearAll - callback to clear all filters
 * @props priceRange - optional price range filter
 * @uses shadcn/Accordion, shadcn/Checkbox, shadcn/Slider, shadcn/Badge, shadcn/Button
 */
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, SlidersHorizontal } from "lucide-react";

export interface FilterSpec {
  key: string;
  name: string;
  dataType: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  unit?: string | null;
  groupName?: string | null;
  range?: { min: number; max: number };
  options?: string[];
  topValues?: string[];
  counts?: Record<string, number>;
  count?: number;
}

export interface ActiveFilters {
  [key: string]: string | string[] | { min: number; max: number };
}

interface FilterSidebarProps {
  filters: FilterSpec[];
  activeFilters: ActiveFilters;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  priceRange?: { min: number; max: number };
  activePriceRange?: { min: number; max: number };
  onPriceChange?: (range: { min: number; max: number }) => void;
  loading?: boolean;
}

export function FilterSidebar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  priceRange,
  activePriceRange,
  onPriceChange,
  loading = false,
}: FilterSidebarProps) {
  const activeCount = Object.keys(activeFilters).length + (activePriceRange ? 1 : 0);

  const renderFilterContent = (filter: FilterSpec) => {
    switch (filter.dataType) {
      case "NUMBER": {
        if (!filter.range) return null;
        const current = activeFilters[filter.key] as { min: number; max: number } | undefined;
        const min = current?.min ?? filter.range.min;
        const max = current?.max ?? filter.range.max;
        return (
          <div className="space-y-3 px-1">
            <Slider
              min={filter.range.min}
              max={filter.range.max}
              step={(filter.range.max - filter.range.min) / 100 || 1}
              value={[min, max]}
              onValueChange={([newMin, newMax]) => {
                onFilterChange(filter.key, { min: newMin, max: newMax });
              }}
              className="mt-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{min}{filter.unit ? ` ${filter.unit}` : ""}</span>
              <span>{max}{filter.unit ? ` ${filter.unit}` : ""}</span>
            </div>
          </div>
        );
      }

      case "SELECT":
      case "MULTI_SELECT":
      case "TEXT": {
        const options = filter.options || filter.topValues || [];
        const selected = Array.isArray(activeFilters[filter.key])
          ? (activeFilters[filter.key] as string[])
          : activeFilters[filter.key]
            ? [activeFilters[filter.key] as string]
            : [];

        return (
          <ScrollArea className={options.length > 6 ? "h-[180px]" : ""}>
            <div className="space-y-1">
              {options.map((opt) => {
                const isChecked = selected.includes(opt);
                const count = filter.counts?.[opt];
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm cursor-pointer py-1 px-1 rounded hover:bg-accent"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newSelected = checked
                          ? [...selected, opt]
                          : selected.filter((v) => v !== opt);
                        onFilterChange(filter.key, newSelected.length > 0 ? newSelected : undefined);
                      }}
                    />
                    <span className="flex-1 truncate">{opt}</span>
                    {count !== undefined && (
                      <span className="text-xs text-muted-foreground">({count})</span>
                    )}
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        );
      }

      case "BOOLEAN": {
        const current = activeFilters[filter.key] as string | undefined;
        return (
          <div className="space-y-1">
            {["true", "false"].map((val) => {
              const label = val === "true" ? "Yes" : "No";
              const count = filter.counts?.[val];
              return (
                <label
                  key={val}
                  className="flex items-center gap-2 text-sm cursor-pointer py-1 px-1 rounded hover:bg-accent"
                >
                  <Checkbox
                    checked={current === val}
                    onCheckedChange={(checked) => {
                      onFilterChange(filter.key, checked ? val : undefined);
                    }}
                  />
                  <span className="flex-1">{label}</span>
                  {count !== undefined && (
                    <span className="text-xs text-muted-foreground">({count})</span>
                  )}
                </label>
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-24" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Filters</h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 px-2"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key);
            const displayValue = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "object" && value !== null
                ? `${(value as any).min}-${(value as any).max}`
                : String(value);
            return (
              <Badge
                key={key}
                variant="outline"
                className="text-xs gap-1 px-2 py-0.5"
              >
                {filter?.name || key}: {displayValue}
                <button
                  onClick={() => onFilterChange(key, undefined)}
                  className="ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Price Range Filter */}
      {priceRange && onPriceChange && (
        <div className="mb-3 pb-3 border-b">
          <div className="text-sm font-medium mb-2">Price Range</div>
          <Slider
            min={priceRange.min}
            max={priceRange.max}
            step={1}
            value={[
              activePriceRange?.min ?? priceRange.min,
              activePriceRange?.max ?? priceRange.max,
            ]}
            onValueChange={([min, max]) => onPriceChange({ min, max })}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>${activePriceRange?.min ?? priceRange.min}</span>
            <span>${activePriceRange?.max ?? priceRange.max}</span>
          </div>
        </div>
      )}

      {/* Spec Filters */}
      <Accordion type="multiple" defaultValue={filters.slice(0, 5).map((f) => f.key)}>
        {filters.map((filter) => (
          <AccordionItem key={filter.key} value={filter.key}>
            <AccordionTrigger className="text-sm py-2">
              {filter.name}
              {filter.unit && (
                <span className="text-xs text-muted-foreground ml-1">({filter.unit})</span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {renderFilterContent(filter)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
