import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface UseCartActionsParams {
  productDetails: any;
  haveAccessToken: boolean;
  deviceId: string;
  globalQuantity: number;
  setGlobalQuantity: (q: number) => void;
  selectedProductVariant: any;
  memoizedCartList: any[];
  cartListByUser: any;
  cartListByDeviceQuery: any;
  productQueryById: any;
  setIsConfirmDialogOpen: (open: boolean) => void;
  setIsVisible: (visible: boolean) => void;
  getProductQuantityByUser: number | undefined;
  getProductQuantityByDevice: number | undefined;
  updateCartWithLogin: any;
  updateCartByDevice: any;
  deleteCartItem: any;
  deleteServiceFromCart: any;
}

export function useCartActions({
  productDetails,
  haveAccessToken,
  deviceId,
  globalQuantity,
  setGlobalQuantity,
  selectedProductVariant,
  memoizedCartList,
  cartListByUser,
  cartListByDeviceQuery,
  productQueryById,
  setIsConfirmDialogOpen,
  setIsVisible,
  getProductQuantityByUser,
  getProductQuantityByDevice,
  updateCartWithLogin,
  updateCartByDevice,
  deleteCartItem,
  deleteServiceFromCart,
}: UseCartActionsParams) {
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();

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

  const handleAddToCart = async (
    quantity: number,
    actionType: "add" | "remove",
    productVariant?: any,
  ) => {
    const minQuantity =
      productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
    if (actionType == "add" && minQuantity && minQuantity > quantity) {
      toast({ description: t("min_quantity_must_be_n", { n: minQuantity }), variant: "danger" });
      return;
    }
    if (actionType == "remove" && minQuantity && minQuantity > quantity) {
      toast({ description: t("min_quantity_must_be_n", { n: minQuantity }), variant: "danger" });
      setIsConfirmDialogOpen(true);
      return;
    }
    const maxQuantity =
      productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;
    if (maxQuantity && maxQuantity < quantity) {
      toast({ description: t("max_quantity_must_be_n", { n: maxQuantity }), variant: "danger" });
      return;
    }

    const sharedLinkId = productQueryById?.data?.generatedLinkDetail?.id;

    if (haveAccessToken) {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({ title: t("something_went_wrong"), description: t("product_price_id_not_found"), variant: "danger" });
        return;
      }
      if (actionType == "add" && quantity == 0) {
        quantity = minQuantity ?? 1;
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
          title: actionType == "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        setIsVisible(true);
        return response.status;
      }
    } else {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({ title: t("something_went_wrong"), description: t("product_price_id_not_found"), variant: "danger" });
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
          title: actionType == "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
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
    const isAddedToCart =
      !!cartListByUser.data?.data?.find((item: any) => item.productId === Number(productDetails?.id)) ||
      !!cartListByDeviceQuery.data?.data?.find((item: any) => item.productId === Number(productDetails?.id));
    if (isAddedToCart) {
      handleAddToCart(quantity, action);
    } else {
      const minQuantity = productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
      const maxQuantity = productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;
      if (minQuantity && minQuantity > quantity) {
        toast({ description: t("min_quantity_must_be_n", { n: minQuantity }), variant: "danger" });
        return;
      }
      if (maxQuantity && maxQuantity < quantity) {
        toast({ description: t("max_quantity_must_be_n", { n: maxQuantity }), variant: "danger" });
        return;
      }
    }
  };

  const handleCartPage = async () => {
    if ((getProductQuantityByUser || 0) >= 1 || (getProductQuantityByDevice || 0) >= 1) {
      router.push("/cart");
      return;
    }
    let quantity = globalQuantity;
    if (quantity == 0) {
      const minQuantity = productDetails?.product_productPrice?.length
        ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
    }
    const response = await handleAddToCart(quantity, "add");
    if (response) {
      setTimeout(() => { router.push("/cart"); }, 2000);
    }
  };

  const handleCheckoutPage = async () => {
    if ((getProductQuantityByUser || 0) >= 1 || (getProductQuantityByDevice || 0) >= 1) {
      router.push("/checkout");
      return;
    }
    let quantity = globalQuantity;
    if (quantity == 0) {
      const minQuantity = productDetails?.product_productPrice?.length
        ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
    }
    const response = await handleAddToCart(quantity, "add");
    if (response) {
      setTimeout(() => { router.push("/checkout"); }, 2000);
    }
  };

  const handelOpenCartLayout = () => { setIsVisible(true); };

  return {
    handleRemoveItemFromCart,
    handleRemoveServiceFromCart,
    handleAddToCart,
    handleQuantity,
    handleCartPage,
    handleCheckoutPage,
    handelOpenCartLayout,
  };
}
