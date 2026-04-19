/**
 * Returns a local timestamp (ms) for a given date string and optional time string.
 */
export const getLocalTimestamp = (dateStr?: string, timeStr?: string): number => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const [h, m] = String(timeStr || "")
    .split(":")
    .map(Number);
  if (!Number.isNaN(h)) date.setHours(h || 0, Number.isNaN(m) ? 0 : m, 0, 0);
  return date.getTime();
};

/**
 * Returns a human-readable label for a sale start date/time.
 */
export const getSaleStartLabel = (dateStr?: string, timeStr?: string): string => {
  try {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      if (!Number.isNaN(h)) d.setHours(h || 0, Number.isNaN(m) ? 0 : m, 0, 0);
    }
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/**
 * Maps a raw product API item into the shape expected by ProductCard / ProductTable.
 */
export const mapProductItem = (item: any, meId?: number): any => {
  let sold = 0;
  if (item.orderProducts?.length) {
    item.orderProducts.forEach((product: any) => {
      sold += product?.orderQuantity || 0;
    });
  }

  const activePriceEntry =
    item?.product_productPrice?.find((pp: any) => pp?.status === "ACTIVE") ||
    item?.product_productPrice?.[0];

  return {
    id: item.id,
    productName: item?.productName || "-",
    productPrice: item?.productPrice || 0,
    offerPrice: activePriceEntry?.offerPrice || item?.offerPrice || 0,
    productImage: activePriceEntry?.productPrice_productSellerImage?.length
      ? activePriceEntry?.productPrice_productSellerImage?.[0]?.image
      : item?.productImages?.[0]?.image,
    categoryName: item?.category?.name || "-",
    skuNo: item?.skuNo,
    brandName: item?.brand?.brandName || "-",
    productReview: item?.productReview || [],
    productWishlist: item?.product_wishlist || [],
    inWishlist: item?.product_wishlist?.find((ele: any) => ele?.userId === meId),
    shortDescription: item?.product_productShortDescription?.length
      ? item?.product_productShortDescription?.[0]?.shortDescription
      : "-",
    productProductPriceId: activePriceEntry?.id,
    productProductPrice: activePriceEntry?.offerPrice,
    consumerDiscount: activePriceEntry?.consumerDiscount,
    consumerDiscountType: activePriceEntry?.consumerDiscountType,
    vendorDiscount: activePriceEntry?.vendorDiscount,
    vendorDiscountType: activePriceEntry?.vendorDiscountType,
    askForPrice: activePriceEntry?.askForPrice,
    productPrices: item?.product_productPrice || [],
    sold,
    productQuantity:
      activePriceEntry?.stock !== undefined && activePriceEntry?.stock !== null
        ? Number(activePriceEntry.stock)
        : item?.productQuantity !== undefined && item?.productQuantity !== null
          ? Number(item.productQuantity)
          : null,
    categoryId: item?.categoryId,
    categoryLocation: item?.categoryLocation,
    categoryConnections: item?.category?.category_categoryIdDetail || [],
    consumerType: activePriceEntry?.consumerType,
    status: item?.status || "ACTIVE",
  };
};
