import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import { createMember, fetchAllMembers, fetchPermissions, updateMember, setPermission, fetchPermissionByRoleId, updatePermission } from "../requests/member.requests";

export const useCreateMember = () => {
  const queryClient = useQueryClient();
    return useMutation<
      APIResponse,
      APIResponseError,
      Record<string, unknown>
    >({
      mutationFn: async (payload) => {
        const res = await createMember(payload);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["members"],
        });
      },
      onError: (err: APIResponseError) => {
      },
    });
  };

  export const useUpdateMember = () => {
    const queryClient = useQueryClient();
      return useMutation<
        APIResponse,
        APIResponseError,
        Record<string, unknown>
      >({
        mutationFn: async (payload) => {
          const res = await updateMember(payload);
          return res.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["members"],
          });
        },
        onError: (err: APIResponseError) => {
        },
      });
    };

  export const useAllMembers  = (payload: { page: number; limit: number;},enabled = true) =>
      useQuery({
        queryKey: ["members", payload],
        queryFn: async () => {
          const res = await fetchAllMembers(payload);
          return res.data;
        },
        enabled,
  });

  export const usePermissions = (enabled = true) =>
    useQuery({
      queryKey: ["permissions"],
      queryFn: async () => {
        const res = await fetchPermissions();
        return res.data;
      },
      enabled,
    });

    export const useSetPermission = () => {
      const queryClient = useQueryClient();
      return useMutation<
        APIResponse,
        APIResponseError,
        Record<string, unknown>
      >({
        mutationFn: async (payload) => {
          const res = await setPermission(payload);
          return res.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["setPermission"],
          });
        },
        onError: (err: APIResponseError) => {
        },
      });
    };

    export const useGetPermission = (payload: { userRoleId: number},enabled = true) =>
          useQuery({
            queryKey: ["setPermission", payload],
            queryFn: async () => {
              const res = await fetchPermissionByRoleId(payload);
              return res.data;
            },
            enabled,
          });

  export const useUpdatePermission = () => {
    const queryClient = useQueryClient();
    return useMutation<
      APIResponse,
      APIResponseError,
      Record<string, unknown>
    >({
      mutationFn: async (payload) => {
        const res = await updatePermission(payload);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["setPermission"],
        });
      },
      onError: (err: APIResponseError) => {
      },
    });
  };
        
    