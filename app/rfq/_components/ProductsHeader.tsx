"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import { ShoppingCart } from "lucide-react";

interface ProductsHeaderProps {
  t: (key: string) => string;
  langDir: string;
  viewType: "grid" | "list";
  setViewType: (v: "grid" | "list") => void;
  sortBy: "newest" | "oldest";
  setSortBy: (v: "newest" | "oldest") => void;
  cartListLength: number;
  onOpenFilterDrawer: () => void;
  onOpenCartDrawer: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  t,
  langDir,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  cartListLength,
  onOpenFilterDrawer,
  onOpenCartDrawer,
}) => {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-muted p-4 sm:flex-row sm:items-center">
      {/* Left Section - Mobile Buttons & Title */}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        {/* Mobile Filter Button */}
        <button
          type="button"
          className="rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden"
          onClick={onOpenFilterDrawer}
        >
          <FilterMenuIcon />
        </button>

        {/* Mobile Cart Button */}
        <button
          type="button"
          className="relative rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden"
          onClick={onOpenCartDrawer}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartListLength > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
              {cartListLength > 99 ? "99+" : cartListLength}
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
            {t("rfq_products")}
          </h2>
        </div>
      </div>

      {/* Right Section - Sort & View Controls */}
      <div className="flex w-full items-center gap-3 sm:w-auto">
        {/* Sort Dropdown */}
        <Select onValueChange={(e: any) => setSortBy(e)} value={sortBy}>
          <SelectTrigger className="h-10 w-full border-border bg-card sm:w-[180px]">
            <SelectValue
              placeholder={t("sort_by")}
              dir={langDir}
              translate="no"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="newest" dir={langDir} translate="no">
                {t("sort_by_latest")}
              </SelectItem>
              <SelectItem value="oldest" dir={langDir} translate="no">
                {t("sort_by_oldest")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* View Type Buttons */}
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

export default ProductsHeader;
