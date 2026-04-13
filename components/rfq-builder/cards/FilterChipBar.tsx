"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Star, ShoppingCart, FileText, SlidersHorizontal, ArrowUpDown, RotateCcw, Wrench,
  Store, Package, Users, Tag, Percent, Briefcase, Layers, LayoutGrid, List,
} from "lucide-react";

// ─── Filter chip definitions ────────────────────────────────────
export type FilterChipKey = "retail" | "wholesale" | "buygroup" | "customizable" | "discount" | "rfq" | "vendor_store" | "service";

export interface FilterChipDef {
  key: FilterChipKey;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  /** Maps to backend query params */
  params: Record<string, string>;
}

// Active/inactive styles per chip — fully spelled out for Tailwind JIT
export const CHIP_STYLES: Record<string, { active: string; inactive: string }> = {
  blue:    { active: "bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200", inactive: "" },
  indigo:  { active: "bg-indigo-100 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200", inactive: "" },
  violet:  { active: "bg-violet-100 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200", inactive: "" },
  amber:   { active: "bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200", inactive: "" },
  rose:    { active: "bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200", inactive: "" },
  primary: { active: "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20", inactive: "" },
  emerald: { active: "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200", inactive: "" },
  cyan:    { active: "bg-cyan-100 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-200", inactive: "" },
};

export const FILTER_CHIPS: FilterChipDef[] = [
  { key: "retail",        label: "Retail",        labelAr: "تجزئة",         icon: ShoppingCart, color: "blue",    params: { productType: "P", sellType: "NORMALSELL" } },
  { key: "wholesale",     label: "Wholesale",     labelAr: "جملة",          icon: Package,      color: "indigo",  params: { productType: "F" } },
  { key: "buygroup",      label: "Buy Group",     labelAr: "مجموعة شراء",   icon: Users,        color: "violet",  params: { sellType: "BUYGROUP" } },
  { key: "customizable",  label: "Customizable",  labelAr: "قابل للتخصيص",  icon: Wrench,       color: "amber",   params: { isCustomProduct: "true" } },
  { key: "discount",      label: "Discount",      labelAr: "خصم",           icon: Percent,      color: "rose",    params: { hasDiscount: "true" } },
  { key: "rfq",           label: "RFQ",           labelAr: "طلب أسعار",     icon: FileText,     color: "primary", params: { productType: "R" } },
  { key: "vendor_store",  label: "Vendor Store",  labelAr: "متاجر البائعين", icon: Store,        color: "emerald", params: {} },
  { key: "service",       label: "Service",       labelAr: "خدمات",          icon: Briefcase,    color: "cyan",    params: {} },
];

// ─── Category filter definitions (mock) ──────────────────────────
export interface CategoryFilter {
  key: string;
  name: string;
  nameAr?: string;
  dataType: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  unit?: string;
  options?: string;
  groupName?: string;
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: "anc_type", name: "Noise Cancelling", nameAr: "إلغاء الضوضاء", dataType: "SELECT", options: "Active ANC,Passive,Adaptive ANC,None", groupName: "Audio" },
  { key: "bluetooth", name: "Bluetooth", nameAr: "بلوتوث", dataType: "SELECT", options: "5.0,5.1,5.2,5.3", groupName: "Connectivity" },
  { key: "battery_hours", name: "Battery Life", nameAr: "عمر البطارية", dataType: "NUMBER", unit: "hrs", groupName: "Power" },
  { key: "driver_size", name: "Driver Size", nameAr: "حجم المحرك", dataType: "NUMBER", unit: "mm", groupName: "Audio" },
  { key: "weight", name: "Weight", nameAr: "الوزن", dataType: "NUMBER", unit: "g", groupName: "Physical" },
  { key: "foldable", name: "Foldable", nameAr: "قابل للطي", dataType: "BOOLEAN", groupName: "Physical" },
  { key: "multipoint", name: "Multipoint", nameAr: "تعدد الاتصال", dataType: "BOOLEAN", groupName: "Connectivity" },
  { key: "warranty", name: "Warranty", nameAr: "الكفالة", dataType: "SELECT", options: "6 months,1 year,2 years,3 years", groupName: "Support" },
  { key: "delivery", name: "Delivery", nameAr: "التوصيل", dataType: "SELECT", options: "1-2 days,3-5 days,5-7 days,7+ days", groupName: "Shipping" },
];

// ─── ChipBar Props ──────────────────────────────────────────────
export interface FilterChipBarProps {
  locale: string;
  activeChips: Set<FilterChipKey>;
  toggleChip: (key: FilterChipKey) => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
}

/** The horizontal scrollable chip row (filter bar). */
export function FilterChipBar({
  locale,
  activeChips,
  toggleChip,
  filtersOpen,
  setFiltersOpen,
  activeFilterCount,
  clearAllFilters,
}: FilterChipBarProps) {
  const isAr = locale === "ar";

  return (
    <div className="border-b border-border shrink-0">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/20 overflow-x-auto scrollbar-thin">
        {FILTER_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive = activeChips.has(chip.key);
          const styles = CHIP_STYLES[chip.color] || CHIP_STYLES.blue;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleChip(chip.key)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap transition-all shrink-0",
                isActive
                  ? styles.active
                  : "bg-background border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {isAr ? chip.labelAr : chip.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Filters toggle */}
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap transition-all shrink-0",
            filtersOpen ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
          <SlidersHorizontal className="h-3 w-3" />
          {isAr ? "فلاتر" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[7px] font-bold px-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearAllFilters}
            className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-destructive shrink-0 ms-auto">
            <RotateCcw className="h-2.5 w-2.5" /> {isAr ? "مسح" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SortViewBar Props ──────────────────────────────────────────
export interface SortViewBarProps {
  locale: string;
  sortBy: string;
  setSortBy: (v: string) => void;
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
  activeChips: Set<FilterChipKey>;
  /** Whether to include the "Delivery: Fastest" option */
  includeDeliverySort?: boolean;
}

/** Sort dropdown + list/grid toggle bar. */
export function SortViewBar({
  locale,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  activeChips,
  includeDeliverySort = false,
}: SortViewBarProps) {
  const isAr = locale === "ar";

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-muted/20">
      <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
        className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none">
        <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: Low\u2192High"}</option>
        <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: High\u2192Low"}</option>
        <option value="rating-desc">{isAr ? "التقييم: الأعلى" : "Rating: Best"}</option>
        {includeDeliverySort && (
          <option value="delivery-asc">{isAr ? "التوصيل: الأسرع" : "Delivery: Fastest"}</option>
        )}
        <option value="discount-desc">{isAr ? "الخصم: الأكبر" : "Discount: Biggest"}</option>
      </select>

      {/* View mode toggle */}
      <div className="flex items-center rounded border border-border ms-auto">
        <button type="button" onClick={() => setViewMode("list")}
          className={cn("flex h-6 w-6 items-center justify-center transition-colors",
            viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
          <List className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => setViewMode("grid")}
          className={cn("flex h-6 w-6 items-center justify-center border-s border-border transition-colors",
            viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
          <LayoutGrid className="h-3 w-3" />
        </button>
      </div>

      {/* Active chip summary */}
      {activeChips.size > 0 && (
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground">
            {activeChips.size} {isAr ? "فلتر نشط" : "active"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── AdvancedFilterPanel Props ───────────────────────────────────
export interface AdvancedFilterPanelProps {
  locale: string;
  filtersOpen: boolean;
  minRating: number;
  setMinRating: (v: number) => void;
  stockOnly: boolean;
  setStockOnly: (v: boolean) => void;
  discountOnly: boolean;
  setDiscountOnly: (v: boolean) => void;
  filterValues: Record<string, any>;
  setFilterValue: (key: string, value: any) => void;
  toggleMultiSelect: (key: string, option: string) => void;
  /** Whether to show category-level dynamic filters or just base filters */
  showCategoryFilters?: boolean;
}

/** Expandable filter panel with rating, stock, discount, and category-specific filters. */
export function AdvancedFilterPanel({
  locale,
  filtersOpen,
  minRating,
  setMinRating,
  stockOnly,
  setStockOnly,
  discountOnly,
  setDiscountOnly,
  filterValues,
  setFilterValue,
  toggleMultiSelect,
  showCategoryFilters = true,
}: AdvancedFilterPanelProps) {
  const isAr = locale === "ar";

  if (!filtersOpen) return null;

  // Group filters by groupName
  const filterGroups = CATEGORY_FILTERS.reduce<Record<string, CategoryFilter[]>>((acc, f) => {
    const group = f.groupName ?? "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(f);
    return acc;
  }, {});

  return (
    <div className="px-3 py-2.5 bg-muted/10 border-t border-border/50">
      {/* Base filters: Rating + Stock + Discount */}
      <div className="flex items-center gap-4 pb-2 mb-2 border-b border-border/30">
        <div className="flex items-center gap-0.5">
          <span className="text-[9px] text-muted-foreground me-1">{isAr ? "تقييم" : "Rating"}</span>
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} type="button" onClick={() => setMinRating(minRating === r ? 0 : r)} className="p-0.5">
              <Star className={cn("h-3.5 w-3.5", r <= minRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
          <span className="text-[9px]">{isAr ? "متوفر" : "In Stock"}</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
          <span className="text-[9px]">{isAr ? "خصم" : "Discount"}</span>
        </label>
      </div>

      {/* Dynamic category filters — grouped */}
      {showCategoryFilters && Object.entries(filterGroups).map(([groupName, groupFilters]) => (
        <div key={groupName} className="mb-2.5">
          <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">{groupName}</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
            {groupFilters.map((f) => {
              const label = isAr && f.nameAr ? f.nameAr : f.name;
              const val = filterValues[f.key];

              // SELECT
              if (f.dataType === "SELECT") {
                const opts = (f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
                return (
                  <div key={f.key}>
                    <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                    <select value={val ?? ""} onChange={(e) => setFilterValue(f.key, e.target.value)}
                      className="w-full text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary">
                      <option value="">{isAr ? "الكل" : "Any"}</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                );
              }

              // MULTI_SELECT
              if (f.dataType === "MULTI_SELECT") {
                const opts = (f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
                const selected: Set<string> = val instanceof Set ? val : new Set();
                return (
                  <div key={f.key} className="col-span-2">
                    <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                    <div className="flex flex-wrap gap-1">
                      {opts.map((o) => (
                        <button key={o} type="button" onClick={() => toggleMultiSelect(f.key, o)}
                          className={cn("text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                            selected.has(o) ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground")}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              // NUMBER
              if (f.dataType === "NUMBER") {
                const range = val ?? [null, null];
                return (
                  <div key={f.key}>
                    <label className="text-[9px] text-muted-foreground block mb-0.5">{label}{f.unit ? ` (${f.unit})` : ""}</label>
                    <div className="flex items-center gap-1">
                      <input type="number" placeholder="min" value={range[0] ?? ""}
                        onChange={(e) => setFilterValue(f.key, [e.target.value ? Number(e.target.value) : null, range[1]])}
                        className="w-14 text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                      <span className="text-[8px] text-muted-foreground">{"\u2013"}</span>
                      <input type="number" placeholder="max" value={range[1] ?? ""}
                        onChange={(e) => setFilterValue(f.key, [range[0], e.target.value ? Number(e.target.value) : null])}
                        className="w-14 text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                );
              }

              // BOOLEAN
              if (f.dataType === "BOOLEAN") {
                return (
                  <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!val} onChange={(e) => setFilterValue(f.key, e.target.checked || undefined)}
                      className="rounded border-border text-primary h-3 w-3" />
                    <span className="text-[10px]">{label}</span>
                  </label>
                );
              }

              // TEXT
              return (
                <div key={f.key}>
                  <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                  <input type="text" value={val ?? ""} onChange={(e) => setFilterValue(f.key, e.target.value)}
                    placeholder={label} className="w-full text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
