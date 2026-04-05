import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, fetchTags } from "../requests/tags.requests";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";

export const useTags = (enabled = true) =>
  useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetchTags();
      return res.data;
    },
    enabled,
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation<
    APIResponse,
    APIResponseError,
    { tagName: string }
  >({
    mutationFn: async (payload) => {
      const res = await createTag(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};
