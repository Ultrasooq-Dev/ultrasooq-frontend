import { useQuery } from '@tanstack/react-query'
import {
  fetchVendorOverview,
  fetchVendorProducts,
  fetchVendorProductDetail,
  fetchVendorFunnel,
  fetchVendorReviews,
} from '../requests/vendor-analytics.requests'

export const useVendorOverview = (days = 30) =>
  useQuery({
    queryKey: ['vendor-analytics', 'overview', days],
    queryFn: () => fetchVendorOverview({ days }).then((r) => r.data),
    staleTime: 60_000,
  })

export const useVendorProducts = (days = 30, page = 1, limit = 20) =>
  useQuery({
    queryKey: ['vendor-analytics', 'products', days, page, limit],
    queryFn: () => fetchVendorProducts({ days, page, limit }).then((r) => r.data),
    staleTime: 60_000,
  })

export const useVendorProductDetail = (productPriceId: number | null, days = 30) =>
  useQuery({
    queryKey: ['vendor-analytics', 'product-detail', productPriceId, days],
    queryFn: () => fetchVendorProductDetail(productPriceId!, { days }).then((r) => r.data),
    enabled: !!productPriceId,
    staleTime: 60_000,
  })

export const useVendorFunnel = (days = 30) =>
  useQuery({
    queryKey: ['vendor-analytics', 'funnel', days],
    queryFn: () => fetchVendorFunnel({ days }).then((r) => r.data),
    staleTime: 60_000,
  })

export const useVendorReviews = (page = 1, limit = 20) =>
  useQuery({
    queryKey: ['vendor-analytics', 'reviews', page, limit],
    queryFn: () => fetchVendorReviews({ page, limit }).then((r) => r.data),
    staleTime: 60_000,
  })
