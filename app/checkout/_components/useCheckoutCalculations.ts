"use client";
import { useEffect } from "react";
import { CartItem } from "@/utils/types/cart.types";
import { ProductPricingInfo } from "./checkoutTypes";
import {
  calculateDiscountedPrice,
  getApplicableDiscountedPrice,
} from "./checkoutUtils";

interface CalcDeps {
  cartListByUser: any;
  cartListByDeviceQuery: any;
  allUserAddressQuery: any;
  memoizedCartList: any[];
  productPricingInfoMap: Map<number, ProductPricingInfo>;
  currentTradeRole: string | undefined;
  vendorBusinessCategoryIds: number[];
  invalidProducts: number[];
  notAvailableProducts: number[];
  selectedShippingAddressId: string | null;
  selectedBillingAddressId: string | null;
  shippingInfo: any[];
  shippingErrors: any[];
  setItemsTotal: (v: number) => void;
  setFee: (v: number) => void;
  setSubTotal: (v: number) => void;
  setInvalidProducts: (v: number[]) => void;
  setNotAvailableProducts: (v: number[]) => void;
  setSellerIds: (v: number[]) => void;
  setShippingInfo: (v: any[]) => void;
  setShippingErrors: (v: any[]) => void;
  preOrderCalculation: any;
}

export const useCheckoutCalculations = (deps: CalcDeps) => {
  const {
    cartListByUser,
    cartListByDeviceQuery,
    allUserAddressQuery,
    memoizedCartList,
    productPricingInfoMap,
    currentTradeRole,
    vendorBusinessCategoryIds,
    invalidProducts,
    notAvailableProducts,
    selectedShippingAddressId,
    selectedBillingAddressId,
    shippingInfo,
    shippingErrors,
    setItemsTotal,
    setFee,
    setSubTotal,
    setInvalidProducts,
    setNotAvailableProducts,
    setSellerIds,
    setShippingInfo,
    setShippingErrors,
    preOrderCalculation,
  } = deps;

  const calculateTotalAmount = () => {
    if (cartListByUser.data?.data?.length) {
      setItemsTotal(
        cartListByUser.data?.data?.reduce((acc: number, curr: any) => {
          const productId = curr.productId;
          const isInvalidProduct =
            typeof productId === "number" && invalidProducts.includes(productId);
          const isNotAvailable =
            typeof productId === "number" &&
            notAvailableProducts.includes(productId);
          if (
            curr.cartType === "DEFAULT" &&
            !isInvalidProduct &&
            !isNotAvailable
          ) {
            const discountedPrice = getApplicableDiscountedPrice(
              curr as unknown as CartItem,
              productPricingInfoMap,
              currentTradeRole,
              vendorBusinessCategoryIds,
            );
            return Number((acc + discountedPrice * curr.quantity).toFixed(2));
          }
          if (!curr.cartServiceFeatures?.length) return acc;
          let amount = 0;
          for (const feature of curr.cartServiceFeatures) {
            if (feature.serviceFeature?.serviceCostType === "FLAT") {
              amount +=
                Number(feature.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1);
            } else {
              amount +=
                Number(feature?.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1) *
                curr.service.eachCustomerTime;
            }
          }
          return Number((acc + amount).toFixed(2));
        }, 0),
      );
    } else if (cartListByDeviceQuery.data?.data?.length) {
      setItemsTotal(
        cartListByDeviceQuery.data?.data?.reduce((acc: number, curr: any) => {
          const productId = curr.productId;
          const isInvalidProduct =
            typeof productId === "number" && invalidProducts.includes(productId);
          const isNotAvailable =
            typeof productId === "number" &&
            notAvailableProducts.includes(productId);
          if (
            curr.cartType === "DEFAULT" &&
            !isInvalidProduct &&
            !isNotAvailable
          ) {
            const discountedPrice = calculateDiscountedPrice(
              curr.productPriceDetails?.offerPrice ?? 0,
              Number(
                (curr.productPriceDetails as any)?.consumerDiscount || 0,
              ),
              (curr.productPriceDetails as any)?.consumerDiscountType,
            );
            return Number((acc + discountedPrice * curr.quantity).toFixed(2));
          }
          if (!curr.cartServiceFeatures?.length) return acc;
          let amount = 0;
          for (const feature of curr.cartServiceFeatures) {
            if (feature.serviceFeature?.serviceCostType === "FLAT") {
              amount +=
                Number(feature.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1);
            } else {
              amount +=
                Number(feature?.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1) *
                curr.service.eachCustomerTime;
            }
          }
          return Number((acc + amount).toFixed(2));
        }, 0),
      );
    }
  };

  const calculateFees = async () => {
    const response: any = await preOrderCalculation.mutateAsync({
      cartIds: memoizedCartList
        .filter((item: any) => item.productId)
        ?.map((item: any) => item.id),
      serviceCartIds: memoizedCartList
        .filter((item: any) => item.serviceId)
        ?.map((item: any) => item.id),
      userAddressId: Number(selectedShippingAddressId),
    });

    const invalidProductIds =
      response?.invalidProducts?.map((productId: number) => productId) || [];
    const notAvailableProductIds =
      response?.productCannotBuy?.map((item: any) => item.productId) || [];

    setInvalidProducts(invalidProductIds);
    setNotAvailableProducts(notAvailableProductIds);

    let chargedFee = 0;
    if (response?.data?.length) {
      response.data.forEach((item: any) => {
        if (item.orderProductType !== "SERVICE") {
          chargedFee += Number(item?.breakdown?.customer?.chargedFee);
        }
      });
    }
    setFee(chargedFee);
    calculateTotalAmount();
    setSubTotal(response?.totalCustomerPay || 0);
  };

  // Sync seller IDs, shipping info, and trigger fee calculation on cart change
  useEffect(() => {
    if (memoizedCartList.length) {
      let userIds =
        memoizedCartList
          .filter((item: any) => item.productPriceDetails)
          ?.map((item: any) => item.productPriceDetails.adminId) || [];
      userIds = [...new Set(userIds)];
      setSellerIds(userIds as number[]);
      setShippingInfo(
        (userIds as number[]).map((userId: number) => {
          const info = shippingInfo.find((item) => item.sellerId === userId);
          if (info) return info;
          return {
            sellerId: userId,
            shippingType: "PICKUP",
            info: {
              shippingDate: null,
              fromTime: null,
              toTime: null,
              shippingCharge: 0,
              serviceId: null,
            },
          };
        }),
      );
      setShippingErrors(
        (userIds as number[]).map((userId: number) => {
          const data = shippingErrors.find((item) => item.sellerId === userId);
          if (data) return data;
          return { sellerId: userId, errors: {} };
        }),
      );
      if (selectedShippingAddressId) calculateFees();
    }
  }, [
    cartListByUser.data?.data,
    cartListByDeviceQuery?.data?.data,
    allUserAddressQuery?.data?.data,
    selectedBillingAddressId,
    selectedShippingAddressId,
  ]);

  useEffect(() => {
    calculateTotalAmount();
  }, [
    cartListByUser.data?.data,
    cartListByDeviceQuery?.data?.data,
    invalidProducts,
    notAvailableProducts,
  ]);

  return { calculateTotalAmount, calculateFees };
};
