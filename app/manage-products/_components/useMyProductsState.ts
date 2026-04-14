"use client";
import { useMemo, useRef, useState } from "react";
import {
  useAllManagedProducts,
} from "@/apis/queries/product.queries";
import { useVendorMiniStats } from "@/apis/queries/vendor-analytics.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { useBrands } from "@/apis/queries/masters.queries";
import { useMe } from "@/apis/queries/user.queries";

export function useMyProductsState(hasPermission = true) {
  const t = useTranslations();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [activeSearchTermBrand, setActiveSearchTermBrand] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [limit, setLimit] = useState(3);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [globalSelectedIds, setGlobalSelectedIds] = useState<Set<number>>(new Set());
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [displayStoreProducts, setDisplayStoreProducts] = useState(false);
  const [displayBuyGroupProducts, setDisplayBuyGroupProducts] = useState(false);
  const [displayTrialProducts, setDisplayTrialProducts] = useState(false);
  const [displayWholesaleProducts, setDisplayWholesaleProducts] = useState(false);
  const [displayExpiredProducts, setDisplayExpiredProducts] = useState(false);
  const [displayHiddenProducts, setDisplayHiddenProducts] = useState(false);
  const [displayDiscountedProducts, setDisplayDiscountedProducts] = useState(false);

  const me = useMe();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const brandsQuery = useBrands({ term: activeSearchTermBrand });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => ({
        label: item.brandName,
        value: item.id,
      })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const sellType = () => {
    const selectedTypes = [];
    if (displayStoreProducts) selectedTypes.push("NORMALSELL");
    if (displayBuyGroupProducts) selectedTypes.push("BUYGROUP");
    if (displayTrialProducts) selectedTypes.push("TRIAL_PRODUCT");
    if (displayWholesaleProducts) selectedTypes.push("WHOLESALE_PRODUCT");
    return selectedTypes.length > 0 ? selectedTypes.join(",") : "";
  };

  const allManagedProductsQuery = useAllManagedProducts(
    {
      page: showOnlySelected ? 1 : page,
      limit: showOnlySelected ? 1000 : limit,
      term: activeSearchTerm !== "" ? activeSearchTerm : undefined,
      selectedAdminId:
        me?.data?.data?.tradeRole == "MEMBER" ? me?.data?.data?.addedBy : undefined,
      brandIds: selectedBrandIds.join(","),
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(",") : undefined,
      status: displayHiddenProducts ? "INACTIVE" : "",
      expireDate: displayExpiredProducts ? "expired" : "",
      sellType: sellType(),
      discount: displayDiscountedProducts,
    },
    hasPermission,
  );

  const { data, refetch } = allManagedProductsQuery;
  const [products, setProducts] = useState(data?.data || []);
  const [totalCount, setTotalCount] = useState(data?.totalCount || 0);
  const { data: miniStatsMap } = useVendorMiniStats();

  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    if (selectedCategoryIds.length > 0) {
      filtered = filtered.filter((product: any) => {
        const categoryId =
          product.categoryId ||
          product.category?.id ||
          product.product?.categoryId ||
          product.product?.category?.id ||
          product.productPrice_product?.categoryId ||
          product.productPrice_product?.category?.id;
        return selectedCategoryIds.includes(categoryId);
      });
    }
    return filtered;
  }, [products, selectedCategoryIds]);

  const displayTotalCount =
    selectedCategoryIds.length > 0 ? filteredProducts.length : totalCount;

  const handlePageChange = (newPage: number) => { setPage(newPage); };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleFilterToggle = () => {
    if (!showOnlySelected && globalSelectedIds.size === 0) {
      toast({
        title: t("no_products_selected"),
        description: t("please_select_products_first"),
        variant: "danger",
      });
      return;
    }
    setShowOnlySelected(!showOnlySelected);
    setPage(1);
    setTimeout(() => { refetch(); }, 100);
  };

  const handleRemoveFromList = (removedProductId: number) => {
    setProducts((prevProducts: any[]) =>
      prevProducts.filter((product) => product.id !== removedProductId),
    );
    setTotalCount((prevCount: number) => prevCount - 1);
    setGlobalSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(removedProductId);
      return newSet;
    });
    if (globalSelectedIds.size === 0 && showOnlySelected) setShowOnlySelected(false);
    if (products.length === 1 && page > 1) setPage(page - 1);
    else refetch();
  };

  const handleSearchChange = (event: any) => { setSearchTerm(event.target.value); };
  const handleSearch = () => { setActiveSearchTerm(searchTerm); refetch(); };

  const handleBrandSearchChange = (event: any) => { setSearchTermBrand(event.target.value); };
  const handleBrandSearch = () => {
    setActiveSearchTermBrand(searchTermBrand);
    if (brandsQuery.refetch) brandsQuery.refetch();
  };

  const handleCategoryChange = (categoryIds: number[]) => { setSelectedCategoryIds(categoryIds); };
  const handleCategoryClear = () => { setSelectedCategoryIds([]); };

  const handleBrandChange = (checked: boolean | string, item: ISelectOptions) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value))
      tempArr = [...tempArr, item.value];
    if (!checked && tempArr.find((ele: number) => ele === item.value))
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    setSelectedBrandIds(tempArr);
  };

  const selectAll = () => {
    setSelectedBrandIds(brandsQuery?.data?.data?.map((item: any) => item.id) || []);
    setDisplayStoreProducts(true);
    setDisplayBuyGroupProducts(true);
    setDisplayExpiredProducts(true);
    setDisplayHiddenProducts(true);
    setDisplayDiscountedProducts(true);
  };

  const clearFilter = (searchInputRef: React.RefObject<HTMLInputElement | null>, extraClear?: () => void) => {
    setSelectedBrandIds([]);
    setDisplayStoreProducts(false);
    setDisplayBuyGroupProducts(false);
    setDisplayExpiredProducts(false);
    setDisplayHiddenProducts(false);
    setDisplayDiscountedProducts(false);
    setSearchTerm("");
    setActiveSearchTerm("");
    setSearchTermBrand("");
    setActiveSearchTermBrand("");
    setSelectedCategoryIds([]);
    if (searchInputRef?.current) searchInputRef.current.value = "";
    if (extraClear) extraClear();
  };

  const handleProductIds = (checked: boolean | string, id: number) => {
    let tempArr = selectedProductIds || [];
    if (checked && !tempArr.find((ele: number) => ele === id)) {
      tempArr = [...tempArr, id];
      setGlobalSelectedIds((prev) => new Set(Array.from(prev).concat([id])));
    }
    if (!checked && tempArr.find((ele: number) => ele === id)) {
      tempArr = tempArr.filter((ele: number) => ele !== id);
      setGlobalSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
    setSelectedProductIds(tempArr);
  };

  return {
    page, setPage,
    searchTerm, searchTermBrand,
    activeSearchTerm, activeSearchTermBrand,
    selectedCategoryIds, setSelectedCategoryIds,
    limit, showOnlySelected, setShowOnlySelected,
    selectedProductIds, setSelectedProductIds,
    globalSelectedIds, setGlobalSelectedIds,
    selectedBrandIds,
    displayStoreProducts, setDisplayStoreProducts,
    displayBuyGroupProducts, setDisplayBuyGroupProducts,
    displayTrialProducts, setDisplayTrialProducts,
    displayWholesaleProducts, setDisplayWholesaleProducts,
    displayExpiredProducts, setDisplayExpiredProducts,
    displayHiddenProducts, setDisplayHiddenProducts,
    displayDiscountedProducts, setDisplayDiscountedProducts,
    me, searchInputRef,
    brandsQuery, memoizedBrands,
    allManagedProductsQuery, data, refetch,
    products, setProducts, totalCount, setTotalCount,
    miniStatsMap, filteredProducts, displayTotalCount,
    handlePageChange, handleLimitChange, handleFilterToggle,
    handleRemoveFromList, handleSearchChange, handleSearch,
    handleBrandSearchChange, handleBrandSearch,
    handleCategoryChange, handleCategoryClear,
    handleBrandChange, selectAll, clearFilter, handleProductIds,
  };
}
