import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addServiceToCart, createService, fetchAllServices, fetchServiceById, fetchServicesByOtherSeller, fetchServicesByProductCategory, fetchServicesBySeller, updateService } from "../requests/services.requests";

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation<APIResponse, APIResponseError, Record<string, unknown>>({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await createService(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-services"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation<APIResponse, APIResponseError, Record<string, unknown>>({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await updateService(payload);
      return res.data as APIResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-services"],
      });
      queryClient.invalidateQueries({
        queryKey: ["service-by-id"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
export const useGetAllServices = (payload: { page: number; limit: number; term?: string; sort?: string; userId?: number; ownService?: boolean }, enabled = true,) => useQuery({
  queryKey: ["all-services", payload],
  queryFn: async () => {
    const res = await fetchAllServices(payload);
    return res.data;
  },

  enabled,
});

export const useServiceById = (
  payload: { serviceid: string; userId?: number; sharedLinkId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["service-by-id", payload],
    queryFn: async () => {
      const res = await fetchServiceById(payload);
      return res.data;
    },
    enabled,
    gcTime: 0, // Disables caching by setting garbage collection time to 0
  });

export const useGetServicesBySeller = (payload: { page: number; limit: number; sellerId: number, fromCityId?: number, toCityId?: number }, enabled = true,) => useQuery({
  queryKey: ["services-by-seller", payload],
  queryFn: async () => {
    const res = await fetchServicesBySeller(payload);
    return res.data;
  },

  enabled,
});

export const useGetServicesByOtherSeller = (payload: { page: number; limit: number; sellerId: number, fromCityId?: number, toCityId?: number }, enabled = true,) => useQuery({
  queryKey: ["services-by-other-seller", payload],
  queryFn: async () => {
    const res = await fetchServicesByOtherSeller(payload);
    return res.data;
  },

  enabled,
});

export const useAddServiceToCart = () => {
  const queryClient = useQueryClient();
  return useMutation<APIResponse, APIResponseError, number[]>({
    mutationFn: async (payload: number[]) => {
      const res = await addServiceToCart(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart-by-user"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-by-device"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-with-login"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cart-count-without-login"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useGetServicesByProductCategory = (payload: { categoryId: string; page: number; limit: number; }, enabled = true,) => useQuery({
  queryKey: ["services-by-product-category", payload],
  queryFn: async () => {
    const res = await fetchServicesByProductCategory(payload);
    return res.data;
  },

  enabled,
});
