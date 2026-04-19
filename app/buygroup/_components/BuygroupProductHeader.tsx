"use client";
import React from "react";
import { useTranslations } from "next-intl";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";

interface BuygroupProductHeaderProps {
  langDir: string;
  viewType: "grid" | "list";
  setViewType: (v: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  cartListLength: number;
  onOpenFilter: () => void;
  onOpenCart: () => void;
}

const BuygroupProductHeader: React.FC<BuygroupProductHeaderProps> = ({
  langDir,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  cartListLength,
  onOpenFilter,
  onOpenCart,
}) => {
  const t = useTranslations();

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-muted p-4 sm:flex-row sm:items-center">
      {/* Left Section - Mobile Buttons & Title */}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        {/* Mobile Filter Button */}
        <button
          type="button"
          className="rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden"
          onClick={onOpenFilter}
        >
          <FilterMenuIcon />
        </button>

        {/* Mobile Cart Button */}
        <button
          type="button"
          className="relative rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden"
          onClick={onOpenCart}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartListLength > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {cartListLength}
            </span>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 sm:flex-none">
          <h2
            className="text-base font-semibold text-foreground sm:text-xl"
            dir={langDir}
            translate="no"
          >
            {t("buygroup_products")}
          </h2>
        </div>
      </div>

      {/* Right Section - Sort & View Controls */}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <Select onValueChange={(e) => setSortBy(e)} value={sortBy}>
          <SelectTrigger className="h-10 w-full border-border bg-card sm:w-[180px]">
            <SelectValue
              placeholder={t("sort_by")}
              dir={langDir}
              translate="no"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="desc" dir={langDir} translate="no">
                {t("sort_by_latest")}
              </SelectItem>
              <SelectItem value="asc" dir={langDir} translate="no">
                {t("sort_by_oldest")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card p-1 sm:flex">
          <button
            type="button"
            className={`rounded p-2 transition-colors ${
              viewType === "grid"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setViewType("grid")}
          >
            <GridIcon active={viewType === "grid"} />
          </button>
          <button
            type="button"
            className={`rounded p-2 transition-colors ${
              viewType === "list"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setViewType("list")}
          >
            <ListIcon active={viewType === "list"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuygroupProductHeader;
