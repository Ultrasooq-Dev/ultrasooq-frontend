import { checkCategoryConnection } from "@/utils/categoryConnection";
import { CartPricingParams, CartPricingResult } from "./trendingTypes";

export function calculateCartPricing({
  productData,
  cartItem,
  currentTradeRole,
  vendorBusinessCategoryIds,
  freshCategoryConnectionsMap,
  firstCartCategoryId,
}: CartPricingParams): CartPricingResult {
  if (!cartItem) {
    return { unitPrice: 0, totalPrice: 0, originalUnitPrice: 0, originalTotalPrice: 0 };
  }

  const quantity = Number(cartItem?.quantity) || 1;
  const cartPriceDetails = cartItem?.productPriceDetails || {};

  if (!productData && cartPriceDetails) {
    return calculateSimplePricing(cartPriceDetails, quantity, currentTradeRole);
  }

  let originalPrice = resolveOriginalPrice(productData, cartItem, cartPriceDetails);

  const rawConsumerType =
    productData?.consumerType ||
    cartItem?.productPriceDetails?.consumerType ||
    "CONSUMER";
  const consumerType =
    typeof rawConsumerType === "string"
      ? rawConsumerType.toUpperCase().trim()
      : "CONSUMER";

  const isVendorType = consumerType === "VENDOR" || consumerType === "VENDORS";
  const isConsumerType = consumerType === "CONSUMER";
  const isEveryoneType = consumerType === "EVERYONE";

  const categoryId = Number(productData?.categoryId || 0);
  const categoryLocation = productData?.categoryLocation;

  let categoryConnections = productData?.categoryConnections || [];
  if (categoryId === firstCartCategoryId && freshCategoryConnectionsMap.has(categoryId)) {
    categoryConnections = freshCategoryConnectionsMap.get(categoryId) || [];
  }

  const isCategoryMatch = checkCategoryConnection(
    vendorBusinessCategoryIds,
    categoryId,
    categoryLocation,
    categoryConnections,
  );

  const vendorDiscountValue = Number(
    productData?.vendorDiscount ?? cartItem?.productPriceDetails?.vendorDiscount ?? 0,
  );
  const vendorDiscountType =
    productData?.vendorDiscountType || cartItem?.productPriceDetails?.vendorDiscountType;

  const consumerDiscountValue = Number(
    productData?.consumerDiscount ?? cartItem?.productPriceDetails?.consumerDiscount ?? 0,
  );
  const consumerDiscountType =
    productData?.consumerDiscountType || cartItem?.productPriceDetails?.consumerDiscountType;

  let discount = 0;
  let discountType: string | undefined;

  if (currentTradeRole && currentTradeRole !== "BUYER") {
    if (isVendorType || isEveryoneType) {
      if (isCategoryMatch) {
        if (vendorDiscountValue > 0 && vendorDiscountType) {
          discount = vendorDiscountValue;
          discountType = vendorDiscountType;
        }
      } else if (isEveryoneType && consumerDiscountValue > 0 && consumerDiscountType) {
        discount = consumerDiscountValue;
        discountType = consumerDiscountType;
      }
    }
  } else {
    if (isConsumerType || isEveryoneType) {
      if (consumerDiscountValue > 0 && consumerDiscountType) {
        discount = consumerDiscountValue;
        discountType = consumerDiscountType;
      }
    }
  }

  let finalPrice = applyDiscount(originalPrice, discount, discountType);

  const backendOfferPrice = Number(
    cartPriceDetails?.offerPrice ?? cartItem?.offerPrice ?? 0,
  );
  const backendOriginalPrice = Number(
    cartPriceDetails?.price ?? cartPriceDetails?.basePrice ?? 0,
  );

  if (!productData && backendOfferPrice > 0) {
    finalPrice = applyDiscountFromCart(
      backendOfferPrice,
      cartPriceDetails,
      currentTradeRole,
    );
  } else if (backendOfferPrice > 0) {
    finalPrice = finalPrice > 0 ? Math.min(finalPrice, backendOfferPrice) : backendOfferPrice;
  }

  if (backendOriginalPrice > 0) {
    originalPrice =
      originalPrice > 0
        ? Math.max(originalPrice, backendOriginalPrice)
        : backendOriginalPrice;
  }

  if (!Number.isFinite(finalPrice) || finalPrice < 0) finalPrice = 0;
  if (!Number.isFinite(originalPrice) || originalPrice < 0) originalPrice = 0;

  const unitPrice = Number(finalPrice.toFixed(2));
  const originalUnitPrice = Number(originalPrice.toFixed(2));
  const totalPrice = Number((unitPrice * quantity).toFixed(2));
  const originalTotalPrice = Number((originalUnitPrice * quantity).toFixed(2));

  return { unitPrice, totalPrice, originalUnitPrice, originalTotalPrice };
}

function calculateSimplePricing(
  cartPriceDetails: any,
  quantity: number,
  currentTradeRole: string | undefined,
): CartPricingResult {
  const offerPrice = Number(cartPriceDetails.offerPrice || 0);
  let discount = 0;
  let discountType: string | undefined;

  if (currentTradeRole && currentTradeRole !== "BUYER") {
    discount = Number(cartPriceDetails.vendorDiscount || 0);
    discountType = cartPriceDetails.vendorDiscountType;
  } else {
    discount = Number(cartPriceDetails.consumerDiscount || 0);
    discountType = cartPriceDetails.consumerDiscountType;
  }

  let unitPrice = offerPrice;
  if (discount > 0 && discountType) {
    const norm = discountType.toUpperCase().trim();
    if (norm === "PERCENTAGE") {
      unitPrice = offerPrice * (1 - discount / 100);
    } else if (norm === "AMOUNT" || norm === "FLAT" || norm === "FIXED") {
      unitPrice = offerPrice - discount;
    }
  }

  const totalPrice = Number((unitPrice * quantity).toFixed(2));
  const originalUnitPrice = Number(
    cartPriceDetails.price || cartPriceDetails.basePrice || offerPrice,
  );
  const originalTotalPrice = Number((originalUnitPrice * quantity).toFixed(2));

  return {
    unitPrice: Number(unitPrice.toFixed(2)),
    totalPrice,
    originalUnitPrice,
    originalTotalPrice,
  };
}

function resolveOriginalPrice(
  productData: any,
  cartItem: any,
  cartPriceDetails: any,
): number {
  let originalPrice = 0;

  if (productData?.productProductPrice) {
    originalPrice = Number(productData.productProductPrice) || 0;
  } else if (productData?.productPrice) {
    originalPrice = Number(productData.productPrice) || 0;
  }

  const backendOriginalPrice = Number(
    cartPriceDetails?.price ?? cartPriceDetails?.basePrice ?? 0,
  );

  if (!originalPrice && backendOriginalPrice > 0) {
    originalPrice = backendOriginalPrice;
  }

  if (!originalPrice) {
    const cartOfferPrice = Number(
      cartPriceDetails?.offerPrice ?? cartItem?.offerPrice ?? 0,
    );
    const cartConsumerDiscount = Number(cartPriceDetails?.consumerDiscount ?? 0);
    const cartConsumerDiscountType = cartPriceDetails?.consumerDiscountType;

    if (cartOfferPrice > 0 && cartConsumerDiscount > 0 && cartConsumerDiscountType) {
      const norm = cartConsumerDiscountType?.toString().toUpperCase().trim();
      if (norm === "PERCENTAGE") {
        originalPrice = cartOfferPrice / (1 - cartConsumerDiscount / 100);
      } else if (norm === "AMOUNT" || norm === "FLAT" || norm === "FIXED") {
        originalPrice = cartOfferPrice + cartConsumerDiscount;
      } else {
        originalPrice = cartOfferPrice;
      }
    } else {
      originalPrice = cartOfferPrice;
    }
  }

  return originalPrice;
}

function applyDiscount(
  price: number,
  discount: number,
  discountType: string | undefined,
): number {
  if (discount <= 0 || !discountType) return price;
  const norm = discountType.toString().toUpperCase().trim();
  if (norm === "PERCENTAGE") return price * (1 - discount / 100);
  if (norm === "AMOUNT" || norm === "FLAT" || norm === "FIXED") return price - discount;
  return price;
}

function applyDiscountFromCart(
  offerPrice: number,
  cartPriceDetails: any,
  currentTradeRole: string | undefined,
): number {
  const discount =
    currentTradeRole && currentTradeRole !== "BUYER"
      ? Number(cartPriceDetails?.vendorDiscount || 0)
      : Number(cartPriceDetails?.consumerDiscount || 0);
  const discountType =
    currentTradeRole && currentTradeRole !== "BUYER"
      ? cartPriceDetails?.vendorDiscountType
      : cartPriceDetails?.consumerDiscountType;
  return applyDiscount(offerPrice, discount, discountType);
}
