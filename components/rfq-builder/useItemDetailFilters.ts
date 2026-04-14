/**
 * useItemDetailFilters — manages filter chip state, advanced filter values,
 * sort, view mode, and pagination for ItemDetailPanel.
 */
import { useState, useMemo } from "react";
import {
  FILTER_CHIPS,
  type FilterChipKey,
} from "./cards/FilterChipBar";

interface UseItemDetailFiltersProps {
  activeCategories?: Set<string>;
  onCategoryChange?: (categories: Set<string>) => void;
}

export function useItemDetailFilters({
  activeCategories,
  onCategoryChange,
}: UseItemDetailFiltersProps) {
  const [localChips, setLocalChips] = useState<Set<FilterChipKey>>(new Set());

  const activeChips = (activeCategories ?? localChips) as Set<FilterChipKey>;

  const setActiveChips = (
    val: Set<FilterChipKey> | ((prev: Set<FilterChipKey>) => Set<FilterChipKey>)
  ) => {
    if (typeof val === "function") {
      const next = val(activeChips);
      if (onCategoryChange) onCategoryChange(next);
      else setLocalChips(next);
    } else {
      if (onCategoryChange) onCategoryChange(val);
      else setLocalChips(val);
    }
  };

  const activeChipDefs = useMemo(
    () => FILTER_CHIPS.filter((c) => activeChips.has(c.key)),
    [activeChips]
  );

  const chipFilterParams = useMemo(() => {
    if (activeChipDefs.length === 1) return { ...activeChipDefs[0].params };
    if (activeChipDefs.length > 1) return { _multiChip: "true" };
    return {};
  }, [activeChipDefs]);

  // Advanced filter values
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [minRating, setMinRating] = useState(0);
  const [stockOnly, setStockOnly] = useState(true);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  const setFilterValue = (key: string, value: any) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (
        value === "" ||
        value === false ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (value instanceof Set && value.size === 0)
      ) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const toggleMultiSelect = (key: string, option: string) => {
    setFilterValues((prev) => {
      const current: Set<string> =
        prev[key] instanceof Set ? new Set(prev[key]) : new Set();
      if (current.has(option)) current.delete(option);
      else current.add(option);
      return { ...prev, [key]: current.size > 0 ? current : undefined };
    });
  };

  const toggleChip = (key: FilterChipKey) => {
    setActiveChips((prev: Set<FilterChipKey>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSearchPage(1);
  };

  const activeFilterCount =
    Object.keys(filterValues).length +
    (minRating > 0 ? 1 : 0) +
    (stockOnly ? 1 : 0) +
    (discountOnly ? 1 : 0) +
    activeChips.size;

  const clearAllFilters = () => {
    setFilterValues({});
    setMinRating(0);
    setStockOnly(false);
    setDiscountOnly(false);
    setActiveChips(new Set());
  };

  return {
    activeChips,
    setActiveChips,
    activeChipDefs,
    chipFilterParams,
    filterValues,
    setFilterValue,
    toggleMultiSelect,
    minRating,
    setMinRating,
    stockOnly,
    setStockOnly,
    discountOnly,
    setDiscountOnly,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    filtersOpen,
    setFiltersOpen,
    searchPage,
    setSearchPage,
    toggleChip,
    activeFilterCount,
    clearAllFilters,
  };
}
