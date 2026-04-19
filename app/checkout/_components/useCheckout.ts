"use client";
import { useAuth } from "@/context/AuthContext";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useCheckoutQueries } from "./useCheckoutQueries";
import { useCheckoutState } from "./useCheckoutState";
import { useCheckoutCalculations } from "./useCheckoutCalculations";
import { useCheckoutHandlers } from "./useCheckoutHandlers";
import { useCheckoutOrderSubmit } from "./useCheckoutOrderSubmit";

export const useCheckout = () => {
  const { user, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const vendorBusinessCategoryIds = useVendorBusinessCategories() ?? [];
  const deviceId = getOrCreateDeviceId() || "";

  // Bootstrap queries before state so we can pass meData to state
  const bootstrapQueries = useCheckoutQueries(
    false,
    deviceId,
    null,
    false,
    currentTradeRole,
  );

  const state = useCheckoutState(
    bootstrapQueries.me.data,
    bootstrapQueries.memoziedAddressList,
  );

  // Live queries with real haveAccessToken
  const liveQueries = useCheckoutQueries(
    state.haveAccessToken,
    deviceId,
    state.rfqQuoteData,
    state.isFromRfq,
    currentTradeRole,
  );

  const {
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
  } = liveQueries;

  useCheckoutCalculations({
    cartListByUser,
    cartListByDeviceQuery,
    allUserAddressQuery,
    memoizedCartList,
    productPricingInfoMap,
    currentTradeRole,
    vendorBusinessCategoryIds,
    invalidProducts: state.invalidProducts,
    notAvailableProducts: state.notAvailableProducts,
    selectedShippingAddressId: state.selectedShippingAddressId,
    selectedBillingAddressId: state.selectedBillingAddressId,
    shippingInfo: state.shippingInfo,
    shippingErrors: state.shippingErrors,
    setItemsTotal: state.setItemsTotal,
    setFee: state.setFee,
    setSubTotal: state.setSubTotal,
    setInvalidProducts: state.setInvalidProducts,
    setNotAvailableProducts: state.setNotAvailableProducts,
    setSellerIds: state.setSellerIds,
    setShippingInfo: state.setShippingInfo,
    setShippingErrors: state.setShippingErrors,
    preOrderCalculation,
  });

  const handlers = useCheckoutHandlers({
    haveAccessToken: state.haveAccessToken,
    deviceId,
    memoizedCartList,
    selectedCartId: state.selectedCartId,
    setIsConfirmDialogOpen: state.setIsConfirmDialogOpen,
    setSelectedCartId: state.setSelectedCartId,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
    addToWishlist,
    delteAddress,
  });

  const { onSaveOrder } = useCheckoutOrderSubmit({
    haveAccessToken: state.haveAccessToken,
    memoizedCartList,
    memoziedAddressList,
    selectedOrderDetails: state.selectedOrderDetails,
    selectedShippingAddressId: state.selectedShippingAddressId,
    shippingInfo: state.shippingInfo,
    shippingErrors: state.shippingErrors,
    shippingCharge: state.shippingCharge,
    totalAmount: state.totalAmount,
    invalidProducts: state.invalidProducts,
    notAvailableProducts: state.notAvailableProducts,
    isFromRfq: state.isFromRfq,
    rfqQuoteData: state.rfqQuoteData,
    setShippingErrors: state.setShippingErrors,
    router: state.router,
  });

  return {
    currency,
    me,
    ...state,
    memoizedCartList,
    memoziedAddressList,
    productPricingInfoMap,
    updateCartByDevice,
    updateCartWithLogin,
    cartListByDeviceQuery,
    cartListByUser,
    allUserAddressQuery,
    preOrderCalculation,
    rfqQuoteDetailsQuery,
    rfqQuoteDetails,
    ...handlers,
    onSaveOrder,
  };
};
