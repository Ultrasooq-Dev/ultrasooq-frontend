import React from "react";
import { calculateCartPricing } from "./cartPricingUtils";

interface UseCartPricingProps {
  currentTradeRole: string | undefined;
  vendorBusinessCategoryIds: number[];
  freshCategoryConnectionsMap: Map<number, any[]>;
  firstCartCategoryId: number | undefined;
}

export function useCartPricing({
  currentTradeRole,
  vendorBusinessCategoryIds,
  freshCategoryConnectionsMap,
  firstCartCategoryId,
}: UseCartPricingProps) {
  const getCartPricing = React.useCallback(
    (productData: any, cartItem: any) => {
      return calculateCartPricing({
        productData,
        cartItem,
        currentTradeRole,
        vendorBusinessCategoryIds,
        freshCategoryConnectionsMap,
        firstCartCategoryId,
      });
    },
    [
      currentTradeRole,
      vendorBusinessCategoryIds,
      freshCategoryConnectionsMap,
      firstCartCategoryId,
    ],
  );

  return { getCartPricing };
}
