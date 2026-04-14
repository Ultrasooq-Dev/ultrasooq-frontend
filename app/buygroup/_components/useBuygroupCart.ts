"use client";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

interface UseBuygroupCartOptions {
  deviceId: string;
  haveAccessToken: boolean;
  memoizedProductList: any[];
  currentTradeRole?: string;
}

export function useBuygroupCart({
  deviceId,
  haveAccessToken,
  memoizedProductList,
  currentTradeRole,
}: UseBuygroupCartOptions) {
  const t = useTranslations();
  const { currency } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const deleteCartItem = useDeleteCartItem();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();

  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
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
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
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
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
      }
    }
  };

  const getCartPricing = React.useCallback(
    (productData: any, cartItem: any) => {
      if (!cartItem) {
        return {
          unitPrice: 0,
          totalPrice: 0,
          originalUnitPrice: 0,
          originalTotalPrice: 0,
        };
      }

      const quantity = Number(cartItem?.quantity) || 1;
      const cartPriceDetails = cartItem?.productPriceDetails || {};

      let unitPrice = 0;
      if (cartItem.cartType === "DEFAULT" && cartPriceDetails) {
        const offerPrice = Number(cartPriceDetails.offerPrice || 0);
        let discount = 0;
        let discountType: string | undefined;

        if (currentTradeRole && currentTradeRole !== "BUYER") {
          discount = Number(cartPriceDetails.vendorDiscount || 0);
          discountType = cartPriceDetails.vendorDiscountType;
        } else {
          discount = Number(cartPriceDetails.consumerDiscount || 0);
          discountType = cartPriceDetails.consumerDiscountType;
        }

        if (discount > 0 && discountType) {
          const normalizedDiscountType = discountType.toUpperCase().trim();
          if (normalizedDiscountType === "PERCENTAGE") {
            unitPrice = offerPrice * (1 - discount / 100);
          } else if (
            normalizedDiscountType === "AMOUNT" ||
            normalizedDiscountType === "FLAT" ||
            normalizedDiscountType === "FIXED"
          ) {
            unitPrice = offerPrice - discount;
          } else {
            unitPrice = offerPrice;
          }
        } else {
          unitPrice = offerPrice;
        }
      } else {
        unitPrice = Number(
          cartPriceDetails?.offerPrice || cartItem.productPrice || 0,
        );
      }

      const totalPrice = Number((unitPrice * quantity).toFixed(2));
      const originalUnitPrice = Number(
        cartPriceDetails?.price || cartPriceDetails?.basePrice || unitPrice,
      );
      const originalTotalPrice = Number(
        (originalUnitPrice * quantity).toFixed(2),
      );

      return {
        unitPrice: Number(unitPrice.toFixed(2)),
        totalPrice,
        originalUnitPrice,
        originalTotalPrice,
      };
    },
    [currentTradeRole],
  );

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
    getCartPricing,
    handleRemoveItemFromCart,
    handleUpdateCartQuantity,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
  };
}
