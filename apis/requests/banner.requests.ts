import http from "../http";

export interface IBanner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  position: 'MAIN' | 'SIDE_TOP' | 'SIDE_BOTTOM' | 'FULL_WIDTH' | 'POPUP';
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  clicks: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateBanner {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  position: 'MAIN' | 'SIDE_TOP' | 'SIDE_BOTTOM' | 'FULL_WIDTH' | 'POPUP';
  priority?: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
}

export interface IBannerAnalytics {
  totalBanners: number;
  activeBanners: number;
  totalClicks: number;
  totalViews: number;
  clickThroughRate: number;
  topBanners: IBanner[];
}

// Get all active banners (public)
export const fetchActiveBanners = (position?: string) => {
  const params = position ? { position } : {};
  return http({
    method: "GET",
    url: "/banner/active",
    params,
  });
};

// Get all banners (admin)
export const fetchAllBanners = (params?: { page?: number; limit?: number; position?: string }) => {
  return http({
    method: "GET",
    url: "/banner",
    params,
  });
};

// Get single banner
export const fetchBannerById = (id: number) => {
  return http({
    method: "GET",
    url: `/banner/${id}`,
  });
};

// Create banner (admin)
export const createBanner = (payload: ICreateBanner) => {
  return http({
    method: "POST",
    url: "/banner",
    data: payload,
  });
};

// Update banner (admin)
export const updateBanner = (id: number, payload: Partial<ICreateBanner>) => {
  return http({
    method: "PUT",
    url: `/banner/${id}`,
    data: payload,
  });
};

// Delete banner (admin)
export const deleteBanner = (id: number) => {
  return http({
    method: "DELETE",
    url: `/banner/${id}`,
  });
};

// Toggle banner status (admin)
export const toggleBannerStatus = (id: number, isActive: boolean) => {
  return http({
    method: "PATCH",
    url: `/banner/${id}/status`,
    data: { isActive },
  });
};

// Update banner priority (admin)
export const updateBannerPriority = (id: number, priority: number) => {
  return http({
    method: "PATCH",
    url: `/banner/${id}/priority`,
    data: { priority },
  });
};

// Track banner click
export const trackBannerClick = (id: number) => {
  return http({
    method: "POST",
    url: `/banner/${id}/track-click`,
  });
};

// Track banner view
export const trackBannerView = (id: number) => {
  return http({
    method: "POST",
    url: `/banner/${id}/track-view`,
  });
};

// Get banner analytics (admin)
export const fetchBannerAnalytics = () => {
  return http({
    method: "GET",
    url: "/banner/analytics",
  });
};
