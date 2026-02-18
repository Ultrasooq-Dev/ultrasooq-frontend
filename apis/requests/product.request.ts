import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import axios from "axios";
import urlcat from "urlcat";
import { getApiUrl } from "@/config/api";
import {
  ICreateProductRequest,
  IDeleteProductRequest,
  IUpdateProductRequest,
} from "@/utils/types/product.types";

export const createProduct = (payload: ICreateProductRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/create`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/findAll`, payload),
  });
};

export const fetchProductById = (payload: {
  productId: string;
  userId?: number;
  sharedLinkId?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/findOne`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchRfqProductById = (payload: {
  productId: string;
  userId?: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/rfqFindOne`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteProduct = (payload: IDeleteProductRequest) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/product/delete/${payload.productId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateProduct = (payload: IUpdateProductRequest) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/update`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateForCustomize = (payload: {
  productId: number;
  note?: string;
  fromPrice?: number;
  toPrice?: number;
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/addCustomizeProduct`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/searchExistingProducts`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/product/searchExistingProductsForCopy`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Fetch existing product by ID for copy functionality
export const fetchExistingProductById = (payload: {
  existingProductId: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getExistingProductById`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getAllProduct`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/product/getAllProductByUserBusinessCategory`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getAllBuyGroupProduct`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/product/getAllBuyGroupProductByUserBusinessCategory`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchSameBrandProducts = (payload: {
  page: number;
  limit: number;
  brandIds: string;
  userId?: number;
  productId?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/sameBrandAllProduct`, payload),
  });
};

export const fetchRelatedProducts = (payload: {
  page: number;
  limit: number;
  tagIds: string;
  userId?: number;
  productId?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/relatedAllProduct`, payload),
  });
};

export const addMultiplePriceForProduct = (payload: {
  productId: number;
  prices: { offerPrice: number; productPrice: number; consumerType?: string }[];
  [key: string]: unknown;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/addMultiplePriceForProduct`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateMultipleProductPrice = (payload: {
  productPriceId: number;
  offerPrice?: number;
  productPrice?: number;
  status?: string;
  [key: string]: unknown;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/updateMultipleProductPrice`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getAllProductPriceByUser`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getOneWithProductPrice = (payload: {
  productId: number;
  adminId: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/findOneWithProductPrice`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getVendorDetails = (payload: { adminId: string }) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/vendorDetails`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/vendorAllProduct`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getOneProductByProductCondition = (payload: {
  productId: number;
  productPriceId: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(
      `${getApiUrl()}/product/getOneProductByProductCondition`,
      payload,
    ),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/editProductPriceByProductCondition`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateProductStatus = (payload: {
  productPriceId: number;
  status: string;
}) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/updateProductPrice`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/updateProductPrice`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const removeProduct = (payload: { productPriceId: number }) => {
  return axios({
    method: "DELETE",
    url: urlcat(`${getApiUrl()}/product/deleteOneProductPrice`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchProductVariant = (productPriceId: number[]) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/getProductVariant`,
    data: {
      productPriceId,
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/service/product/${serviceId}`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/dropship`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/available-for-dropship`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getDropshipProducts = (payload: {
  page: number;
  limit: number;
  status?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/dropship-products`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const getDropshipEarnings = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/product/dropship-earnings`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const updateDropshipProductStatus = (id: number, status: string) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/dropship/${id}/status`,
    data: { status },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteDropshipProduct = (id: number) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/product/dropship/${id}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/dropship/enable/${productId}`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get vendor's dropshipable products
export const getMyDropshipableProducts = (payload: {
  page: number;
  limit: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/dropship/my-dropshipable-products`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get dropship analytics
export const getDropshipAnalytics = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/product/dropship/analytics`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/product/dropship/bulk-enable`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get wholesale products
export const getWholesaleProducts = (payload: {
  page: number;
  limit: number;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/wholesale/products`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get wholesale dashboard
export const getWholesaleDashboard = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/product/wholesale/dashboard`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get wholesale product sales details
export const getWholesaleProductSales = (productId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/product/wholesale/product/${productId}/sales`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/getUserOwnDropshipableProducts`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Get dropship products created from a specific original product
export const getDropshipProductsFromOriginal = (originalProductId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/product/getDropshipProductsFromOriginal/${originalProductId}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
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
  
  return axios({
    method: "PATCH",
    url: urlcat(`${getApiUrl()}/product/productViewCount`, params),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Track product click
export const trackProductClick = (payload: {
  productId: number;
  clickSource?: string;
  deviceId?: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/trackClick`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

// Track product search
export const trackProductSearch = (payload: {
  searchTerm: string;
  productId?: number;
  clicked?: boolean;
  deviceId?: string;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/trackSearch`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchSearchSuggestions = (payload: {
  term: string;
  userId?: number;
  deviceId?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/searchSuggestions`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const fetchAiSearch = (payload: {
  q: string;
  page?: number;
  limit?: number;
  userId?: number;
  userType?: string;
}) => {
  return axios({
    method: "GET",
    url: urlcat(`${getApiUrl()}/product/search/ai`, payload),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};