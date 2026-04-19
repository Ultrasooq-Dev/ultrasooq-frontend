"use client";
import {
  useCartListByDevice,
  useCartListByUserId,
  useCartRecommendations,
} from "@/apis/queries/cart.queries";
import { useAuth } from "@/context/AuthContext";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { CartItem } from "@/utils/types/cart.types";
import { getCookie } from "cookies-next";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAllProducts } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useMe } from "@/apis/queries/user.queries";
import {
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from "@/apis/queries/cart.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useQueryClient } from "@tanstack/react-query";
import { ProductPricingInfo } from "./cartTypes";

export const useCartData = () => {
  const { user, langDir, currency } = useAuth();
  const searchParamsCart = useSearchParams();
  const initialTab = searchParamsCart?.get("tab") === "rfq" ? "rfq" : "order";
  const [activeCartTab, setActiveCartTab] = useState<"order" | "rfq">(initialTab);
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const vendorBusinessCategoryIds = useVendorBusinessCategories();
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const [loading, setLoading] = useState<boolean>(false);

  const cartListByDeviceQuery = useCartListByDevice(
    { page: 1, limit: 10, deviceId },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    { page: 1, limit: 10 },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const me = useMe();
  const queryClient = useQueryClient();

  const memoizedCartList = useMemo(() => {
    setLoading(false);
    if (cartListByUser.data?.data) {
      return cartListByUser.data?.data || [];
    } else if (cartListByDeviceQuery.data?.data) {
      return cartListByDeviceQuery.data?.data || [];
    }
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  const uniqueProductIds = useMemo(() => {
    const productIds = new Set<number>();
    memoizedCartList.forEach((item: CartItem) => {
      if (item.cartType === "DEFAULT" && item.productId) {
        productIds.add(item.productId);
      }
    });
    return Array.from(productIds);
  }, [memoizedCartList]);

  const allProductsQuery = useAllProducts(
    { page: 1, limit: 1000 },
    haveAccessToken && uniqueProductIds.length > 0,
  );

  const uniqueCategoryIds = useMemo(() => {
    const categoryIds = new Set<number>();
    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const categoryId = product?.categoryId ?? product?.category?.id;
          if (categoryId) categoryIds.add(categoryId);
        }
      });
    }
    return Array.from(categoryIds);
  }, [allProductsQuery?.data?.data, uniqueProductIds]);

  const cartProductIds = useMemo(() => {
    return memoizedCartList
      .filter((item: CartItem) => item.cartType === "DEFAULT" && item.productId)
      .map((item: CartItem) => item.productId)
      .join(",");
  }, [memoizedCartList]);

  const cartRecommendationsQuery = useCartRecommendations(
    {
      productIds: cartProductIds,
      limit: 20,
      deviceId: !haveAccessToken ? deviceId : undefined,
    },
    memoizedCartList.length > 0 && !loading,
  );

  const recommendedProducts = useMemo(() => {
    if (!cartRecommendationsQuery?.data?.data) return [];
    return cartRecommendationsQuery.data.data
      .filter((product: any) => !uniqueProductIds.includes(product.id))
      .slice(0, 12)
      .map((item: any) => {
        const activePriceEntry =
          item?.product_productPrice?.find((pp: any) => pp?.status === "ACTIVE") ||
          item?.product_productPrice?.[0];
        return {
          id: item.id,
          productName: item.productName,
          productImages: item?.product_productPrice?.[0]
            ?.productPrice_productSellerImage?.length
            ? item?.product_productPrice?.[0]?.productPrice_productSellerImage
            : item?.productImages || [],
          shortDescription: item?.product_productShortDescription?.length
            ? item?.product_productShortDescription?.[0]?.shortDescription
            : "-",
          productReview: item?.product_review || [],
          productProductPrice: activePriceEntry?.offerPrice,
          offerPrice: Number(activePriceEntry?.offerPrice || 0),
          productPrice: Number(activePriceEntry?.productPrice || 0),
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me.data?.data?.id,
          ),
          productProductPriceId: activePriceEntry?.id,
          consumerDiscount: activePriceEntry?.consumerDiscount,
          consumerDiscountType: activePriceEntry?.consumerDiscountType,
          vendorDiscount: activePriceEntry?.vendorDiscount,
          vendorDiscountType: activePriceEntry?.vendorDiscountType,
          askForPrice: activePriceEntry?.askForPrice,
          categoryId: item?.categoryId,
          categoryLocation: item?.categoryLocation,
          categoryConnections: item?.category?.category_categoryIdDetail || [],
          consumerType: activePriceEntry?.consumerType,
        };
      });
  }, [cartRecommendationsQuery?.data?.data, uniqueProductIds, me.data?.data?.id]);

  const firstCategoryId =
    uniqueCategoryIds.length > 0 ? uniqueCategoryIds[0] : undefined;
  const firstCategoryQuery = useCategory(
    firstCategoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && firstCategoryId),
  );

  const productPricingInfoMap = useMemo(() => {
    const map = new Map<number, ProductPricingInfo>();
    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const activePriceEntry =
            product?.product_productPrice?.find(
              (pp: any) => pp?.status === "ACTIVE",
            ) || product?.product_productPrice?.[0];
          const categoryId = product?.categoryId ?? product?.category?.id;

          let freshCategoryConnections: any[] = [];
          if (
            categoryId === firstCategoryId &&
            firstCategoryQuery?.data?.data?.category_categoryIdDetail
          ) {
            freshCategoryConnections =
              firstCategoryQuery.data.data.category_categoryIdDetail;
          } else if (product?.category?.category_categoryIdDetail) {
            freshCategoryConnections = product.category.category_categoryIdDetail;
          }

          map.set(product.id, {
            consumerType: activePriceEntry?.consumerType,
            vendorDiscount: activePriceEntry?.vendorDiscount,
            vendorDiscountType: activePriceEntry?.vendorDiscountType,
            consumerDiscount: activePriceEntry?.consumerDiscount,
            consumerDiscountType: activePriceEntry?.consumerDiscountType,
            categoryId,
            categoryLocation:
              product?.categoryLocation ?? product?.category?.categoryLocation,
            categoryConnections: freshCategoryConnections,
          });
        }
      });
    }
    return map;
  }, [
    allProductsQuery?.data?.data,
    uniqueProductIds,
    firstCategoryId,
    firstCategoryQuery?.data?.data,
  ]);

  useEffect(() => {
    setHaveAccessToken(!!accessToken);
  }, [accessToken]);

  return {
    langDir,
    currency,
    currentTradeRole,
    vendorBusinessCategoryIds,
    activeCartTab,
    setActiveCartTab,
    haveAccessToken,
    deviceId,
    loading,
    setLoading,
    memoizedCartList,
    cartListByUser,
    cartListByDeviceQuery,
    cartRecommendationsQuery,
    recommendedProducts,
    productPricingInfoMap,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    deleteFromWishlist,
    queryClient,
  };
};
