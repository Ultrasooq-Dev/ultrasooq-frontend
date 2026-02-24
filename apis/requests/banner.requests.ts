import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

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
  return axios({
    method: "GET",
    url: `${getApiUrl()}/banner/active`,
    params,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

// Get all banners (admin)
export const fetchAllBanners = (params?: { page?: number; limit?: number; position?: string }) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/banner`,
    params,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Get single banner
export const fetchBannerById = (id: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/banner/${id}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Create banner (admin)
export const createBanner = (payload: ICreateBanner) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/banner`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Update banner (admin)
export const updateBanner = (id: number, payload: Partial<ICreateBanner>) => {
  return axios({
    method: "PUT",
    url: `${getApiUrl()}/banner/${id}`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Delete banner (admin)
export const deleteBanner = (id: number) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/banner/${id}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Toggle banner status (admin)
export const toggleBannerStatus = (id: number, isActive: boolean) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/banner/${id}/status`,
    data: { isActive },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Update banner priority (admin)
export const updateBannerPriority = (id: number, priority: number) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/banner/${id}/priority`,
    data: { priority },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

// Track banner click
export const trackBannerClick = (id: number) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/banner/${id}/track-click`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

// Track banner view
export const trackBannerView = (id: number) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/banner/${id}/track-view`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

// Get banner analytics (admin)
export const fetchBannerAnalytics = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/banner/analytics`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
    },
  });
};

