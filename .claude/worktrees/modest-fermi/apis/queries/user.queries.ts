import { APIResponseError } from "@/utils/types/common.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchMe,
  fetchUniqueUser,
  fetchUserBusinessCategories,
  updateUserProfile,
} from "../requests/user.requests";
import { IBuyer, IBuyerRequest } from "@/utils/types/user.types";
import { useQueryClient } from "@tanstack/react-query";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IBuyer,
    APIResponseError,
    IBuyerRequest | { tradeRole: string }
  >({
    mutationFn: async (payload) => {
      const res = await updateUserProfile(payload as any);
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

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchMe();
      return res.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - prevents excessive re-fetching
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cached data available
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    retry: 1, // Retry once on failure before giving up
    retryDelay: 2000,
  });

export const useUniqueUser = (
  payload: { userId: number | undefined },
  enabled = true,
) =>
  useQuery({
    queryKey: ["unique-user", payload],
    queryFn: async () => {
      const res = await fetchUniqueUser(payload);
      return res.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

export const useUserBusinessCategories = (enabled = true) =>
  useQuery({
    queryKey: ["user-busienss-categories"],
    queryFn: async () => {
      const res = await fetchUserBusinessCategories();
      return res.data;
    },
    enabled,
  });
