"use client";

interface UseNavigationHandlersParams {
  productDetails: any;
  globalQuantity: number;
  getProductQuantityByUser: number;
  getProductQuantityByDevice: number;
  router: any;
  setIsVisible: (v: boolean) => void;
  handleAddToCart: (
    quantity: number,
    actionType: "add" | "remove",
    productVariant?: any,
  ) => Promise<any>;
}

export function useNavigationHandlers({
  productDetails,
  globalQuantity,
  getProductQuantityByUser,
  getProductQuantityByDevice,
  router,
  setIsVisible,
  handleAddToCart,
}: UseNavigationHandlersParams) {
  const handleCartPage = async () => {
    if (
      (getProductQuantityByUser || 0) >= 1 ||
      (getProductQuantityByDevice || 0) >= 1
    ) {
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
    if (
      (getProductQuantityByUser || 0) >= 1 ||
      (getProductQuantityByDevice || 0) >= 1
    ) {
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

  return { handleCartPage, handleCheckoutPage, handelOpenCartLayout };
}
