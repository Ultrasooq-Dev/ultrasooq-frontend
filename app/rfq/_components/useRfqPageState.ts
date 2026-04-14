"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { useMe } from "@/apis/queries/user.queries";
import { useRfqProducts } from "@/apis/queries/rfq.queries";
import { useRfqFilters } from "./useRfqFilters";
import { useRfqCart } from "./useRfqCart";

export function useRfqPageState(initialTerm?: string) {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);

  // Layout helpers for RTL/LTR
  const isRTL = langDir === "rtl";
  const filterSheetSide: "left" | "right" = isRTL ? "right" : "left";
  const cartSheetSide: "left" | "right" = isRTL ? "left" : "right";

  const filters = useRfqFilters();

  // Allow initialTerm to seed searchRfqTerm on first mount
  useEffect(() => {
    if (initialTerm) {
      filters.setSearchRfqTerm(initialTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHaveAccessToken(!!accessToken);
  }, [accessToken]);

  const me = useMe(haveAccessToken);

  const rfqProductsQuery = useRfqProducts({
    page,
    limit,
    term: filters.searchRfqTerm,
    adminId:
      me?.data?.data?.tradeRole == "MEMBER"
        ? me?.data?.data?.addedBy
        : me?.data?.data?.id,
    sortType: filters.sortBy,
    brandIds: filters.selectedBrandIds.join(","),
    isOwner: filters.displayMyProducts == "1" ? "me" : "",
  });

  const cart = useRfqCart(haveAccessToken, me?.data, rfqProductsQuery?.data);

  return {
    // i18n / layout
    t,
    langDir,
    currency,
    isRTL,
    filterSheetSide,
    cartSheetSide,
    // pagination
    page,
    setPage,
    limit,
    // access
    haveAccessToken,
    // queries
    me,
    rfqProductsQuery,
    // — filters —
    sortBy: filters.sortBy,
    setSortBy: filters.setSortBy,
    searchTermBrand: filters.searchTermBrand,
    selectedBrandIds: filters.selectedBrandIds,
    selectAllBrands: filters.selectAllBrands,
    displayMyProducts: filters.displayMyProducts,
    productFilter: filters.productFilter,
    setProductFilter: filters.setProductFilter,
    priceRange: filters.priceRange,
    setPriceRange: filters.setPriceRange,
    minPriceInputRef: filters.minPriceInputRef,
    maxPriceInputRef: filters.maxPriceInputRef,
    searchInputRef: filters.searchInputRef,
    memoizedBrands: filters.memoizedBrands,
    handleRfqDebounce: filters.handleRfqDebounce,
    handlePriceDebounce: filters.handlePriceDebounce,
    handleMinPriceChange: filters.handleMinPriceChange,
    handleMaxPriceChange: filters.handleMaxPriceChange,
    handleBrandChange: filters.handleBrandChange,
    handleBrandSearchChange: filters.handleBrandSearchChange,
    handleBrandSearch: filters.handleBrandSearch,
    selectAll: filters.selectAll,
    clearFilter: filters.clearFilter,
    // — cart —
    wrapperRef: cart.wrapperRef,
    viewType: cart.viewType,
    setViewType: cart.setViewType,
    showCartDrawer: cart.showCartDrawer,
    setShowCartDrawer: cart.setShowCartDrawer,
    selectedProductId: cart.selectedProductId,
    setSelectedProductId: cart.setSelectedProductId,
    isAddToCartModalOpen: cart.isAddToCartModalOpen,
    setIsAddToCartModalOpen: cart.setIsAddToCartModalOpen,
    quantity: cart.quantity,
    setQuantity: cart.setQuantity,
    offerPriceFrom: cart.offerPriceFrom,
    offerPriceTo: cart.offerPriceTo,
    cartList: cart.cartList,
    memoizedRfqProducts: cart.memoizedRfqProducts,
    updateRfqCartWithLogin: cart.updateRfqCartWithLogin,
    deleteRfqCartItem: cart.deleteRfqCartItem,
    handleToggleAddModal: cart.handleToggleAddModal,
    handleAddToCart: cart.handleAddToCart,
    handleCartPage: cart.handleCartPage,
    handleRemoveItemFromCart: cart.handleRemoveItemFromCart,
    handleRFQCart: cart.handleRFQCart,
    handleAddToWishlist: cart.handleAddToWishlist,
  };
}
