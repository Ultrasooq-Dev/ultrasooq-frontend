"use client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useEffect, useState } from "react";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { CartItem } from "@/utils/types/cart.types";
import { calculateDiscountedPrice } from "./cartUtils";
import { useCartData } from "./useCartData";

export const useCart = () => {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useDynamicTranslation();
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const data = useCartData();
  const {
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
  } = data;

  const calcForItem = (acc: number, curr: CartItem, isLoggedIn: boolean): number => {
    if (curr.cartType == "DEFAULT") {
      const productPriceDetails: any = curr?.productPriceDetails || {};
      const productInfo = productPricingInfoMap.get(curr.productId);
      const rawConsumerType =
        productInfo?.consumerType || productPriceDetails?.consumerType || "";
      const normalizedConsumerType =
        typeof rawConsumerType === "string" ? rawConsumerType.toUpperCase().trim() : "";
      const isVendorType =
        normalizedConsumerType === "VENDOR" || normalizedConsumerType === "VENDORS";
      const isConsumerType = normalizedConsumerType === "CONSUMER";
      const isEveryoneType = normalizedConsumerType === "EVERYONE";

      const categoryId = Number(productInfo?.categoryId || 0);
      const isCategoryMatch = checkCategoryConnection(
        vendorBusinessCategoryIds,
        categoryId,
        productInfo?.categoryLocation,
        productInfo?.categoryConnections,
      );

      const vendorDiscountValue = Number(
        productInfo?.vendorDiscount ?? productPriceDetails?.vendorDiscount ?? 0,
      );
      const vendorDiscountType =
        productInfo?.vendorDiscountType || productPriceDetails?.vendorDiscountType;
      const normalizedVendorDiscountType = vendorDiscountType
        ? vendorDiscountType.toString().toUpperCase().trim()
        : undefined;

      const consumerDiscountValue = Number(
        productInfo?.consumerDiscount ?? productPriceDetails?.consumerDiscount ?? 0,
      );
      const consumerDiscountType =
        productInfo?.consumerDiscountType || productPriceDetails?.consumerDiscountType;
      const normalizedConsumerDiscountType = consumerDiscountType
        ? consumerDiscountType.toString().toUpperCase().trim()
        : undefined;

      let discount = 0;
      let applicableDiscountType: string | undefined;

      if (isLoggedIn && currentTradeRole && currentTradeRole !== "BUYER") {
        if (isVendorType || isEveryoneType) {
          if (isCategoryMatch) {
            if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
              discount = vendorDiscountValue;
              applicableDiscountType = normalizedVendorDiscountType;
            }
          } else if (isEveryoneType) {
            if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
              discount = consumerDiscountValue;
              applicableDiscountType = normalizedConsumerDiscountType;
            }
          }
        }
      } else {
        if (isConsumerType || isEveryoneType) {
          if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
            discount = consumerDiscountValue;
            applicableDiscountType = normalizedConsumerDiscountType;
          }
        }
      }

      const calculated = calculateDiscountedPrice(
        productPriceDetails?.offerPrice ?? 0,
        discount,
        applicableDiscountType,
      );
      return Number((acc + calculated * curr.quantity).toFixed(2));
    }

    if (!curr.cartServiceFeatures?.length) return acc;

    let amount = 0;
    const cartItemAny = curr as any;
    for (const feature of curr.cartServiceFeatures) {
      if (feature.serviceFeature?.serviceCostType == "FLAT") {
        amount += Number(feature.serviceFeature?.serviceCost || "") * (feature.quantity || 1);
      } else {
        amount +=
          Number(feature?.serviceFeature?.serviceCost || "") *
          (feature.quantity || 1) *
          (cartItemAny.service?.eachCustomerTime || 1);
      }
    }
    return Number((acc + amount).toFixed(2));
  };

  const calculateTotalAmount = () => {
    if (cartListByUser.data?.data?.length) {
      return cartListByUser.data.data.reduce(
        (acc: number, curr: CartItem) => calcForItem(acc, curr, true),
        0,
      );
    } else if (cartListByDeviceQuery.data?.data?.length) {
      return cartListByDeviceQuery.data.data.reduce(
        (acc: number, curr: CartItem) => calcForItem(acc, curr, false),
        0,
      );
    }
    return 0;
  };

  const handleRemoveProductFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      setLoading(true);
      toast({ title: t("item_removed_from_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
    } else {
      toast({ title: t("item_not_removed_from_cart"), description: t("check_your_cart_for_more_details"), variant: "danger" });
    }
  };

  const handleRemoveServiceFromCart = async (cartId: number, serviceFeatureId: number) => {
    const cartItem = memoizedCartList.find((item: any) => item.id == cartId);
    const payload: any = { cartId };
    if (cartItem?.cartServiceFeatures?.length > 1) payload.serviceFeatureId = serviceFeatureId;
    const response = await deleteServiceFromCart.mutateAsync(payload);
    if (response.status) {
      setLoading(true);
      toast({ title: t("item_removed_from_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
    } else {
      toast({ title: response.message || t("item_not_removed_from_cart"), description: response.message || t("check_your_cart_for_more_details"), variant: "danger" });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    const response = await addToWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({ title: t("item_added_to_wishlist"), description: t("check_your_wishlist_for_more_details"), variant: "success" });
    } else {
      toast({ title: response.message || t("item_not_added_to_wishlist"), description: t("check_your_wishlist_for_more_details"), variant: "danger" });
    }
  };

  const handleRecommendedWishlist = async (productId: number, inWishlist: boolean) => {
    if (inWishlist) {
      const response = await deleteFromWishlist.mutateAsync({ productId });
      if (response.status) {
        toast({ title: t("item_removed_from_wishlist"), description: t("check_your_wishlist_for_more_details"), variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["all-products"] });
      }
    } else {
      const response = await addToWishlist.mutateAsync({ productId });
      if (response.status) {
        toast({ title: t("item_added_to_wishlist"), description: t("check_your_wishlist_for_more_details"), variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["all-products"] });
      }
    }
  };

  const handleRecommendedAddToCart = async (quantity: number, productPriceId?: number) => {
    if (!productPriceId) {
      toast({ title: t("something_went_wrong"), description: t("product_price_id_not_found"), variant: "danger" });
      return;
    }
    if (haveAccessToken) {
      const response = await updateCartWithLogin.mutateAsync({ productPriceId, quantity });
      if (response.status) {
        toast({ title: t("item_added_to_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
      }
    } else {
      const response = await updateCartByDevice.mutateAsync({ productPriceId, quantity, deviceId });
      if (response.status) {
        toast({ title: t("item_added_to_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
      }
    }
  };

  useEffect(() => {
    setTotalAmount(calculateTotalAmount());
  }, [memoizedCartList, currentTradeRole, productPricingInfoMap, vendorBusinessCategoryIds]);

  return {
    t,
    langDir,
    currency,
    router,
    translate,
    activeCartTab,
    setActiveCartTab,
    haveAccessToken,
    loading,
    totalAmount,
    memoizedCartList,
    cartListByUser,
    cartListByDeviceQuery,
    cartRecommendationsQuery,
    recommendedProducts,
    currentTradeRole,
    vendorBusinessCategoryIds,
    handleRemoveProductFromCart,
    handleRemoveServiceFromCart,
    handleAddToWishlist,
    handleRecommendedWishlist,
    handleRecommendedAddToCart,
  };
};
