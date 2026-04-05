import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchHelpCenterQueries, submitQuery } from "../requests/help-center.requests";

export const useHelpCenterQueries = (
  payload: {
    page: number;
    limit: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ["help_center_queries", payload],
    queryFn: async () => {
      const res = await fetchHelpCenterQueries(payload);
      return res.data;
    },
    enabled,
  });

export const useSubmitQuery = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { userId?: number; email: string; query: string; }
  >({
    mutationFn: async (payload) => {
      const res = await submitQuery(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["help_center_queries"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
}