"use client";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { useOrderStore } from "@/lib/orderStore";
import { CartItem } from "@/utils/types/cart.types";
import { validateShippingInfo, prepareShippingInfo } from "./checkoutUtils";
import { ShippingInfoItem, ShippingErrorItem } from "./checkoutTypes";

interface OrderSubmitDeps {
  haveAccessToken: boolean;
  memoizedCartList: any[];
  memoziedAddressList: any[];
  selectedOrderDetails: any;
  selectedShippingAddressId: string | null;
  shippingInfo: ShippingInfoItem[];
  shippingErrors: ShippingErrorItem[];
  shippingCharge: number;
  totalAmount: number;
  invalidProducts: number[];
  notAvailableProducts: number[];
  isFromRfq: boolean;
  rfqQuoteData: any;
  setShippingErrors: (v: ShippingErrorItem[]) => void;
  router: any;
}

export const useCheckoutOrderSubmit = (deps: OrderSubmitDeps) => {
  const t = useTranslations();
  const { toast } = useToast();
  const orderStore = useOrderStore();

  const {
    haveAccessToken,
    memoizedCartList,
    memoziedAddressList,
    selectedOrderDetails,
    selectedShippingAddressId,
    shippingInfo,
    shippingErrors,
    shippingCharge,
    totalAmount,
    invalidProducts,
    notAvailableProducts,
    isFromRfq,
    rfqQuoteData,
    setShippingErrors,
    router,
  } = deps;

  const onSaveOrder = () => {
    if (invalidProducts.length > 0 || notAvailableProducts.length > 0) {
      toast({
        description: t("remove_n_items_from_cart", {
          n: invalidProducts.length + notAvailableProducts.length,
        }),
        variant: "danger",
      });
      return;
    }

    if (!validateShippingInfo(shippingInfo, shippingErrors, setShippingErrors)) {
      toast({
        title: t("shipping_error"),
        description: t("shipping_data_has_errors"),
        variant: "danger",
      });
      return;
    }

    if (haveAccessToken) {
      if (!selectedOrderDetails?.shippingAddress) {
        toast({
          title: t("please_select_a_shipping_address"),
          variant: "danger",
        });
        return;
      }

      const data: any = {
        ...selectedOrderDetails,
        cartIds: isFromRfq
          ? []
          : memoizedCartList
              ?.filter((item: any) => item.productId)
              ?.map((item: CartItem) => item.id) || [],
        serviceCartIds:
          memoizedCartList
            ?.filter((item: any) => item.serviceId)
            ?.map((item: CartItem) => item.id) || [],
        deliveryCharge: shippingCharge,
        shipping: prepareShippingInfo(shippingInfo, memoizedCartList),
        ...(isFromRfq && rfqQuoteData
          ? {
              rfqQuotesUserId: rfqQuoteData.rfqQuotesUserId,
              rfqQuotesId: rfqQuoteData.rfqQuotesId,
              sellerId: rfqQuoteData.sellerId,
              buyerId: rfqQuoteData.buyerId,
              rfqQuoteProducts: rfqQuoteData.quoteProducts || [],
              rfqSuggestedProducts: rfqQuoteData.suggestedProducts || [],
            }
          : {}),
      };

      if (!data.billingAddress && selectedOrderDetails?.billingAddress) {
        data.billingAddress = selectedOrderDetails.billingAddress;
        data.billingCity = selectedOrderDetails.billingCity;
        data.billingProvince = selectedOrderDetails.billingProvince;
        data.billingCountry = selectedOrderDetails.billingCountry;
        data.billingPostCode = selectedOrderDetails.billingPostCode;
      }

      if (!data.billingAddress) {
        toast({
          title: t("billing_address_required_from_profile"),
          variant: "danger",
        });
        return;
      }

      const address = memoziedAddressList.find(
        (item: any) => item.id === Number(selectedShippingAddressId),
      );

      orderStore.setOrders({
        ...data,
        countryId: address?.countryId,
        stateId: address?.stateId,
        cityId: address?.cityId,
        town: address?.town,
        userAddressId: Number(selectedShippingAddressId),
      });
      orderStore.setTotal(totalAmount);
      router.push("/complete-order");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  return { onSaveOrder };
};
