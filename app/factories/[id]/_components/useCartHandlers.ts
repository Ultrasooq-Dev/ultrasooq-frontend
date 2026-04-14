"use client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface UseCartHandlersParams {
  productDetails: any;
  haveAccessToken: boolean;
  deviceId: string;
  globalQuantity: number;
  setGlobalQuantity: (q: number) => void;
  setIsVisible: (v: boolean) => void;
  setIsConfirmDialogOpen: (v: boolean) => void;
  setIsCustomizeDialogOpen: (v: boolean) => void;
  selectedProductVariant: any;
  hasItemByUser: boolean;
  hasItemByDevice: boolean;
  getProductQuantityByUser: number;
  getProductQuantityByDevice: number;
  cartListByUser: any;
  cartListByDeviceQuery: any;
  memoizedCartList: any[];
  updateCartWithLogin: any;
  updateCartByDevice: any;
  deleteCartItem: any;
  deleteServiceFromCart: any;
  productQueryById_data_generatedLinkDetail: any;
}

export function useCartHandlers({
  productDetails,
  haveAccessToken,
  deviceId,
  globalQuantity,
  setGlobalQuantity,
  setIsVisible,
  setIsConfirmDialogOpen,
  setIsCustomizeDialogOpen,
  selectedProductVariant,
  hasItemByUser,
  hasItemByDevice,
  getProductQuantityByUser,
  getProductQuantityByDevice,
  cartListByUser,
  cartListByDeviceQuery,
  memoizedCartList,
  updateCartWithLogin,
  updateCartByDevice,
  deleteCartItem,
  deleteServiceFromCart,
  productQueryById_data_generatedLinkDetail,
}: UseCartHandlersParams) {
  const t = useTranslations();
  const { toast } = useToast();

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
        description: t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleRemoveServiceFromCart = async (
    cartId: number,
    serviceFeatureId: number,
  ) => {
    const cartItem = memoizedCartList.find((item: any) => item.id == cartId);
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

  const onConfirmRemove = (productId: number) => {
    const cartId =
      cartListByUser.data?.data?.find(
        (item: any) => item.productId == productId,
      )?.id ||
      cartListByDeviceQuery.data?.data?.find(
        (item: any) => item.productId == productId,
      )?.id;
    if (cartId) handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  const handleAddToCart = async (
    quantity: number,
    actionType: "add" | "remove",
    productVariant?: any,
  ) => {
    if (actionType === "add") {
      const minQuantity =
        productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
      if (minQuantity && minQuantity > quantity) {
        toast({
          description: t("min_quantity_must_be_n", { n: minQuantity }),
          variant: "danger",
        });
        return;
      }
      setIsCustomizeDialogOpen(true);
      return;
    }

    const minQuantity =
      productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
    if (actionType == "remove" && minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      setIsConfirmDialogOpen(true);
      return;
    }

    const maxQuantity =
      productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      return;
    }

    const sharedLinkId = productQueryById_data_generatedLinkDetail?.id;

    if (haveAccessToken) {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: productDetails?.product_productPrice?.[0]?.id,
        quantity,
        sharedLinkId,
        productVariant: productVariant || selectedProductVariant,
      });
      if (response.status) {
        setGlobalQuantity(quantity);
        toast({
          title: t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        setIsVisible(true);
        return response.status;
      }
    } else {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: productDetails?.product_productPrice?.[0]?.id,
        quantity,
        deviceId,
        sharedLinkId,
        productVariant: productVariant || selectedProductVariant,
      });
      if (response.status) {
        setGlobalQuantity(quantity);
        toast({
          title: t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        setIsVisible(true);
        return response.status;
      }
    }
  };

  const handleQuantity = async (quantity: number, action: "add" | "remove") => {
    setGlobalQuantity(quantity);
    const isAddedToCart = hasItemByUser || hasItemByDevice;
    if (isAddedToCart) {
      handleAddToCart(quantity, action);
    } else {
      const minQuantity =
        productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
      const maxQuantity =
        productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;
      if (minQuantity && minQuantity > quantity) {
        toast({
          description: t("min_quantity_must_be_n", { n: minQuantity }),
          variant: "danger",
        });
        return;
      }
      if (maxQuantity && maxQuantity < quantity) {
        toast({
          description: t("max_quantity_must_be_n", { n: maxQuantity }),
          variant: "danger",
        });
        return;
      }
    }
  };

  const selectProductVariant = (
    variant: any,
    setSelectedProductVariant: (v: any) => void,
  ) => {
    setSelectedProductVariant(variant);
    if (getProductQuantityByDevice > 0 || getProductQuantityByUser > 0) {
      handleAddToCart(globalQuantity, "add", variant);
    }
  };

  return {
    handleRemoveItemFromCart,
    handleRemoveServiceFromCart,
    onConfirmRemove,
    handleAddToCart,
    handleQuantity,
    selectProductVariant,
  };
}
