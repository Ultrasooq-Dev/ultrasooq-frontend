import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActiveBanners,
  fetchAllBanners,
  fetchBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBannerPriority,
  trackBannerClick,
  trackBannerView,
  fetchBannerAnalytics,
  ICreateBanner,
  IBanner,
} from "../requests/banner.requests";

// Get active banners (public)
export const useActiveBanners = (position?: string, enabled = true) =>
  useQuery({
    queryKey: ["banners", "active", position],
    queryFn: async () => {
      const res = await fetchActiveBanners(position);
      // Backend returns { status, message, data: [...] }
      // Return the data array directly
      return res.data?.data || res.data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

// Get all banners (admin)
export const useAllBanners = (
  params?: { page?: number; limit?: number; position?: string },
  enabled = true
) =>
  useQuery({
    queryKey: ["banners", "all", params],
    queryFn: async () => {
      const res = await fetchAllBanners(params);
      return res.data;
    },
    enabled,
  });

// Get single banner
export const useBannerById = (id: number, enabled = true) =>
  useQuery({
    queryKey: ["banner", id],
    queryFn: async () => {
      const res = await fetchBannerById(id);
      return res.data;
    },
    enabled: enabled && !!id,
  });

// Create banner mutation (admin)
export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateBanner) => createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Update banner mutation (admin)
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ICreateBanner> }) =>
      updateBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Delete banner mutation (admin)
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Toggle banner status mutation (admin)
export const useToggleBannerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleBannerStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Update priority mutation (admin)
export const useUpdateBannerPriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: number }) =>
      updateBannerPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

// Track click mutation
export const useTrackBannerClick = () => {
  return useMutation({
    mutationFn: (id: number) => trackBannerClick(id),
  });
};

// Track view mutation
export const useTrackBannerView = () => {
  return useMutation({
    mutationFn: (id: number) => trackBannerView(id),
  });
};

// Get analytics query (admin)
export const useBannerAnalytics = (enabled = true) =>
  useQuery({
    queryKey: ["banners", "analytics"],
    queryFn: async () => {
      const res = await fetchBannerAnalytics();
      return res.data;
    },
    enabled,
  });

