import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useTranslations } from "next-intl";
import { useCartPricing } from "./useCartPricing";
import { useWishlistActions } from "./useWishlistActions";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAuth } from "@/context/AuthContext";

interface UseCartDataProps {
  haveAccessToken: boolean;
  deviceId: string;
  meDataId: number | undefined;
  memoizedProductList: any[];
}

export function useCartData({
  haveAccessToken,
  deviceId,
  meDataId,
  memoizedProductList,
}: UseCartDataProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const vendorBusinessCategoryIds = useVendorBusinessCategories();

  const deleteCartItem = useDeleteCartItem();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();

  const { handleAddToWishlist } = useWishlistActions({ meDataId });

  const [cartList, setCartList] = useState<any[]>([]);

  const cartListByDeviceQuery = useCartListByDevice(
    { page: 1, limit: 100, deviceId },
    !haveAccessToken,
  );

  const cartListByUser = useCartListByUserId(
    { page: 1, limit: 100 },
    haveAccessToken,
  );

  useEffect(() => {
    if (cartListByUser.data?.data) {
      setCartList((cartListByUser.data?.data || []).map((item: any) => item));
    } else if (cartListByDeviceQuery.data?.data) {
      setCartList(
        (cartListByDeviceQuery.data?.data || []).map((item: any) => item),
      );
    }
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: t("item_not_removed_from_cart"),
        description: response.message || t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleUpdateCartQuantity = async (
    cartItem: any,
    newQuantity: number,
    actionType: "add" | "remove",
  ) => {
    if (newQuantity <= 0) {
      handleRemoveItemFromCart(cartItem.id);
      return;
    }

    if (haveAccessToken) {
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: cartItem.productPriceDetails?.id,
        quantity: newQuantity,
        productVariant: cartItem.object,
      });
      if (response.status) {
        toast({
          title:
            actionType === "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      }
    } else {
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: cartItem.productPriceDetails?.id,
        quantity: newQuantity,
        deviceId,
        productVariant: cartItem.object,
      });
      if (response.status) {
        toast({
          title:
            actionType === "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      }
    }
  };

  const uniqueCartCategoryIds = useMemo(() => {
    const categoryIds = new Set<number>();
    cartList.forEach((cartItem: any) => {
      const productData = memoizedProductList.find(
        (product: any) => product.id === cartItem.productId,
      );
      if (productData?.categoryId) {
        categoryIds.add(productData.categoryId);
      }
    });
    return Array.from(categoryIds);
  }, [cartList, memoizedProductList]);

  const firstCartCategoryId =
    uniqueCartCategoryIds.length > 0 ? uniqueCartCategoryIds[0] : undefined;

  const firstCartCategoryQuery = useCategory(
    firstCartCategoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && firstCartCategoryId),
  );

  const freshCategoryConnectionsMap = useMemo(() => {
    const map = new Map<number, any[]>();
    if (
      firstCartCategoryId &&
      firstCartCategoryQuery?.data?.data?.category_categoryIdDetail
    ) {
      map.set(
        firstCartCategoryId,
        firstCartCategoryQuery.data.data.category_categoryIdDetail,
      );
    }
    return map;
  }, [firstCartCategoryId, firstCartCategoryQuery?.data?.data]);

  const { getCartPricing } = useCartPricing({
    currentTradeRole,
    vendorBusinessCategoryIds,
    freshCategoryConnectionsMap,
    firstCartCategoryId,
  });

  const cartSubtotal = useMemo(() => {
    return cartList.reduce((total: number, cartItem: any) => {
      const productData = memoizedProductList.find(
        (product: any) => product.id === cartItem.productId,
      );
      const pricing = getCartPricing(productData, cartItem);
      return total + pricing.totalPrice;
    }, 0);
  }, [cartList, memoizedProductList, getCartPricing]);

  return {
    cartList,
    cartSubtotal,
    deleteCartItem,
    updateCartWithLogin,
    updateCartByDevice,
    getCartPricing,
    handleRemoveItemFromCart,
    handleUpdateCartQuantity,
    handleAddToWishlist,
  };
}
