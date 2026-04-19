"use client";
import { useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { useBrands } from "@/apis/queries/masters.queries";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";

export function useRfqFilters() {
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [searchRfqTerm, setSearchRfqTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectAllBrands, setSelectAllBrands] = useState<boolean>(false);
  const [displayMyProducts, setDisplayMyProducts] = useState("0");
  const [productFilter, setProductFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const brandsQuery = useBrands({ term: searchTerm });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const handleRfqDebounce = debounce((event: any) => {
    setSearchRfqTerm(event.target.value);
  }, 1000);

  const handlePriceDebounce = debounce((event: any) => {
    setPriceRange(event);
  }, 1000);

  const handleMinPriceChange = debounce((event: any) => {
    setMinPriceInput(event.target.value);
  }, 1000);

  const handleMaxPriceChange = debounce((event: any) => {
    setMaxPriceInput(event.target.value);
  }, 1000);

  const handleBrandChange = (
    checked: boolean | string,
    item: ISelectOptions,
  ) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }
    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setSelectedBrandIds(tempArr);
  };

  const handleBrandSearchChange = (event: any) => {
    setSearchTermBrand(event.target.value);
  };

  const handleBrandSearch = () => {
    setSearchTerm(searchTermBrand);
    if (brandsQuery.refetch) {
      brandsQuery.refetch();
    }
  };

  const selectAll = () => {
    setSelectAllBrands(true);
  };

  const clearFilter = (extraCleanup?: () => void) => {
    setSelectAllBrands(false);
    setSearchRfqTerm("");
    setSelectedBrandIds([]);
    setDisplayMyProducts("0");
    setMaxPriceInput("");
    setMinPriceInput("");
    setPriceRange([]);
    if (searchInputRef?.current) searchInputRef.current.value = "";
    if (minPriceInputRef.current) minPriceInputRef.current.value = "";
    if (maxPriceInputRef.current) maxPriceInputRef.current.value = "";
    extraCleanup?.();
  };

  return {
    // state
    sortBy,
    setSortBy,
    searchRfqTerm,
    setSearchRfqTerm,
    searchTermBrand,
    selectedBrandIds,
    selectAllBrands,
    displayMyProducts,
    productFilter,
    setProductFilter,
    priceRange,
    setPriceRange,
    minPriceInput,
    maxPriceInput,
    // refs
    minPriceInputRef,
    maxPriceInputRef,
    searchInputRef,
    // query data
    memoizedBrands,
    // handlers
    handleRfqDebounce,
    handlePriceDebounce,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleBrandChange,
    handleBrandSearchChange,
    handleBrandSearch,
    selectAll,
    clearFilter,
  };
}
