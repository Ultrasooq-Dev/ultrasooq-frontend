import { useMutation, useQuery } from "@tanstack/react-query";
import { APIResponseError } from "@/utils/types/common.types";
import {
  createCompanyBranch,
  createCompanyProfile,
  fetchCompanyBranchById,
  updateCompanyBranch,
  updateCompanyProfile,
} from "../requests/company.requests";
import { useQueryClient } from "@tanstack/react-query";
import {
  ICompany,
  ICreateCompanyBranch,
  ICreateCompanyBranchRequest,
  IEditCompanyBranch,
  IEditCompanyBranchRequest,
  IEditCompanyProfile,
  IEditCompanyProfileRequest,
} from "@/utils/types/user.types";

export const useCreateCompanyProfile = () => {
  const queryClient = useQueryClient();

  //TODO: add types definition
  return useMutation<ICompany, APIResponseError, {}>({
    mutationFn: async (payload) => {
      const res = await createCompanyProfile(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["me"],
      });
      queryClient.invalidateQueries({
        queryKey: ["unique-user"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IEditCompanyProfile,
    APIResponseError,
    IEditCompanyProfileRequest
  >({
    mutationFn: async (payload) => {
      const res = await updateCompanyProfile(payload as any);
      return res.data;
    },
    onSuccess: () => {
      // Remove queries from cache completely
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["unique-user"] });

      // Then invalidate and force refetch
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["unique-user"] });

      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ["me"] });
      queryClient.refetchQueries({ queryKey: ["unique-user"] });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useUpdateCompanyBranch = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IEditCompanyBranch,
    APIResponseError,
    IEditCompanyBranchRequest
  >({
    mutationFn: async (payload) => {
      const res = await updateCompanyBranch(payload as any);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["me"],
      });
      queryClient.invalidateQueries({
        queryKey: ["unique-user"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useCreateCompanyBranch = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ICreateCompanyBranch,
    APIResponseError,
    ICreateCompanyBranchRequest
  >({
    mutationFn: async (payload) => {
      const res = await createCompanyBranch(payload as any);
      return res.data;
    },
    onSuccess: () => {
      // Remove queries from cache completely
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["unique-user"] });

      // Then invalidate and force refetch
      queryClient.invalidateQueries({
        queryKey: ["me"],
      });
      queryClient.invalidateQueries({
        queryKey: ["unique-user"],
      });

      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ["me"] });
      queryClient.refetchQueries({ queryKey: ["unique-user"] });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useFetchCompanyBranchById = (id: string, enabled = true) =>
  useQuery({
    queryKey: ["branch-by-id", id],
    queryFn: async () => {
      const res = await fetchCompanyBranchById({ branchId: id });
      return res.data;
    },
    enabled,
  });
