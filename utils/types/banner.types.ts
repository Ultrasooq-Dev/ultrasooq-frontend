export interface IBanner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  position: 'main' | 'side-top' | 'side-bottom' | 'full-width' | 'popup';
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
  position: 'main' | 'side-top' | 'side-bottom' | 'full-width' | 'popup';
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

export interface IBannerResponse {
  status: boolean;
  message: string;
  data: IBanner | IBanner[] | {
    banners: IBanner[];
    total: number;
    page: number;
    limit: number;
  };
}

