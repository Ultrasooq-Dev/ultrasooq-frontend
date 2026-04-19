"use client";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";

interface HandlerDeps {
  haveAccessToken: boolean;
  deviceId: string;
  memoizedCartList: any[];
  selectedCartId: number | undefined;
  setIsConfirmDialogOpen: (v: boolean) => void;
  setSelectedCartId: (v: number | undefined) => void;
  updateCartWithLogin: any;
  updateCartByDevice: any;
  deleteCartItem: any;
  deleteServiceFromCart: any;
  addToWishlist: any;
  delteAddress: any;
}

export const useCheckoutHandlers = (deps: HandlerDeps) => {
  const t = useTranslations();
  const { toast } = useToast();

  const {
    haveAccessToken,
    deviceId,
    memoizedCartList,
    selectedCartId,
    setIsConfirmDialogOpen,
    setSelectedCartId,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    delteAddress,
  } = deps;

  const handleAddToCart = async (
    quantity: number,
    actionType: "add" | "remove",
    productPriceId: number,
    productVariant?: any,
  ) => {
    if (haveAccessToken) {
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId,
        quantity,
        productVariant,
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
        productPriceId,
        quantity,
        deviceId,
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

  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const onConfirmRemove = () => {
    if (selectedCartId) handleRemoveItemFromCart(selectedCartId);
    setIsConfirmDialogOpen(false);
    setSelectedCartId(undefined);
  };

  const onCancelRemove = () => {
    setIsConfirmDialogOpen(false);
    setSelectedCartId(undefined);
  };

  const handleRemoveServiceFromCart = async (
    cartId: number,
    serviceFeatureId: number,
  ) => {
    const cartItem = memoizedCartList.find((item: any) => item.id === cartId);
    const payload: any = { cartId };
    if (cartItem?.cartServiceFeatures?.length > 1) {
      payload.serviceFeatureId = serviceFeatureId;
    }
    const response = await deleteServiceFromCart.mutateAsync(payload);
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_removed_from_cart"),
        description: response.message || t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleDeleteAddress = async (userAddressId: number) => {
    const response = await delteAddress.mutateAsync({ userAddressId });
    if (response.status) {
      toast({
        title: t("address_removed"),
        description: t("check_your_address_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: t("item_not_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    const response = await addToWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  return {
    handleAddToCart,
    handleRemoveItemFromCart,
    onConfirmRemove,
    onCancelRemove,
    handleRemoveServiceFromCart,
    handleDeleteAddress,
    handleAddToWishlist,
  };
};
