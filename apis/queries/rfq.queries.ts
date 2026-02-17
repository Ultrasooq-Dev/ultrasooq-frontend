import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCustomizeProductApi,
  addFactoriesProductApi,
  addFactoriesQuotes,
  addProductDuplicateRfq,
  addRfqProduct,
  addRfqQuotes,
  deleteFactoriesCartItem,
  deleteRfqCartItem,
  deleteRfqQuote,
  fetchAllRfqQuotesByBuyerId,
  fetchAllRfqQuotesUsersByBuyerId,
  fetchAllRfqQuotesUsersBySellerId,
  fetchFactoriesCartByUserId,
  fetchFactoriesProducts,
  fetchFactoriesProductsByUserBusinessCategory,
  fetchOneRfqQuotesUsersByBuyerID,
  fetchRfqCartByUserId,
  fetchRfqProductById,
  fetchRfqProducts,
  hideRfqRequest,
  updateFactoriesCartWithLogin,
  updateRfqCartWithLogin,
  updateRfqProduct,
} from "../requests/rfq.requests";
import { AddRfqQuotesRequest, AddFactoriesQuotesRequest } from "@/utils/types/rfq.types";

export const useRfqProducts = (
  payload: {
    page: number;
    limit: number;
    term?: string;
    adminId?: string;
    sortType?: "newest" | "oldest";
    brandIds?: string;
    isOwner?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-products", payload],
    queryFn: async () => {
      const res = await fetchRfqProducts(payload);
      return res.data;
    },

    enabled,
  });

  export const useFactoriesProducts = (
    payload: {
      page: number;
      limit: number;
      term?: string;
      adminId?: string;
      sortType?: "newest" | "oldest";
      brandIds?: string;
      isOwner?: string;
      related?: boolean;
    },
    enabled = true,
  ) =>
    useQuery({
      queryKey: ["factoriesProducts", payload],
      queryFn: async () => {
        const res = await fetchFactoriesProducts(payload);
        return res.data;
      },

      enabled,
    });

    export const useFactoriesProductsByUserBusinessCategory = (
      payload: {
        page: number;
        limit: number;
        term?: string;
        adminId?: string;
        sortType?: "newest" | "oldest";
        brandIds?: string;
        isOwner?: string;
      },
      enabled = true,
    ) =>
      useQuery({
        queryKey: ["factoriesProducts", payload],
        queryFn: async () => {
          const res = await fetchFactoriesProductsByUserBusinessCategory(payload);
          return res.data;
        },
        // onError: (err: APIResponseError) => {
        //   console.log(err);
        // },
        enabled,
      });

export const useRfqProductById = (id: string, enabled = true) =>
  useQuery({
    queryKey: ["rfq-product-by-id", id],
    queryFn: async () => {
      const res = await fetchRfqProductById({ rfqProductId: id });
      return res.data;
    },

    enabled,
  });

export const useAddRfqProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      productNote: string;
      rfqProductName: string;
      rfqProductImagesList: { imageName: string; image: string }[];
    }
  >({
    mutationFn: async (payload) => {
      const res = await addRfqProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateRfqProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      rFqProductId: number;
      productNote: string;
      rfqProductName: string;
      rfqProductImagesList: { imageName: string; image: string }[];
    }
  >({
    mutationFn: async (payload) => {
      const res = await updateRfqProduct(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useRfqCartListByUserId = (
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-cart-by-user", payload],
    queryFn: async () => {
      const res = await fetchRfqCartByUserId(payload);
      return res.data;
    },

    enabled,
  });

  export const useFactoriesCartListByUserId = (
    payload: {
      page: number;
      limit: number;
    },
    enabled = true,
  ) =>
    useQuery({
      queryKey: ["factories-cart-by-user", payload],
      queryFn: async () => {
        const res = await fetchFactoriesCartByUserId(payload);
        return res.data;
      },

      enabled,
    });

export const useUpdateRfqCartWithLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number; quantity: number; productType?: "SAME" | "SIMILAR"; offerPriceFrom?: number; offerPriceTo?: number; note?: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateRfqCartWithLogin(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rfq-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateFactoriesCartWithLogin = () => 
  {
    const queryClient = useQueryClient();
    return useMutation<
      APIResponse,
      APIResponseError,
      { productId: number; quantity: number; customizeProductId: number }
    >({
      mutationFn: async (payload) => {
        const res = await updateFactoriesCartWithLogin(payload);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["factories-cart-by-user"],
        });
        queryClient.invalidateQueries({
          queryKey: ["factoriesProducts"],
        });
        // queryClient.invalidateQueries({
        //   queryKey: ["rfq-cart-count-with-login"],
        // });
      },
      onError: (err: APIResponseError) => {
      },
    });
  };

export const useAddFactoriesProduct = () => {
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number }
  >({
    mutationFn: async (payload) => {
      const res = await addFactoriesProductApi(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAddCustomizeProduct = () => {
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number, note: string, fromPrice: number, toPrice: number }
  >({
    mutationFn: async (payload) => {
      const res = await addCustomizeProductApi(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });
};

export const useDeleteRfqCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { rfqCartId: number }
  >({
    mutationFn: async (payload) => {
      const res = await deleteRfqCartItem(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["rfq-products"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useDeleteFactoriesCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { factoriesCartId: number }
  >({
    mutationFn: async (payload) => {
      const res = await deleteFactoriesCartItem(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["factories-cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["factoriesProducts"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};


export const useAllRfqQuotesByBuyerId = (
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-quotes-request", payload],
    queryFn: async () => {
      const res = await fetchAllRfqQuotesByBuyerId(payload);
      return res.data;
    },

    enabled,
  });

export const useAllRfqQuotesUsersByBuyerId = (
  payload: {
    page: number;
    limit: number;
    rfqQuotesId: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-quotes-users", payload],
    queryFn: async () => {
      const res = await fetchAllRfqQuotesUsersByBuyerId(payload);
      return res.data;
    },

    enabled,
  });

export const useFindOneRfqQuotesUsersByBuyerID = (
  payload: {
    rfqQuotesId?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-quotes-by-buyer-id", payload],
    queryFn: async () => {
      const res = await fetchOneRfqQuotesUsersByBuyerID(payload);
      return res.data;
    },

    enabled,
  });

export const useAllRfqQuotesUsersBySellerId = (
  payload: {
    page: number;
    limit: number;
    showHidden?: boolean;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["rfq-quotes-by-seller-id", payload],
    queryFn: async () => {
      const res = await fetchAllRfqQuotesUsersBySellerId(payload);
      return res.data;
    },

    enabled,
  });

export const useAddRfqQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    AddRfqQuotesRequest
  >({
    mutationFn: async (payload) => {
      const res = await addRfqQuotes(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-quotes-request"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAddFactoriesRequestQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    AddFactoriesQuotesRequest
  >({
    mutationFn: async (payload) => {
      const res = await addFactoriesQuotes(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["factories-cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["factories-quotes-request"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAddProductDuplicateRfq = () => {
  return useMutation<
    APIResponse,
    APIResponseError,
    { productId: number }
  >({
    mutationFn: async (payload) => {
      const res = await addProductDuplicateRfq(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });
};

export const useDeleteRfqQuote = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    {
      rfqQuotesId: number;
    }
  >({
    mutationFn: async (payload) => {
      const res = await deleteRfqQuote(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rfq-quotes-request"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useHideRfqRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { rfqQuotesUserId: number; isHidden: boolean }
  >({
    mutationFn: async (payload) => {
      const res = await hideRfqRequest(payload);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate all queries that start with "rfq-quotes-by-seller-id"
      // This includes both visible (showHidden: false) and hidden (showHidden: true) queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === "rfq-quotes-by-seller-id";
        },
      });
      // Force refetch to ensure data is updated immediately
      queryClient.refetchQueries({
        predicate: (query) => {
          return query.queryKey[0] === "rfq-quotes-by-seller-id";
        },
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
