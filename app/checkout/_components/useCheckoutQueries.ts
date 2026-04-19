"use client";
import { useMemo } from "react";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useDeleteServiceFromCart,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import {
  useAllUserAddress,
  useDeleteAddress,
} from "@/apis/queries/address.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAllProducts } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useFindOneRfqQuotesUsersByBuyerID } from "@/apis/queries/rfq.queries";
import { useAddToWishList } from "@/apis/queries/wishlist.queries";
import { usePreOrderCalculation } from "@/apis/queries/orders.queries";
import { CartItem } from "@/utils/types/cart.types";
import { ProductPricingInfo } from "./checkoutTypes";

export const useCheckoutQueries = (
  haveAccessToken: boolean,
  deviceId: string,
  rfqQuoteData: any,
  isFromRfq: boolean,
  currentTradeRole: string | undefined,
) => {
  const me = useMe(haveAccessToken);
  const cartListByDeviceQuery = useCartListByDevice(
    { page: 1, limit: 100, deviceId },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    { page: 1, limit: 100 },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const addToWishlist = useAddToWishList();
  const allUserAddressQuery = useAllUserAddress(
    { page: 1, limit: 10 },
    haveAccessToken,
  );
  const delteAddress = useDeleteAddress();
  const preOrderCalculation = usePreOrderCalculation();

  const rfqQuoteDetailsQuery = useFindOneRfqQuotesUsersByBuyerID(
    { rfqQuotesId: rfqQuoteData?.rfqQuotesId },
    isFromRfq && !!rfqQuoteData?.rfqQuotesId,
  );
  const rfqQuoteDetails = rfqQuoteDetailsQuery.data?.data;

  const memoizedCartList = useMemo(() => {
    if (cartListByUser.data?.data) return cartListByUser.data?.data || [];
    if (cartListByDeviceQuery.data?.data)
      return cartListByDeviceQuery.data?.data || [];
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  const memoziedAddressList = useMemo(
    () => allUserAddressQuery.data?.data || [],
    [allUserAddressQuery.data?.data],
  );

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
            freshCategoryConnections =
              product.category.category_categoryIdDetail;
          }
          map.set(product.id, {
            consumerType: activePriceEntry?.consumerType,
            vendorDiscount: activePriceEntry?.vendorDiscount,
            vendorDiscountType: activePriceEntry?.vendorDiscountType,
            consumerDiscount: activePriceEntry?.consumerDiscount,
            consumerDiscountType: activePriceEntry?.consumerDiscountType,
            categoryId: categoryId,
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

  return {
    me,
    cartListByDeviceQuery,
    cartListByUser,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    allUserAddressQuery,
    delteAddress,
    preOrderCalculation,
    rfqQuoteDetailsQuery,
    rfqQuoteDetails,
    memoizedCartList,
    memoziedAddressList,
    productPricingInfoMap,
  };
};
