"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Search, Calendar, TrendingUp, X } from "lucide-react";
import { STATUS_FILTERS } from "./constants";

interface OrderFilterBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onClearSearch: () => void;
  orderStatus: string;
  onStatusChange: (status: string) => void;
  orderTime: string;
  onTimeChange: (time: string) => void;
  totalCount: number;
  onClearAll: () => void;
}

export default function OrderFilterBar({
  searchTerm,
  onSearchChange,
  searchRef,
  onClearSearch,
  orderStatus,
  onStatusChange,
  orderTime,
  onTimeChange,
  totalCount,
  onClearAll,
}: OrderFilterBarProps) {
  const t = useTranslations();
  const { langDir } = useAuth();
  const hasFilters = !!(orderStatus || orderTime || searchTerm);

  return (
    <div className="sticky top-0 z-20 mb-6 rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm">
      {/* Row 1: Search + Status chips */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search_orders")}
            onChange={onSearchChange}
            ref={searchRef}
            className="w-full rounded-lg border border-border bg-muted/30 py-2 pe-3 ps-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            dir={langDir}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatusChange(s.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all",
                orderStatus === s.value
                  ? `${s.color} text-white shadow-sm`
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {t(s.label)}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="ms-auto text-xs text-muted-foreground">
          {totalCount} {t("results") || "results"}
        </span>
      </div>

      {/* Row 2: Time + Sort + Clear */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border/50 px-5 py-2">
        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <select
            value={orderTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="cursor-pointer rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs font-medium outline-none focus:border-primary"
          >
            <option value="">{t("all_time")}</option>
            <option value="last30">{t("last_30_days")}</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="older">{t("older")}</option>
          </select>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <select className="cursor-pointer rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs font-medium outline-none focus:border-primary">
            <option value="newest">{t("newest_first") || "Newest first"}</option>
            <option value="oldest">{t("oldest_first") || "Oldest first"}</option>
            <option value="price_high">{t("price_high_to_low") || "Price: High to Low"}</option>
            <option value="price_low">{t("price_low_to_high") || "Price: Low to High"}</option>
          </select>
        </div>

        <div className="flex-1" />

        {/* Active filter tags */}
        {orderStatus && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Status: {orderStatus}
            <button type="button" onClick={() => onStatusChange("")}>
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
        {orderTime && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Time: {orderTime}
            <button type="button" onClick={() => onTimeChange("")}>
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}

        {/* Clear all */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline"
          >
            <X className="h-3 w-3" /> {t("clear_all") || "Clear all"}
          </button>
        )}
      </div>
    </div>
  );
}
