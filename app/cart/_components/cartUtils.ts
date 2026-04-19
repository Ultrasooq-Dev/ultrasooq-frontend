import { checkCategoryConnection } from "@/utils/categoryConnection";
import { PromotionalProductPriceResult } from "./cartTypes";

export const calculateDiscountedPrice = (
  offerPrice: string | number,
  discount: number,
  discountType?: string,
): number => {
  const price = offerPrice ? Number(offerPrice) : 0;
  if (discountType == "PERCENTAGE") {
    return Number((price - (price * discount) / 100).toFixed(2));
  } else if (discountType == "FIXED" || discountType == "FLAT") {
    return Number((price - discount).toFixed(2));
  }
  // If no discount type is specified, treat as fixed discount
  return Number((price - discount).toFixed(2));
};

export const getPromotionalProductPrice = (
  product: any,
  currentTradeRole: string | undefined,
  vendorBusinessCategoryIds: number[],
): PromotionalProductPriceResult => {
  const offerPrice = product.offerPrice || 0;
  const rawConsumerType = product.consumerType || "";
  const normalizedConsumerType =
    typeof rawConsumerType === "string"
      ? rawConsumerType.toUpperCase().trim()
      : "";
  const isVendorType =
    normalizedConsumerType === "VENDOR" ||
    normalizedConsumerType === "VENDORS";
  const isConsumerType = normalizedConsumerType === "CONSUMER";
  const isEveryoneType = normalizedConsumerType === "EVERYONE";

  const categoryId = Number(product.categoryId || 0);
  const categoryLocation = product.categoryLocation;
  const categoryConnections = product.categoryConnections || [];

  const isCategoryMatch = checkCategoryConnection(
    vendorBusinessCategoryIds,
    categoryId,
    categoryLocation,
    categoryConnections,
  );

  const vendorDiscountValue = Number(product.vendorDiscount || 0);
  const vendorDiscountType = product.vendorDiscountType;
  const normalizedVendorDiscountType = vendorDiscountType
    ? vendorDiscountType.toString().toUpperCase().trim()
    : undefined;

  const consumerDiscountValue = Number(product.consumerDiscount || 0);
  const consumerDiscountType = product.consumerDiscountType;
  const normalizedConsumerDiscountType = consumerDiscountType
    ? consumerDiscountType.toString().toUpperCase().trim()
    : undefined;

  let discount = 0;
  let applicableDiscountType: string | undefined;

  if (currentTradeRole && currentTradeRole !== "BUYER") {
    // VENDOR user
    if (isVendorType || isEveryoneType) {
      if (isCategoryMatch) {
        if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
          discount = vendorDiscountValue;
          applicableDiscountType = normalizedVendorDiscountType;
        }
      } else {
        if (isEveryoneType) {
          if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
            discount = consumerDiscountValue;
            applicableDiscountType = normalizedConsumerDiscountType;
          }
        }
      }
    }
  } else {
    // CONSUMER (BUYER)
    if (isConsumerType || isEveryoneType) {
      if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
        discount = consumerDiscountValue;
        applicableDiscountType = normalizedConsumerDiscountType;
      }
    }
  }

  const discountedPrice = calculateDiscountedPrice(
    offerPrice,
    discount,
    applicableDiscountType,
  );

  return {
    originalPrice: offerPrice,
    discountedPrice,
    hasDiscount: discount > 0,
  };
};
