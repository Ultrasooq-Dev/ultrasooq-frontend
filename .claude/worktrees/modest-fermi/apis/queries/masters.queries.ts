import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createBrand,
  fetchBrands,
  fetchCountries,
  fetchLocation,
  fetchAllCountry,
  fetchStatesByCountry,
  fetchCitiesByState,
  createUserRole,
  fetchuserRoles,
  updateUserRole,
  fetchuserRolesWithPagination,
  deleteMemberRole,
  copyUserRole
} from "../requests/masters.requests";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";

export const useCountries = (enabled = true) =>
  useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetchCountries();
      return res.data;
    },

    enabled,
  });

export const useBrands = (payload: { term?: string, addedBy?: number, type?: string }, enabled = true) =>
  useQuery({
    queryKey: ["brands", payload],
    queryFn: async () => {
      const res = await fetchBrands(payload);
      return res.data;
    },

    enabled,
  });

export const useUserRoles = (enabled = true) =>
  useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const res = await fetchuserRoles();
      return res.data;
    },

    enabled,
  });

export const useUserRolesWithPagination = (payload: { page: number; limit: number; }, enabled = true) =>
  useQuery({
    queryKey: ["userRoles", payload],
    queryFn: async () => {
      const res = await fetchuserRolesWithPagination(payload);
      return res.data;
    },

    enabled,
  });

export const useDeleteMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { id: number }
  >({
    mutationFn: async (payload) => {
      const res = await deleteMemberRole(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userRoles"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
}



export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { brandName: string }
  >({
    mutationFn: async (payload) => {
      const res = await createBrand(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["brands"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { userRoleName: string }
  >({
    mutationFn: async (payload) => {
      const res = await createUserRole(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userRoles"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCopyUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { userRoleId: number }
  >({
    mutationFn: async (payload) => {
      const res = await copyUserRole(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userRoles"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { userRoleName: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateUserRole(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userRoles"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
}

export const useLocation = (enabled = true) =>
  useQuery({
    queryKey: ["location"],
    queryFn: async () => {
      const res = await fetchLocation();
      return res.data;
    },

    enabled,
  });

export const useAllCountries = (enabled = true) =>
  useQuery({
    queryKey: ["allCountry"],
    queryFn: async () => {
      const res = await fetchAllCountry();
      return res.data;
    },

    enabled,
  });

export const useFetchStatesByCountry = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { countryId: number } // Payload Type
  >({
    mutationFn: async (payload) => {
      const res = await fetchStatesByCountry(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stateByCountry"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useFetchCitiesByState = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { stateId: number } // Payload Type
  >({
    mutationFn: async (payload) => {
      const res = await fetchCitiesByState(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cityByState"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};



