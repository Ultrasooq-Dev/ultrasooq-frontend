import { APIResponseError } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMultiplePriceForProduct,
  createProduct,
  createDropshipProduct,
  deleteProduct,
  fetchAllBuyGroupProducts,
  fetchAllProducts,
  fetchAllProductsByUserBusinessCategory,
  fetchExistingProducts,
  fetchExistingProductForCopy,
  fetchExistingProductById,
  fetchProductById,
  fetchProductVariant,
  fetchProducts,
  fetchRelatedProducts,
  fetchRfqProductById,
  fetchSameBrandProducts,
  getAllManagedProducts,
  getAvailableProductsForDropship,
  getDropshipEarnings,
  getDropshipProducts,
  getOneProductByProductCondition,
  getOneWithProductPrice,
  getProductsByService,
  getVendorDetails,
  getVendorProducts,
  removeProduct,
  updateDropshipProductStatus,
  updateForCustomize,
  updateMultipleProductPrice,
  updateProduct,
  updateProductPriceByProductCondition,
  updateProductStatus,
  updateSingleProducts,
  markProductAsDropshipable,
  getMyDropshipableProducts,
  getDropshipAnalytics,
  bulkUpdateDropshipable,
  getWholesaleProducts,
  getWholesaleDashboard,
  getWholesaleProductSales,
  getUserOwnDropshipableProducts,
  getDropshipProductsFromOriginal,
  trackProductView,
  trackProductClick,
  trackProductSearch,
  fetchSearchSuggestions,
  fetchAiSearch,
} from "../requests/product.request";
import {
  ICreateProduct,
  ICreateProductRequest,
  IDeleteProduct,
  IDeleteProductRequest,
  IUpdateProduct,
  IUpdateProductRequest,
} from "@/utils/types/product.types";

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<ICreateProduct, APIResponseError, ICreateProductRequest>({
    mutationFn: async (payload) => {
      const res = await createProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["managed-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rfq-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useProducts = (
  payload: {
    userId: string;
    page: number;
    limit: number;
    term?: string;
    brandIds?: string;
    status?: string;
    expireDate?: string;
    sellType?: string;
    discount?: boolean;
    sort?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["products", payload],
    queryFn: async () => {
      const res = await fetchProducts(payload);
      return res.data;
    },
    enabled,
  });

export const useProductById = (
  payload: { productId: string; userId?: number; sharedLinkId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["product-by-id", payload],
    queryFn: async () => {
      const res = await fetchProductById(payload);
      return res.data;
    },
    enabled,
  });

export const useRfqProductById = (
  payload: { productId: string; userId?: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ["product-rfq-by-id", payload],
    queryFn: async () => {
      const res = await fetchRfqProductById(payload);
      return res.data;
    },
    enabled,
  });

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<IDeleteProduct, APIResponseError, IDeleteProductRequest>({
    mutationFn: async (payload) => {
      const res = await deleteProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<IUpdateProduct, APIResponseError, IUpdateProductRequest>({
    mutationFn: async (payload) => {
      const res = await updateProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateForCustomize = () => {
  const queryClient = useQueryClient();
  return useMutation<APIResponseError>({
    mutationFn: async (payload) => {
      const res = await updateForCustomize(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });
};

export const useExistingProduct = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["existing-products", payload],
    queryFn: async () => {
      const res = await fetchExistingProducts(payload);
      return res.data;
    },
    enabled,
  });

// Dedicated hook for "Add from Existing Product" functionality
export const useExistingProductForCopy = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    sort?: string;
    brandIds?: string;
    priceMin?: number;
    priceMax?: number;
    categoryIds?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["existing-products-for-copy", payload],
    queryFn: async () => {
      const res = await fetchExistingProductForCopy(payload);
      return res.data;
    },
    enabled,
  });

// Hook to fetch existing product by ID for copy functionality
export const useExistingProductById = (
  payload: {
    existingProductId: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["existing-product-by-id", payload],
    queryFn: async () => {
      const res = await fetchExistingProductById(payload);
      return res.data;
    },
    enabled,
  });

export const useAllProducts = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["existing-products", payload],
    queryFn: async () => {
      const res = await fetchAllProducts(payload);
      return res.data;
    },
    enabled,
  });

export const useAllProductsByUserBusinessCategory = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["existing-products", payload],
    queryFn: async () => {
      const res = await fetchAllProductsByUserBusinessCategory(payload);
      return res.data;
    },
    enabled,
  });

export const useAllBuyGroupProducts = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["buygroup-products", payload],
    queryFn: async () => {
      const res = await fetchAllBuyGroupProducts(payload);
      return res.data;
    },
    enabled,
  });

export const useAllBuyGroupProductsByUserBusinessCategory = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["buygroup-products", payload],
    queryFn: async () => {
      const res = await fetchAllBuyGroupProducts(payload);
      return res.data;
    },
    enabled,
  });

export const useSameBrandProducts = (
  payload: {
    page: number;
    limit: number;
    brandIds: string;
    userId?: number;
    productId?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["same-brand-products", payload],
    queryFn: async () => {
      const res = await fetchSameBrandProducts(payload);
      return res.data;
    },

    enabled,
  });

export const useRelatedProducts = (
  payload: {
    page: number;
    limit: number;
    tagIds: string;
    userId?: number;
    productId?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["related-products", payload],
    queryFn: async () => {
      const res = await fetchRelatedProducts(payload);
      return res.data;
    },

    enabled,
  });

export const useAddMultiplePriceForProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, any>({
    mutationFn: async (payload) => {
      const res = await addMultiplePriceForProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["managed-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateMultipleProductPrice = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, any>({
    mutationFn: async (payload) => {
      const res = await updateMultipleProductPrice(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["managed-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAllManagedProducts = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["managed-products", payload],
    queryFn: async () => {
      const res = await getAllManagedProducts(payload);
      return res.data;
    },

    enabled,
  });

export const useOneWithProductPrice = (
  payload: {
    productId: number;
    adminId: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["product-by-other-seller", payload],
    queryFn: async () => {
      const res = await getOneWithProductPrice(payload);
      return res.data;
    },

    enabled,
  });

export const useVendorDetails = (
  payload: {
    adminId: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["vendor-details", payload],
    queryFn: async () => {
      const res = await getVendorDetails(payload);
      return res.data;
    },

    enabled,
  });

export const useVendorProducts = (
  payload: {
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
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["vendor-products", payload],
    queryFn: async () => {
      const res = await getVendorProducts(payload);
      return res.data;
    },

    enabled,
  });

export const useOneProductByProductCondition = (
  payload: {
    productId: number;
    productPriceId: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["product-condition-by-id", payload],
    queryFn: async () => {
      const res = await getOneProductByProductCondition(payload);
      return res.data;
    },

    enabled,
  });

export const useUpdateProductPriceByProductCondition = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IUpdateProduct,
    APIResponseError,
    {
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
    }
  >({
    mutationFn: async (payload) => {
      const res = await updateProductPriceByProductCondition(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["managed-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["existing-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateProductStatus = () => {
  return useMutation<
    any, // Replace with the actual API response type
    APIResponseError,
    { productPriceId: number; status: string }
  >({
    mutationFn: async ({ productPriceId, status }) => {
      const res = await updateProductStatus({ productPriceId, status });
      return res.data;
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateSingleProduct = () => {
  return useMutation<
    any, // Replace with the actual API response type
    APIResponseError,
    {
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
    }
  >({
    mutationFn: async ({
      productPriceId,
      stock,
      askForPrice,
      askForStock,
      offerPrice,
      productPrice,
      status,
      productCondition,
      consumerType,
      sellType,
      deliveryAfter,
      timeOpen,
      timeClose,
      vendorDiscount,
      vendorDiscountType,
      consumerDiscount,
      consumerDiscountType,
      minQuantity,
      maxQuantity,
      minCustomer,
      maxCustomer,
      minQuantityPerCustomer,
      maxQuantityPerCustomer,
    }) => {
      const res = await updateSingleProducts({
        productPriceId,
        stock,
        askForPrice,
        askForStock,
        offerPrice,
        productPrice,
        status,
        productCondition,
        consumerType,
        sellType,
        deliveryAfter,
        timeOpen,
        timeClose,
        vendorDiscount,
        vendorDiscountType,
        consumerDiscount,
        consumerDiscountType,
        minQuantity,
        maxQuantity,
        minCustomer,
        maxCustomer,
        minQuantityPerCustomer,
        maxQuantityPerCustomer,
      });
      return res.data;
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useRemoveProduct = () => {
  return useMutation<
    any, // Replace with the actual API response type
    APIResponseError,
    { productPriceId: number }
  >({
    mutationFn: async ({ productPriceId }) => {
      const res = await removeProduct({ productPriceId });
      return res.data;
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation<any, APIResponseError, number[]>({
    mutationFn: async (productPriceId: number[]) => {
      const res = await fetchProductVariant(productPriceId);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });
};

export const useProductsByService = (
  serviceId: number,
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["products-by-service", serviceId, payload],
    queryFn: async () => {
      const res = await getProductsByService(serviceId, payload);
      return res.data;
    },

    enabled,
  });

// Mark product as dropshipable
export const useMarkProductAsDropshipable = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    APIResponseError,
    {
      productId: number;
      isDropshipable: boolean;
      dropshipCommission?: number;
      dropshipMinMarkup?: number;
      dropshipMaxMarkup?: number;
      dropshipSettings?: Record<string, unknown>;
    }
  >({
    mutationFn: async ({
      productId,
      isDropshipable,
      dropshipCommission,
      dropshipMinMarkup,
      dropshipMaxMarkup,
      dropshipSettings,
    }) => {
      const res = await markProductAsDropshipable(productId, {
        isDropshipable,
        dropshipCommission,
        dropshipMinMarkup,
        dropshipMaxMarkup,
        dropshipSettings,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-dropshipable-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dropship-analytics"],
      });
    },
  });
};

// Get vendor's dropshipable products
export const useMyDropshipableProducts = (payload: {
  page: number;
  limit: number;
}) =>
  useQuery({
    queryKey: ["my-dropshipable-products", payload],
    queryFn: async () => {
      const res = await getMyDropshipableProducts(payload);
      return res.data;
    },
  });

// Get dropship analytics
export const useDropshipAnalytics = () =>
  useQuery({
    queryKey: ["dropship-analytics"],
    queryFn: async () => {
      const res = await getDropshipAnalytics();
      return res.data;
    },
  });

// Bulk enable/disable dropshipping
export const useBulkUpdateDropshipable = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    APIResponseError,
    {
      productIds: number[];
      isDropshipable: boolean;
      dropshipCommission?: number;
      dropshipMinMarkup?: number;
      dropshipMaxMarkup?: number;
    }
  >({
    mutationFn: async (payload) => {
      const res = await bulkUpdateDropshipable(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-dropshipable-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dropship-analytics"],
      });
    },
  });
};

// Get wholesale products
export const useWholesaleProducts = (payload: {
  page: number;
  limit: number;
}) =>
  useQuery({
    queryKey: ["wholesale-products", payload],
    queryFn: async () => {
      const res = await getWholesaleProducts(payload);
      return res.data;
    },
  });

// Get wholesale dashboard
export const useWholesaleDashboard = () =>
  useQuery({
    queryKey: ["wholesale-dashboard"],
    queryFn: async () => {
      const res = await getWholesaleDashboard();
      return res.data;
    },
  });

// Get wholesale product sales
export const useWholesaleProductSales = (productId: number, enabled: boolean = true) =>
  useQuery({
    queryKey: ["wholesale-product-sales", productId],
    queryFn: async () => {
      const res = await getWholesaleProductSales(productId);
      return res.data;
    },
    enabled,
  });

// Get user's own dropshipable products (productType = D, isDropshipable = true)
export const useUserOwnDropshipableProducts = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    brandIds?: string;
    categoryIds?: string;
    status?: string;
    sort?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["user-own-dropshipable-products", payload],
    queryFn: async () => {
      const res = await getUserOwnDropshipableProducts(payload);
      return res.data;
    },
    enabled,
  });

// Get dropship products created from a specific original product
export const useDropshipProductsFromOriginal = (originalProductId: number, enabled = true) =>
  useQuery({
    queryKey: ["dropship-products-from-original", originalProductId],
    queryFn: async () => {
      const res = await getDropshipProductsFromOriginal(originalProductId);
      return res.data;
    },
    enabled: enabled && !!originalProductId,
  });

// Track product view
export const useTrackProductView = () => {
  return useMutation({
    mutationFn: (payload: { productId: number; deviceId?: string }) =>
      trackProductView(payload),
  });
};

// Track product click
export const useTrackProductClick = () => {
  return useMutation({
    mutationFn: (payload: { productId: number; clickSource?: string; deviceId?: string }) =>
      trackProductClick(payload),
  });
};

// Track product search
export const useTrackProductSearch = () => {
  return useMutation({
    mutationFn: (payload: { searchTerm: string; productId?: number; clicked?: boolean; deviceId?: string }) =>
      trackProductSearch(payload),
  });
};

export const useSearchSuggestions = (
  payload: { term: string; userId?: number; deviceId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["search-suggestions", payload],
    queryFn: async () => {
      const res = await fetchSearchSuggestions(payload);
      return res.data;
    },
    enabled: enabled && !!payload.term && payload.term.length >= 2,
  });

export const useAiSearch = (
  payload: {
    q: string;
    page?: number;
    limit?: number;
    userId?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["ai-search", payload],
    queryFn: async () => {
      const res = await fetchAiSearch(payload);
      return res.data;
    },
    enabled: enabled && !!payload.q && payload.q.length >= 3,
  });