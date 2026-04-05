import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIResponseError, APIResponse } from "@/utils/types/common.types";
import {
    addSellerReward,
    createShareLink,
    fetchSellerRewards,
    fetchShareLinks,
    fetchShareLinksBySellerRewardId
} from "../requests/seller-reward.requests";

export const useSellerRewards = (
    payload: {
        page: number;
        limit: number;
        term?: string;
        productId?: string;
        sortType?: "asc" | "desc";
    },
    enabled = true,
) =>
    useQuery({
        queryKey: ["seller_rewards", payload],
        queryFn: async () => {
            const res = await fetchSellerRewards(payload);
            return res.data;
        },
        enabled,
    });

export const useAddSellerReward = () => {
    const queryClient = useQueryClient();
    return useMutation<
        APIResponse,
        APIResponseError,
        { 
            productId: number;
            startTime: string;
            endTime: string;
            rewardPercentage: number;
            rewardFixAmount: number;
            minimumOrder: number;
            stock: number;
        }
    >({
        mutationFn: async (payload) => {
            const res = await addSellerReward(payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["seller_rewards"],
            });
        },
        onError: (err: APIResponseError) => {
        },
    });
};

export const useShareLinks = (
    payload: {
        page: number;
        limit: number;
        productId?: string;
        sortType?: "asc" | "desc";
    },
    enabled = true,
) =>
    useQuery({
        queryKey: ["share_links", payload],
        queryFn: async () => {
            const res = await fetchShareLinks(payload);
            return res.data;
        },
        enabled,
    });

export const useCreateShareLink = () => {
    const queryClient = useQueryClient();
    return useMutation<
        APIResponse,
        APIResponseError,
        { sellerRewardId: number; }
    >({
        mutationFn: async (payload) => {
            const res = await createShareLink(payload);
            return res.data;
        },
        onSuccess: () => {},
        onError: (err: APIResponseError) => {
        },
    });
};

export const useShareLinksBySellerReward = (
    payload: {
        page: number;
        limit: number;
        term?: string;
        sellerRewardId?: string;
        sortType?: "asc" | "desc";
    },
    enabled = true,
) =>
    useQuery({
        queryKey: ["share_links_by_reward", payload],
        queryFn: async () => {
            const res = await fetchShareLinksBySellerRewardId(payload);
            return res.data;
        },
        enabled,
    });