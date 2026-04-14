import { RfqQuoteType } from "./sellerChatTypes";

/**
 * Builds the attachment payload array from an attachments state array.
 */
export function buildAttachList(attachments: any[]): any[] {
  return attachments.map((att: any) => {
    const extension = att?.name.split(".").pop();
    return {
      fileType: att?.type,
      fileName: att?.name,
      fileSize: att?.size,
      filePath: "",
      fileExtension: extension,
      uniqueId: att.uniqueId,
      status: "UPLOADING",
    };
  });
}

/**
 * Groups an array of RFQ quotes by their rfqQuotesId.
 * Returns an array of groups (each group is an array of quotes sharing the same rfqQuotesId).
 */
export function groupRfqQuotesByRfqId(rfqQuotes: RfqQuoteType[]): RfqQuoteType[][] {
  const grouped = new Map<number, RfqQuoteType[]>();
  rfqQuotes.forEach((quote) => {
    const rfqId = quote.rfqQuotesId;
    if (!grouped.has(rfqId)) {
      grouped.set(rfqId, []);
    }
    grouped.get(rfqId)!.push(quote);
  });
  return Array.from(grouped.values());
}

/**
 * Builds the quoteProducts array from an RFQ quote item, merging in price requests.
 */
export function buildQuoteProducts(item: any): any[] {
  const hasFirstVendorApproval =
    item?.rfqProductPriceRequests?.some(
      (request: any) =>
        request?.status === "APPROVED" && request?.requestedById === item?.sellerID,
    ) || false;

  return (
    item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts.map((i: any) => {
      let priceRequest = null;
      const pRequest = item?.rfqProductPriceRequests?.find(
        (request: any) =>
          request?.rfqQuoteProductId === i.id && request?.status === "APPROVED",
      );
      if (pRequest) priceRequest = pRequest;
      let offerPrice = i.offerPrice;
      if (
        pRequest &&
        pRequest.status &&
        typeof pRequest.status === "string" &&
        pRequest?.status === "APPROVED"
      ) {
        offerPrice = pRequest?.requestedPrice;
      }
      return {
        ...i,
        priceRequest,
        offerPrice,
        offerPriceFrom: i.offerPriceFrom,
        offerPriceTo: i.offerPriceTo,
        hasFirstVendorApproval,
        address:
          item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.address,
        deliveryDate:
          item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.rfqDate,
      };
    }) || []
  );
}

/**
 * Returns true if every product in quoteProducts has an approved price request
 * with a positive offerPrice.
 */
export function canCheckout(quoteProducts: any[], selectedRfqQuote: any): boolean {
  if (!selectedRfqQuote || !quoteProducts || quoteProducts.length === 0) return false;
  return quoteProducts.every(
    (product: any) =>
      product?.priceRequest &&
      product?.priceRequest?.status === "APPROVED" &&
      product?.offerPrice &&
      parseFloat(product.offerPrice) > 0,
  );
}

/**
 * Calculates the total price from approved product prices, summing price × quantity.
 */
export function calculateTotalPrice(quoteProducts: any[]): number {
  if (!quoteProducts || quoteProducts.length === 0) return 0;
  return quoteProducts.reduce((total: number, product: any) => {
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
  }, 0);
}

/**
 * Merges chat-history suggestions with pending (unsent) suggestion updates
 * for a given RFQ quote product ID.
 */
export function getSuggestionsForRfqQuoteProduct(
  productId: number,
  selectedChatHistory: any[],
  pendingSuggestionUpdates: Map<number, Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>>,
): any[] {
  const suggestions = selectedChatHistory
    .flatMap((chat: any) => chat?.rfqSuggestedProducts || [])
    .filter((s: any) => s?.rfqQuoteProductId === productId);

  const byProductId = new Map<number, any>();
  suggestions.forEach((s: any) => {
    if (!s?.suggestedProductId) return;
    byProductId.set(s.suggestedProductId, s);
  });

  const pendingSuggestions = pendingSuggestionUpdates.get(productId) || [];
  pendingSuggestions.forEach((pending: any) => {
    if (pending.suggestedProductId) {
      byProductId.set(pending.suggestedProductId, {
        rfqQuoteProductId: productId,
        suggestedProductId: pending.suggestedProductId,
        offerPrice: pending.offerPrice,
        quantity: pending.quantity,
        suggestedProduct: pending.productDetails,
      });
    }
  });

  return Array.from(byProductId.values());
}
