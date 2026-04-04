import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAddress,
  deleteAddress,
  fetchAddressById,
  fetchAllUserAddress,
  updateAddress,
} from "../requests/address.requests";
import {
  AddressCreateRequest,
  AddressUpdateRequest,
} from "@/utils/types/address.types";

export const useAllUserAddress = (
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["address", payload],
    queryFn: async () => {
      const res = await fetchAllUserAddress(payload);
      return res.data;
    },
    enabled,
  });

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    AddressCreateRequest
  >({
    mutationFn: async (payload) => {
      const res = await addAddress(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["address"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    AddressUpdateRequest
  >({
    mutationFn: async (payload) => {
      const res = await updateAddress(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["address"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useAddressById = (id: string, enabled = true) =>
  useQuery({
    queryKey: ["address-by-id", id],
    queryFn: async () => {
      const res = await fetchAddressById({ userAddressId: id });
      return res.data;
    },
    enabled,
  });

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { userAddressId: number }
  >({
    mutationFn: async (payload) => {
      const res = await deleteAddress(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["address"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
