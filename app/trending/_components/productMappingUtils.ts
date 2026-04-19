export function mapProductItem(item: any, meDataId: number | undefined, usersMap: Map<number, any>) {
  const activePriceEntry =
    item?.product_productPrice?.find((pp: any) => pp?.status === "ACTIVE") ||
    item?.product_productPrice?.[0];

  return {
    id: item.id,
    productName: resolveProductName(item),
    productPrice: item?.productPrice || 0,
    offerPrice: activePriceEntry?.offerPrice || item?.offerPrice || 0,
    productImage: resolveProductImage(item, activePriceEntry),
    categoryName: item?.category?.name || "-",
    skuNo: item?.skuNo,
    brandName: item?.brand?.brandName || "-",
    productReview: item?.productReview || [],
    productWishlist: item?.product_wishlist || [],
    inWishlist: item?.product_wishlist?.find(
      (ele: any) => ele?.userId === meDataId,
    ),
    shortDescription: resolveShortDescription(item),
    productProductPriceId: activePriceEntry?.id,
    productProductPrice: activePriceEntry?.offerPrice,
    consumerDiscount: activePriceEntry?.consumerDiscount,
    consumerDiscountType: activePriceEntry?.consumerDiscountType,
    vendorDiscount: activePriceEntry?.vendorDiscount,
    vendorDiscountType: activePriceEntry?.vendorDiscountType,
    askForPrice: activePriceEntry?.askForPrice,
    productPrices: item?.product_productPrice,
    categoryId: item?.categoryId,
    categoryLocation: item?.categoryLocation,
    categoryConnections: item?.category?.category_categoryIdDetail || [],
    consumerType: activePriceEntry?.consumerType,
    productQuantity: resolveProductQuantity(item, activePriceEntry),
    vendorId: item?.addedBy || item?.userId,
    vendorName: resolveVendorName(item, usersMap),
    vendorEmail: usersMap.get(item?.userId)?.email || item?.user?.email,
    vendorPhone: usersMap.get(item?.userId)?.phoneNumber || item?.user?.phoneNumber,
    vendorProfilePicture:
      usersMap.get(item?.userId)?.profilePicture || item?.user?.profilePicture,
    vendorTradeRole: usersMap.get(item?.userId)?.tradeRole || item?.user?.tradeRole,
    vendorUserProfile: usersMap.get(item?.userId)?.userProfile || item?.user?.userProfile,
    status: item?.status || "ACTIVE",
  };
}

function resolveProductName(item: any): string {
  if (item?.isDropshipped && item?.customMarketingContent?.customName) {
    return item.customMarketingContent.customName;
  }
  return item?.productName || "-";
}

function resolveProductImage(item: any, activePriceEntry: any): string | undefined {
  if (item?.isDropshipped) {
    if (
      item?.additionalMarketingImages &&
      Array.isArray(item.additionalMarketingImages) &&
      item.additionalMarketingImages.length > 0
    ) {
      return item.additionalMarketingImages[0];
    }
    if (item?.productImages && Array.isArray(item.productImages)) {
      const marketingImage = item.productImages.find(
        (img: any) => img.variant?.type === "marketing",
      );
      if (marketingImage) return marketingImage.image;
      if (item.productImages[0]?.image) return item.productImages[0].image;
    }
    if (
      item?.originalProduct?.productImages &&
      Array.isArray(item.originalProduct.productImages) &&
      item.originalProduct.productImages.length > 0
    ) {
      return item.originalProduct.productImages[0]?.image;
    }
  }
  return activePriceEntry?.productPrice_productSellerImage?.length
    ? activePriceEntry?.productPrice_productSellerImage?.[0]?.image
    : item?.productImages?.[0]?.image;
}

function resolveShortDescription(item: any): string {
  if (item?.isDropshipped && item?.customMarketingContent?.marketingText) {
    return item.customMarketingContent.marketingText;
  }
  return item?.product_productShortDescription?.length
    ? item?.product_productShortDescription?.[0]?.shortDescription
    : "-";
}

function resolveProductQuantity(item: any, activePriceEntry: any): number | null {
  if (activePriceEntry?.stock !== undefined && activePriceEntry?.stock !== null) {
    return Number(activePriceEntry.stock);
  }
  if (item?.productQuantity !== undefined && item?.productQuantity !== null) {
    return Number(item.productQuantity);
  }
  return null;
}

function resolveVendorName(item: any, usersMap: Map<number, any>): string {
  const userId = item?.userId;
  const user = usersMap.get(userId);
  if (user?.accountName) return user.accountName;
  if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
  if (user?.firstName) return user.firstName;
  if (user?.email) return user.email;
  if (userId) return `Vendor ${userId}`;
  if (item?.addedBy) return `Vendor ${item.addedBy}`;
  return "Unknown Vendor";
}

export function buildVendorList(memoizedProductList: any[]): any[] {
  const vendorMap = new Map();

  memoizedProductList.forEach((product: any) => {
    if (product.vendorId) {
      if (!vendorMap.has(product.vendorId)) {
        vendorMap.set(product.vendorId, {
          id: product.vendorId,
          firstName: product.vendorName.split(" ")[0] || "",
          lastName: product.vendorName.split(" ").slice(1).join(" ") || "",
          email: product.vendorEmail || "",
          phoneNumber: product.vendorPhone || "",
          profilePicture: product.vendorProfilePicture,
          tradeRole: product.vendorTradeRole || "VENDOR",
          userProfile: product.vendorUserProfile || [],
          productCount: 0,
          averageRating: 0,
          location: "",
          businessTypes: [],
        });
      }
      const vendor = vendorMap.get(product.vendorId);
      vendor.productCount += 1;
    }
  });

  return Array.from(vendorMap.values()).map((vendor) => {
    const vendorProducts = memoizedProductList.filter(
      (p: any) => p.vendorId === vendor.id,
    );
    const totalRating = vendorProducts.reduce((sum: number, product: any) => {
      const reviews = product.productReview || [];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce(
              (rSum: number, review: any) => rSum + (review.rating || 0),
              0,
            ) / reviews.length
          : 0;
      return sum + avgRating;
    }, 0);

    vendor.averageRating =
      vendorProducts.length > 0 ? totalRating / vendorProducts.length : 0;

    if (vendor.userProfile?.length) {
      vendor.businessTypes = vendor.userProfile
        .map((item: any) => item?.userProfileBusinessType)
        .flat()
        .map((item: any) => item?.userProfileBusinessTypeTag?.tagName)
        .filter(Boolean);
    }

    return vendor;
  });
}
