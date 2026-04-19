import { CartItem } from "@/utils/types/cart.types";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { ProductPricingInfo, ShippingInfoItem, ShippingErrorItem } from "./checkoutTypes";

export const calculateDiscountedPrice = (
  offerPrice: string | number,
  discount: number,
  discountType?: string,
): number => {
  const price = offerPrice ? Number(offerPrice) : 0;
  if (!price) return 0;

  if (discount > 0 && discountType) {
    const normalizedType = discountType.toString().toUpperCase().trim();
    if (normalizedType === "PERCENTAGE") {
      return Number((price - (price * discount) / 100).toFixed(2));
    }
    if (
      normalizedType === "FIXED" ||
      normalizedType === "FLAT" ||
      normalizedType === "AMOUNT"
    ) {
      return Number((price - discount).toFixed(2));
    }
  }

  return price;
};

export const getApplicableDiscountedPrice = (
  cartItem: CartItem,
  productPricingInfoMap: Map<number, ProductPricingInfo>,
  currentTradeRole: string | undefined,
  vendorBusinessCategoryIds: number[],
): number => {
  const productPriceDetails: any = cartItem.productPriceDetails || {};
  const productInfo = productPricingInfoMap.get(cartItem.productId);

  const rawConsumerType =
    productInfo?.consumerType || productPriceDetails?.consumerType || "";
  const consumerType =
    typeof rawConsumerType === "string"
      ? rawConsumerType.toUpperCase().trim()
      : "";

  const isVendorType = consumerType === "VENDOR" || consumerType === "VENDORS";
  const isConsumerType = consumerType === "CONSUMER";
  const isEveryoneType = consumerType === "EVERYONE";

  const categoryId = Number(productInfo?.categoryId || 0);
  const categoryLocation = productInfo?.categoryLocation;
  const categoryConnections = productInfo?.categoryConnections || [];

  const isCategoryMatch = checkCategoryConnection(
    vendorBusinessCategoryIds,
    categoryId,
    categoryLocation,
    categoryConnections,
  );

  const vendorDiscountValue = Number(
    productInfo?.vendorDiscount ?? productPriceDetails?.vendorDiscount ?? 0
  );
  const vendorDiscountType = productInfo?.vendorDiscountType || productPriceDetails?.vendorDiscountType;
  const normalizedVendorDiscountType = vendorDiscountType
    ? vendorDiscountType.toString().toUpperCase().trim()
    : undefined;

  const consumerDiscountValue = Number(
    productInfo?.consumerDiscount ?? productPriceDetails?.consumerDiscount ?? 0
  );
  const consumerDiscountType = productInfo?.consumerDiscountType || productPriceDetails?.consumerDiscountType;
  const normalizedConsumerDiscountType = consumerDiscountType
    ? consumerDiscountType.toString().toUpperCase().trim()
    : undefined;

  let discount = 0;
  let discountType: string | undefined;

  if (currentTradeRole && currentTradeRole !== "BUYER") {
    if (isVendorType || isEveryoneType) {
      if (isCategoryMatch) {
        if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
          discount = vendorDiscountValue;
          discountType = normalizedVendorDiscountType;
        } else {
          discount = 0;
        }
      } else {
        if (isEveryoneType) {
          if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
            discount = consumerDiscountValue;
            discountType = normalizedConsumerDiscountType;
          } else {
            discount = 0;
          }
        } else {
          discount = 0;
        }
      }
    } else {
      discount = 0;
    }
  } else {
    if (isConsumerType || isEveryoneType) {
      if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
        discount = consumerDiscountValue;
        discountType = normalizedConsumerDiscountType;
      }
    } else {
      discount = 0;
    }
  }

  return calculateDiscountedPrice(
    productPriceDetails?.offerPrice ?? 0,
    discount,
    discountType,
  );
};

export const shippingOptions = (t: (key: string) => string) => [
  { value: "PICKUP", label: t("consumer_pickup") },
  { value: "SELLERDROP", label: t("delivery_by_seller") },
  { value: "THIRDPARTY", label: t("third_party") },
];

export const validateShippingInfo = (
  shippingInfo: ShippingInfoItem[],
  shippingErrors: ShippingErrorItem[],
  setShippingErrors: (errors: ShippingErrorItem[]) => void,
): boolean => {
  let count = 0;
  const errors = shippingErrors;
  let i = 0;
  for (const info of shippingInfo) {
    errors[i].errors = {};

    if (info.shippingType === "SELLERDROP") {
      if (!info?.info?.serviceId) {
        errors[i]["errors"]["serviceId"] = "Shipping service is required";
      }
      count += Object.keys(errors[i]["errors"]).length > 0 ? 1 : 0;
    }

    i++;
  }

  setShippingErrors([...errors]);
  return count === 0;
};

export const prepareShippingInfo = (
  shippingInfo: ShippingInfoItem[],
  memoizedCartList: any[],
): any[] => {
  const data: any[] = [];
  let i = 0;
  for (const info of shippingInfo) {
    data[i] = {
      sellerId: info.sellerId,
      orderShippingType: info.shippingType,
      shippingDate: null,
      fromTime: null,
      toTime: null,
      shippingCharge: 0,
      serviceId: null,
    };

    if (info.shippingType === "SELLERDROP") {
      data[i].shippingCharge = info.info.shippingCharge;
      data[i].serviceId = info.info.serviceId;
    }

    i++;
  }

  const serviceSellerIds = memoizedCartList
    .filter((item: any) => item.serviceId)
    ?.map((item: any) => item.service.sellerId) || [];

  for (const sellerId of serviceSellerIds) {
    if (!data.find((item: any) => item.sellerId === sellerId)) {
      data[i] = {
        sellerId: sellerId,
        orderShippingType: "PICKUP",
        shippingDate: null,
        fromTime: null,
        toTime: null,
        shippingCharge: 0,
        serviceId: null,
      };
    }
  }

  return data;
};
