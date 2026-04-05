import { useQuery } from '@tanstack/react-query';
import {
  fetchPersonalRecs,
  fetchProductRecs,
  fetchTrendingRecs,
  fetchCartRecs,
  fetchPostPurchaseRecs,
} from '../requests/recommendation.requests';

export const usePersonalRecs = (limit = 20, enabled = true) =>
  useQuery({
    queryKey: ['recommendations', 'personal', limit],
    queryFn: () => fetchPersonalRecs(limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useProductRecs = (
  productId: number,
  type: 'similar' | 'cobought' | 'crosssell' = 'similar',
  limit = 10,
  enabled = true,
) =>
  useQuery({
    queryKey: ['recommendations', 'product', productId, type, limit],
    queryFn: () => fetchProductRecs(productId, type, limit),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000,
  });

export const useTrendingRecs = (
  categoryId?: number,
  limit = 20,
  enabled = true,
) =>
  useQuery({
    queryKey: ['recommendations', 'trending', categoryId, limit],
    queryFn: () => fetchTrendingRecs(categoryId, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useCartRecs = (limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['recommendations', 'cart', limit],
    queryFn: () => fetchCartRecs(limit),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

export const usePostPurchaseRecs = (orderId: number, limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['recommendations', 'post-purchase', orderId, limit],
    queryFn: () => fetchPostPurchaseRecs(orderId, limit),
    enabled: enabled && !!orderId,
    staleTime: 5 * 60 * 1000,
  });
