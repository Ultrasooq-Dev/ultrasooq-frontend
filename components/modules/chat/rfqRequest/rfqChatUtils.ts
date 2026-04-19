import { RfqRequestVendorDetailsProps } from "./rfqChatTypes";

export const getVendorName = (item: RfqRequestVendorDetailsProps): string => {
  const seller = item?.sellerIDDetail;
  if (seller?.accountName) {
    return seller.accountName;
  }
  if (seller?.firstName && seller?.lastName) {
    return `${seller.firstName} ${seller.lastName}`;
  }
  if (seller?.firstName) {
    return seller.firstName;
  }
  if (seller?.email) {
    return seller.email;
  }
  if (item?.sellerID) {
    return `Vendor ${item.sellerID}`;
  }
  return "Unknown Vendor";
};

export const getVendorOfferPrice = (
  item: RfqRequestVendorDetailsProps,
): string => {
  const products = item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const hasPriceRequests =
    item?.rfqProductPriceRequests && item.rfqProductPriceRequests.length > 0;

  if (hasPriceRequests && products.length > 0) {
    const calculatedTotal = products.reduce(
      (total: number, product: any) => {
        const priceRequest = item.rfqProductPriceRequests?.find(
          (request: any) => request.rfqQuoteProductId === product.id,
        );
        if (priceRequest) {
          const price = parseFloat(priceRequest.requestedPrice || "0");
          const quantity = product.quantity || 1;
          return total + price * quantity;
        }
        return total;
      },
      0,
    );
    return calculatedTotal > 0 ? calculatedTotal.toString() : "-";
  }

  if (products.length > 0) {
    const allHaveBudgetRange = products.every(
      (product: any) =>
        product.offerPriceFrom &&
        product.offerPriceTo &&
        product.offerPriceFrom > 0 &&
        product.offerPriceTo > 0,
    );

    if (allHaveBudgetRange) {
      const budgetMaxTotal = products.reduce(
        (total: number, product: any) => {
          const maxPrice = parseFloat(product.offerPriceTo || "0");
          const quantity = product.quantity || 1;
          return total + maxPrice * quantity;
        },
        0,
      );
      const currentOfferPrice = parseFloat(item?.offerPrice || "0");
      if (Math.abs(currentOfferPrice - budgetMaxTotal) < 0.01) {
        return "-";
      }
    }
  }

  return item?.offerPrice || "-";
};

export const getSuggestionsForRfqQuoteProduct = (
  productId: number,
  selectedChatHistory: any[],
  pendingProductSelections: Map<number, number[]>,
): any[] => {
  const suggestions = selectedChatHistory
    .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
    .filter((s: any) => s?.rfqQuoteProductId === productId);

  const byProductId = new Map<number, any>();
  suggestions.forEach((s: any) => {
    if (!s?.suggestedProductId) return;
    byProductId.set(s.suggestedProductId, s);
  });

  let result = Array.from(byProductId.values()).filter(
    (s: any) => (s.quantity ?? 0) > 0,
  );

  const pendingIds = pendingProductSelections.get(productId) || [];
  result = result.map((s: any) => {
    const isPendingSelected = pendingIds.includes(s.id);
    return {
      ...s,
      isSelectedByBuyer: isPendingSelected || s.isSelectedByBuyer,
    };
  });

  return result;
};

export const canCheckout = (selectedVendor: any): boolean => {
  if (
    !selectedVendor ||
    !selectedVendor?.rfqQuotesProducts ||
    selectedVendor.rfqQuotesProducts.length === 0
  ) {
    return false;
  }

  return selectedVendor.rfqQuotesProducts.every((product: any) => {
    return (
      product?.priceRequest &&
      product?.priceRequest?.status === "APPROVED" &&
      product?.offerPrice &&
      parseFloat(product.offerPrice) > 0
    );
  });
};

export const calculateTotalPrice = (selectedVendor: any): number => {
  if (
    !selectedVendor?.rfqQuotesProducts ||
    selectedVendor.rfqQuotesProducts.length === 0
  ) {
    return 0;
  }

  return selectedVendor.rfqQuotesProducts.reduce(
    (total: number, product: any) => {
      if (
        product?.priceRequest &&
        product?.priceRequest?.status === "APPROVED" &&
        product?.offerPrice
      ) {
        const price = parseFloat(product.offerPrice || "0");
        const quantity = product.quantity || 1;
        return total + price * quantity;
      }
      return total;
    },
    0,
  );
};

export const calculateColumnTotalPrice = (
  selectedVendor: any,
  selectedChatHistory: any[],
  pendingProductSelections: Map<number, number[]>,
): { totalPrice: number; hasApprovedPrices: boolean } => {
  let mainProductsTotal = 0;
  let hasApprovedPrices = false;

  if (
    selectedVendor?.rfqQuotesProducts &&
    selectedVendor.rfqQuotesProducts.length > 0
  ) {
    hasApprovedPrices = selectedVendor.rfqQuotesProducts.some(
      (product: any) =>
        product?.priceRequest && product?.priceRequest?.status === "APPROVED",
    );

    mainProductsTotal = selectedVendor.rfqQuotesProducts.reduce(
      (total: number, product: any) => {
        if (
          product?.priceRequest &&
          product?.priceRequest?.status === "APPROVED" &&
          product?.offerPrice
        ) {
          const price = parseFloat(product.offerPrice || "0");
          const quantity = product.quantity || 1;
          return total + price * quantity;
        }
        return total;
      },
      0,
    );
  } else {
    mainProductsTotal = parseFloat(selectedVendor?.offerPrice || "0");
  }

  const allSuggestions = selectedChatHistory
    .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
    .filter((s: any) => (s.quantity ?? 0) > 0);

  const selectedByProduct = new Map<number, Set<number>>();

  allSuggestions.forEach((s: any) => {
    if (s.isSelectedByBuyer && s.rfqQuoteProductId) {
      if (!selectedByProduct.has(s.rfqQuoteProductId)) {
        selectedByProduct.set(s.rfqQuoteProductId, new Set());
      }
      selectedByProduct.get(s.rfqQuoteProductId)!.add(s.id);
    }
  });

  pendingProductSelections.forEach((pendingIds, productId) => {
    if (!selectedByProduct.has(productId)) {
      selectedByProduct.set(productId, new Set());
    }
    pendingIds.forEach((id) => {
      selectedByProduct.get(productId)!.add(id);
    });
  });

  const selectedSuggestedTotal = allSuggestions.reduce(
    (total: number, suggestion: any) => {
      const productId = suggestion.rfqQuoteProductId;
      const selectedIds = selectedByProduct.get(productId);
      if (selectedIds && selectedIds.has(suggestion.id)) {
        const price = parseFloat(suggestion.offerPrice || "0");
        const quantity = suggestion.quantity || 1;
        return total + price * quantity;
      }
      return total;
    },
    0,
  );

  return {
    totalPrice: mainProductsTotal + selectedSuggestedTotal,
    hasApprovedPrices,
  };
};
