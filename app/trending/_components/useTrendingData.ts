import { useMemo } from "react";
import { IBrands } from "@/utils/types/common.types";
import { useBrands } from "@/apis/queries/masters.queries";
import { useAllProducts, useProductVariant } from "@/apis/queries/product.queries";
import { useDropshipProducts } from "@/apis/queries/dropship.queries";
import { useUserAccounts } from "@/hooks/useUserAccounts";
import { useMe } from "@/apis/queries/user.queries";
import { mapProductItem, buildVendorList } from "./productMappingUtils";

interface UseTrendingDataProps {
  page: number;
  limit: number;
  sortBy: string;
  searchUrlTerm: string;
  priceRange: number[];
  minPriceInput: string;
  maxPriceInput: string;
  selectedBrandIds: number[];
  selectedCategoryIds: number[];
  displayMyProducts: string;
  searchTerm: string;
  categoryIds: string | undefined;
}

export function useTrendingData({
  page,
  limit,
  sortBy,
  searchUrlTerm,
  priceRange,
  minPriceInput,
  maxPriceInput,
  selectedBrandIds,
  selectedCategoryIds,
  displayMyProducts,
  searchTerm,
  categoryIds,
}: UseTrendingDataProps) {
  const me = useMe();

  const allProductsQuery = useAllProducts({
    page,
    limit,
    sort: sortBy,
    term: searchUrlTerm,
    priceMin:
      priceRange[0] === 0
        ? 0
        : ((priceRange[0] || Number(minPriceInput)) ?? undefined),
    priceMax: priceRange[1] || Number(maxPriceInput) || undefined,
    brandIds:
      selectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    userId:
      me?.data?.data?.tradeRole == "BUYER"
        ? undefined
        : me?.data?.data?.tradeRole == "MEMBER"
          ? me?.data?.data?.addedBy
          : me?.data?.data?.id,
    categoryIds:
      selectedCategoryIds.length > 0
        ? selectedCategoryIds.join(",")
        : categoryIds
          ? categoryIds
          : undefined,
    isOwner: displayMyProducts == "1" ? "me" : "",
    userType: me?.data?.data?.tradeRole == "BUYER" ? "BUYER" : "",
  });

  const dropshipProductsQuery = useDropshipProducts({
    page,
    limit,
    status: "ACTIVE",
  });

  const combinedProducts = useMemo(() => {
    const regularProducts = allProductsQuery?.data?.data || [];
    const dropshipProducts = dropshipProductsQuery?.data?.data || [];

    const transformedDropshipProducts = dropshipProducts.map(
      (dropshipProduct: any) => ({
        ...dropshipProduct,
        productType: "D",
        isDropshipped: true,
        customMarketingContent: dropshipProduct.customMarketingContent || {},
        productImages: dropshipProduct.productImages || [],
        additionalMarketingImages: dropshipProduct.additionalMarketingImages || [],
        originalProductName:
          dropshipProduct.originalProduct?.productName || dropshipProduct.productName,
        originalProductDescription:
          dropshipProduct.originalProduct?.productDescription ||
          dropshipProduct.productDescription,
      }),
    );

    return [...regularProducts, ...transformedDropshipProducts];
  }, [allProductsQuery?.data?.data, dropshipProductsQuery?.data?.data]);

  const isLoading = allProductsQuery.isLoading || dropshipProductsQuery.isLoading;

  const totalCount =
    (allProductsQuery?.data?.totalCount || 0) +
    (dropshipProductsQuery?.data?.totalCount || 0);

  const specFilters = useMemo(() => {
    return (allProductsQuery?.data?.filters || []).filter(
      (f: any) => f.key && f.name,
    );
  }, [allProductsQuery?.data?.filters]);

  const uniqueUserIds = useMemo(() => {
    const userIds = new Set<number>();
    combinedProducts.forEach((item: any) => {
      if (item?.userId) userIds.add(item.userId);
    });
    return Array.from(userIds);
  }, [combinedProducts]);

  const { usersMap, isLoading: usersLoading } = useUserAccounts(uniqueUserIds);

  const fetchProductVariant = useProductVariant();

  const brandsQuery = useBrands({ term: searchTerm });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => ({
        label: item.brandName,
        value: item.id,
      })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const memoizedProductList = useMemo(() => {
    return (
      combinedProducts?.map((item: any) =>
        mapProductItem(item, me.data?.data?.id, usersMap),
      ) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    combinedProducts,
    combinedProducts?.length,
    sortBy,
    searchUrlTerm,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    priceRange[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    priceRange[1],
    page,
    limit,
    searchTerm,
    selectedBrandIds,
    displayMyProducts,
    usersMap,
  ]);

  const memoizedVendors = useMemo(() => {
    return buildVendorList(memoizedProductList);
  }, [memoizedProductList]);

  return {
    me,
    allProductsQuery,
    dropshipProductsQuery,
    combinedProducts,
    isLoading,
    totalCount,
    specFilters,
    usersMap,
    usersLoading,
    fetchProductVariant,
    brandsQuery,
    memoizedBrands,
    memoizedProductList,
    memoizedVendors,
  };
}
