"use client";
import { useBrands } from "@/apis/queries/masters.queries";
import {
  useAllBuyGroupProducts,
  useProductVariant,
} from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { useCategoryStore } from "@/lib/categoryStore";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { debounce } from "lodash";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { getCookie } from "cookies-next";

import { TrendingPageProps } from "./buygroupTypes";
import { getLocalTimestamp, mapProductItem } from "./buygroupHelpers";
import { useBuygroupCart } from "./useBuygroupCart";
import { useBuygroupWishlist } from "./useBuygroupWishlist";

export function useBuygroupPage(props0: TrendingPageProps) {
  const searchParams = use(props0.searchParams || Promise.resolve({}));
  const { langDir, currency, user } = useAuth();
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const categoryStore = useCategoryStore();
  const deviceId = getOrCreateDeviceId() || "";

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [sortBy, setSortBy] = useState("desc");
  const [productFilter, setProductFilter] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [displayMyProducts] = useState("0");
  const [displayRelatedProducts] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [haveAccessToken, setHaveAccessToken] = useState(false);

  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const searchUrlTerm = (searchParams as any)?.term || "";
  const category = useCategoryStore();

  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);

  const isRTL = langDir === "rtl";
  const filterSheetSide: "left" | "right" = isRTL ? "right" : "left";
  const cartSheetSide: "left" | "right" = isRTL ? "left" : "right";

  const me = useMe();

  const meData = me?.data?.data;
  const userId =
    meData?.tradeRole == "BUYER" ? undefined
    : meData?.tradeRole == "MEMBER" ? meData?.addedBy
    : meData?.id;
  const allProductsQuery = useAllBuyGroupProducts({
    page, limit, sort: sortBy, term: searchUrlTerm,
    priceMin: priceRange[0] === 0 ? 0 : ((priceRange[0] || Number(minPriceInput)) ?? undefined),
    priceMax: priceRange[1] || Number(maxPriceInput) || undefined,
    brandIds: selectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    userId,
    categoryIds: category.categoryIds ? category.categoryIds : undefined,
    isOwner: displayMyProducts == "1" ? "me" : "",
    related: displayRelatedProducts,
    userType: meData?.tradeRole == "BUYER" ? "BUYER" : "",
  });

  const fetchProductVariant = useProductVariant();
  const brandsQuery = useBrands({ term: searchTerm });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedBrands = useMemo(() => (
    brandsQuery?.data?.data.map((item: IBrands) => ({ label: item.brandName, value: item.id })) || []
  ), [brandsQuery?.data?.data?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const comingSoonProducts = useMemo(() => {
    const now = Date.now();
    return (allProductsQuery?.data?.data || []).filter((p: any) => {
      const pp = p?.product_productPrice?.[0];
      if (!pp) return false;
      if (pp?.sellType !== "BUYGROUP") return false;
      const startTs = getLocalTimestamp(pp?.dateOpen, pp?.startTime);
      return startTs && now < startTs;
    });
  }, [allProductsQuery?.data?.data]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedProductList = useMemo(() => (
    allProductsQuery?.data?.data?.map((item: any) =>
      mapProductItem(item, me.data?.data?.id),
    ) || []
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [allProductsQuery?.data?.data, allProductsQuery?.data?.data?.length,
    sortBy, priceRange[0], priceRange[1], page, limit, searchTerm, // eslint-disable-line react-hooks/exhaustive-deps
    selectedBrandIds, displayMyProducts]);

  const getProductVariants = async () => {
    const productPriceIds = memoizedProductList
      .filter((item: any) => item.productPrices.length > 0)
      .map((item: any) => item.productPrices[0].id);
    const response = await fetchProductVariant.mutateAsync(productPriceIds);
    if (response.status) setProductVariants(response.data);
  };

  useEffect(() => {
    if (memoizedProductList.length) {
      getProductVariants();
    }
  }, [memoizedProductList]);

  const cart = useBuygroupCart({
    deviceId,
    haveAccessToken,
    memoizedProductList,
    currentTradeRole,
  });

  const { handleAddToWishlist } = useBuygroupWishlist({ meId: me.data?.data?.id });

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
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

  const handleBrandChange = (checked: boolean | string, item: ISelectOptions) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }
    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setSelectedBrandIds(tempArr);
  };

  const selectAll = () => {
    setSelectedBrandIds(
      brandsQuery?.data?.data?.map((item: any) => item.id) || [],
    );
  };

  const clearFilter = () => {
    setSelectedBrandIds([]);
    setMaxPriceInput("");
    setMinPriceInput("");
    setPriceRange([]);
    if (minPriceInputRef.current) minPriceInputRef.current.value = "";
    if (maxPriceInputRef.current) maxPriceInputRef.current.value = "";
  };

  useEffect(() => {
    setHaveAccessToken(!!accessToken);
  }, [accessToken]);

  useEffect(() => {
    return () => {
      categoryStore.setSubCategories([]);
      categoryStore.setSubSubCategories([]);
      categoryStore.setCategoryId("");
      categoryStore.setCategoryIds("");
      categoryStore.setSubCategoryIndex(0);
      categoryStore.setSecondLevelCategoryIndex(0);
      categoryStore.setSubCategoryParentName("");
      categoryStore.setSubSubCategoryParentName("");
    };
  }, []);

  return {
    // layout / i18n
    langDir,
    currency,
    isRTL,
    filterSheetSide,
    cartSheetSide,
    // filter state
    memoizedBrands,
    selectedBrandIds,
    minPriceInputRef,
    maxPriceInputRef,
    selectAll,
    clearFilter,
    handleBrandChange,
    handleDebounce,
    handlePriceDebounce,
    handleMinPriceChange,
    handleMaxPriceChange,
    setPriceRange,
    // products
    allProductsQuery,
    comingSoonProducts,
    memoizedProductList,
    productVariants,
    // view
    viewType,
    setViewType,
    sortBy,
    setSortBy,
    page,
    setPage,
    limit,
    // drawers
    productFilter,
    setProductFilter,
    showCartDrawer,
    setShowCartDrawer,
    // auth
    haveAccessToken,
    deviceId,
    // category
    category,
    // cart
    cart,
    // wishlist
    handleAddToWishlist,
  };
}
