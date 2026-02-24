import http from "../http";
import urlcat from "urlcat";
import {
  ICreateProductRequest,
  IDeleteProductRequest,
  IUpdateProductRequest,
} from "@/utils/types/product.types";

export const createProduct = (payload: ICreateProductRequest) => {
  return http({
    method: "POST",
    url: `/product/create`,
    data: payload,
  });
};

export const fetchProducts = (payload: {
  page: number;
  limit: number;
  userId: string;
  term?: string;
  brandIds?: string;
  status?: string;
  expireDate?: string;
  sellType?: string;
  discount?: boolean;
  sort?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/findAll`, payload),
  });
};

export const fetchProductById = (payload: {
  productId: string;
  userId?: number;
  sharedLinkId?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/findOne`, payload),
  });
};

export const fetchRfqProductById = (payload: {
  productId: string;
  userId?: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/rfqFindOne`, payload),
  });
};

export const deleteProduct = (payload: IDeleteProductRequest) => {
  return http({
    method: "DELETE",
    url: `/product/delete/${payload.productId}`,
  });
};

export const updateProduct = (payload: IUpdateProductRequest) => {
  return http({
    method: "PATCH",
    url: `/product/update`,
    data: payload,
  });
};

export const updateForCustomize = (payload: {
  productId: number;
  note?: string;
  fromPrice?: number;
  toPrice?: number;
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: `/product/addCustomizeProduct`,
    data: payload,
  });
};

export const fetchExistingProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  brandAddedBy?: number;
  categoryIds?: string;
  productType?: string;
  type?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/searchExistingProducts`, payload),
  });
};

// Dedicated function for "Add from Existing Product" functionality
export const fetchExistingProductForCopy = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  categoryIds?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/searchExistingProductsForCopy`,
      payload,
    ),
  });
};

// Fetch existing product by ID for copy functionality
export const fetchExistingProductById = (payload: {
  existingProductId: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getExistingProductById`, payload),
  });
};

export const fetchAllProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  userId?: number;
  categoryIds?: string;
  isOwner?: string;
  userType?: string;
  related?: boolean;
  ratingMin?: number;
  hasDiscount?: boolean;
}) => {
  const related = payload.related;
  delete payload?.related;
  if (related) {
    return fetchAllProductsByUserBusinessCategory(payload);
  }
  return http({
    method: "GET",
    url: urlcat(`/product/getAllProduct`, payload),
  });
};

export const fetchAllProductsByUserBusinessCategory = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  userId?: number;
  categoryIds?: string;
  isOwner?: string;
  userType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllProductByUserBusinessCategory`,
      payload,
    ),
  });
};

export const fetchAllBuyGroupProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  userId?: number;
  categoryIds?: string;
  isOwner?: string;
  userType?: string;
  related?: boolean;
}) => {
  const related = payload.related;
  delete payload?.related;
  if (related) {
    return fetchAllBuyGroupProductsByUserBusinessCategory(payload);
  }
  return http({
    method: "GET",
    url: urlcat(`/product/getAllBuyGroupProduct`, payload),
  });
};

export const fetchAllBuyGroupProductsByUserBusinessCategory = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  brandIds?: string;
  priceMin?: number;
  priceMax?: number;
  userId?: number;
  categoryIds?: string;
  isOwner?: string;
  userType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getAllBuyGroupProductByUserBusinessCategory`,
      payload,
    ),
  });
};

export const fetchSameBrandProducts = (payload: {
  page: number;
  limit: number;
  brandIds: string;
  userId?: number;
  productId?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/sameBrandAllProduct`, payload),
  });
};

export const fetchRelatedProducts = (payload: {
  page: number;
  limit: number;
  tagIds: string;
  userId?: number;
  productId?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/relatedAllProduct`, payload),
  });
};

export const addMultiplePriceForProduct = (payload: {
  productId: number;
  prices: { offerPrice: number; productPrice: number; consumerType?: string }[];
  [key: string]: unknown;
}) => {
  return http({
    method: "POST",
    url: `/product/addMultiplePriceForProduct`,
    data: payload,
  });
};

export const updateMultipleProductPrice = (payload: {
  productPriceId: number;
  offerPrice?: number;
  productPrice?: number;
  status?: string;
  [key: string]: unknown;
}) => {
  return http({
    method: "PATCH",
    url: `/product/updateMultipleProductPrice`,
    data: payload,
  });
};

export const getAllManagedProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  selectedAdminId?: number;
  brandIds?: string;
  categoryIds?: string;
  status?: string;
  expireDate?: string;
  sellType?: string;
  discount?: boolean;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getAllProductPriceByUser`, payload),
  });
};

export const getOneWithProductPrice = (payload: {
  productId: number;
  adminId: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/findOneWithProductPrice`, payload),
  });
};

export const getVendorDetails = (payload: { adminId: string }) => {
  return http({
    method: "GET",
    url: urlcat(`/product/vendorDetails`, payload),
  });
};

export const getVendorProducts = (payload: {
  adminId: string;
  page: number;
  limit: number;
  term?: string;
  brandIds?: string;
  status?: string;
  expireDate?: string;
  sellType?: string;
  discount?: boolean;
  sort?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/vendorAllProduct`, payload),
  });
};

export const getOneProductByProductCondition = (payload: {
  productId: number;
  productPriceId: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/product/getOneProductByProductCondition`,
      payload,
    ),
  });
};

export const updateProductPriceByProductCondition = (payload: {
  description: string;
  productShortDescriptionList: {
    shortDescription: string;
  }[];
  productSpecificationList: {
    label: string;
    specification: string;
  }[];
  productSellerImageList: {
    productPriceId: string;
    imageName: string;
    image: string;
    videoName: string;
    video: string;
  }[];
}) => {
  return http({
    method: "PATCH",
    url: `/product/editProductPriceByProductCondition`,
    data: payload,
  });
};

export const updateProductStatus = (payload: {
  productPriceId: number;
  status: string;
}) => {
  return http({
    method: "PATCH",
    url: `/product/updateProductPrice`,
    data: payload,
  });
};

export const updateSingleProducts = (payload: {
  productPriceId: number;
  stock: number;
  askForPrice: string;
  askForStock: string;
  offerPrice: number;
  productPrice: number;
  status: string;
  productCondition: string;
  consumerType: string;
  sellType: string;
  deliveryAfter: number;
  timeOpen: number;
  timeClose: number;
  vendorDiscount: number;
  vendorDiscountType: string | null;
  consumerDiscount: number;
  consumerDiscountType: string | null;
  minQuantity: number;
  maxQuantity: number;
  minCustomer: number;
  maxCustomer: number;
  minQuantityPerCustomer: number;
  maxQuantityPerCustomer: number;
}) => {
  return http({
    method: "PATCH",
    url: `/product/updateProductPrice`,
    data: payload,
  });
};

export const removeProduct = (payload: { productPriceId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat(`/product/deleteOneProductPrice`, payload),
  });
};

export const fetchProductVariant = (productPriceId: number[]) => {
  return http({
    method: "POST",
    url: `/product/getProductVariant`,
    data: {
      productPriceId,
    },
  });
};

export const getProductsByService = (
  serviceId: number,
  payload: {
    page: number;
    limit: number;
  },
) => {
  return http({
    method: "GET",
    url: urlcat(`/service/product/${serviceId}`, payload),
  });
};

// Dropshipping API requests
export const createDropshipProduct = (payload: {
  originalProductId: number;
  customProductName: string;
  customDescription: string;
  marketingText?: string;
  additionalImages?: string[];
  markup: number;
}) => {
  return http({
    method: "POST",
    url: `/product/dropship`,
    data: payload,
  });
};

export const getAvailableProductsForDropship = (payload: {
  page: number;
  limit: number;
  term?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/available-for-dropship`, payload),
  });
};

export const getDropshipProducts = (payload: {
  page: number;
  limit: number;
  status?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/dropship-products`, payload),
  });
};

export const getDropshipEarnings = () => {
  return http({
    method: "GET",
    url: `/product/dropship-earnings`,
  });
};

export const updateDropshipProductStatus = (id: number, status: string) => {
  return http({
    method: "PATCH",
    url: `/product/dropship/${id}/status`,
    data: { status },
  });
};

export const deleteDropshipProduct = (id: number) => {
  return http({
    method: "DELETE",
    url: `/product/dropship/${id}`,
  });
};

// Mark product as dropshipable
export const markProductAsDropshipable = (
  productId: number,
  payload: {
    isDropshipable: boolean;
    dropshipCommission?: number;
    dropshipMinMarkup?: number;
    dropshipMaxMarkup?: number;
    dropshipSettings?: Record<string, unknown>;
  }
) => {
  return http({
    method: "PATCH",
    url: `/product/dropship/enable/${productId}`,
    data: payload,
  });
};

// Get vendor's dropshipable products
export const getMyDropshipableProducts = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/dropship/my-dropshipable-products`, payload),
  });
};

// Get dropship analytics
export const getDropshipAnalytics = () => {
  return http({
    method: "GET",
    url: `/product/dropship/analytics`,
  });
};

// Bulk enable/disable dropshipping
export const bulkUpdateDropshipable = (payload: {
  productIds: number[];
  isDropshipable: boolean;
  dropshipCommission?: number;
  dropshipMinMarkup?: number;
  dropshipMaxMarkup?: number;
}) => {
  return http({
    method: "PATCH",
    url: `/product/dropship/bulk-enable`,
    data: payload,
  });
};

// Get wholesale products
export const getWholesaleProducts = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/wholesale/products`, payload),
  });
};

// Get wholesale dashboard
export const getWholesaleDashboard = () => {
  return http({
    method: "GET",
    url: `/product/wholesale/dashboard`,
  });
};

// Get wholesale product sales details
export const getWholesaleProductSales = (productId: number) => {
  return http({
    method: "GET",
    url: `/product/wholesale/product/${productId}/sales`,
  });
};

// Get user's own dropshipable products (productType = D, isDropshipable = true)
export const getUserOwnDropshipableProducts = (payload: {
  page: number;
  limit: number;
  term?: string;
  brandIds?: string;
  categoryIds?: string;
  status?: string;
  sort?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/getUserOwnDropshipableProducts`, payload),
  });
};

// Get dropship products created from a specific original product
export const getDropshipProductsFromOriginal = (originalProductId: number) => {
  return http({
    method: "GET",
    url: `/product/getDropshipProductsFromOriginal/${originalProductId}`,
  });
};

// Track product view
export const trackProductView = (payload: {
  productId: number;
  deviceId?: string;
}) => {
  // Build query params manually to ensure deviceId is included
  const params: Record<string, string | number> = { productId: payload.productId };
  if (payload.deviceId) {
    params.deviceId = payload.deviceId;
  }
  
  return http({
    method: "PATCH",
    url: urlcat(`/product/productViewCount`, params),
  });
};

// Track product click
export const trackProductClick = (payload: {
  productId: number;
  clickSource?: string;
  deviceId?: string;
}) => {
  return http({
    method: "POST",
    url: `/product/trackClick`,
    data: payload,
  });
};

// Track product search
export const trackProductSearch = (payload: {
  searchTerm: string;
  productId?: number;
  clicked?: boolean;
  deviceId?: string;
}) => {
  return http({
    method: "POST",
    url: `/product/trackSearch`,
    data: payload,
  });
};

export const fetchSearchSuggestions = (payload: {
  term: string;
  userId?: number;
  deviceId?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/searchSuggestions`, payload),
  });
};

export const fetchAiSearch = (payload: {
  q: string;
  page?: number;
  limit?: number;
  userId?: number;
  userType?: string;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/product/search/ai`, payload),
  });
};