"use client";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface SpecCheckboxFilterProps {
  filter: any;
  selectedSpecFilters: Record<string, string[]>;
  onSpecFilterChange: (key: string, value: string, checked: boolean) => void;
  isMobile: boolean;
  values: string[];
  labelMap?: Record<string, string>;
}

export function SpecCheckboxFilter({
  filter,
  selectedSpecFilters,
  onSpecFilterChange,
  isMobile,
  values,
  labelMap,
}: SpecCheckboxFilterProps) {
  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={[filter.key]}
        className={
          isMobile ? "" : "overflow-hidden rounded-lg border border-border"
        }
      >
        <AccordionItem
          value={filter.key}
          className={isMobile ? "" : "border-0"}
        >
          <AccordionTrigger
            className={
              isMobile
                ? "text-base hover:no-underline!"
                : "bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted"
            }
          >
            <span>{filter.name}</span>
          </AccordionTrigger>
          <AccordionContent className={isMobile ? "" : "bg-card px-4 py-3"}>
            <div
              className={`space-y-2 overflow-y-auto ${isMobile ? "max-h-40" : "max-h-48"}`}
            >
              {values.map((val: string) => (
                <div
                  key={val}
                  className={
                    isMobile
                      ? "flex items-center justify-between"
                      : "flex items-center justify-between rounded px-2 py-1 transition-colors hover:bg-muted"
                  }
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${isMobile ? "m-" : ""}spec-${filter.key}-${val}`}
                      className={
                        isMobile
                          ? "border border-border data-[state=checked]:bg-primary!"
                          : "border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      }
                      checked={(
                        selectedSpecFilters[filter.key] || []
                      ).includes(val)}
                      onCheckedChange={(checked) =>
                        onSpecFilterChange(filter.key, val, !!checked)
                      }
                    />
                    <label
                      htmlFor={`${isMobile ? "m-" : ""}spec-${filter.key}-${val}`}
                      className="cursor-pointer text-sm leading-none font-medium"
                    >
                      {labelMap ? labelMap[val] ?? val : val}
                    </label>
                  </div>
                  {filter.counts?.[val] != null && (
                    <span className="text-xs text-muted-foreground">
                      ({filter.counts[val]})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface SpecNumberFilterProps {
  filter: any;
  selectedSpecFilters: Record<string, string[]>;
  onSpecRangeChange: (key: string, min: string, max: string) => void;
  isMobile: boolean;
}

export function SpecNumberFilter({
  filter,
  selectedSpecFilters,
  onSpecRangeChange,
  isMobile,
}: SpecNumberFilterProps) {
  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={[filter.key]}
        className={
          isMobile ? "" : "overflow-hidden rounded-lg border border-border"
        }
      >
        <AccordionItem
          value={filter.key}
          className={isMobile ? "" : "border-0"}
        >
          <AccordionTrigger
            className={
              isMobile
                ? "text-base hover:no-underline!"
                : "bg-muted px-4 py-3 font-semibold text-foreground hover:bg-muted"
            }
          >
            <span>
              {filter.name}
              {filter.unit ? ` (${filter.unit})` : ""}
            </span>
          </AccordionTrigger>
          <AccordionContent className={isMobile ? "" : "bg-card px-4 py-3"}>
            <div
              className={`flex items-center gap-2 ${isMobile ? "px-2" : ""}`}
            >
              <Input
                type="number"
                placeholder={String(filter.range.min)}
                className={
                  isMobile ? "h-8 text-sm" : "h-9 w-full border-border text-sm"
                }
                onChange={(e) =>
                  onSpecRangeChange(
                    filter.key,
                    e.target.value,
                    selectedSpecFilters[`${filter.key}_max`]?.[0] || "",
                  )
                }
                onWheel={(e) => e.currentTarget.blur()}
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="number"
                placeholder={String(filter.range.max)}
                className={
                  isMobile ? "h-8 text-sm" : "h-9 w-full border-border text-sm"
                }
                onChange={(e) =>
                  onSpecRangeChange(
                    filter.key,
                    selectedSpecFilters[`${filter.key}_min`]?.[0] || "",
                    e.target.value,
                  )
                }
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <p
              className={`mt-1 text-xs text-muted-foreground ${isMobile ? "px-2" : ""}`}
            >
              {filter.range.min} – {filter.range.max}
              {filter.unit ? ` ${filter.unit}` : ""}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
