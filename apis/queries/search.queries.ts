import { useQuery } from '@tanstack/react-query';
import { fetchUnifiedSearch } from '../requests/search.requests';

export const useUnifiedSearch = (
  query: string,
  params?: {
    page?: number;
    limit?: number;
    sort?: string;
    brandIds?: string;
    categoryIds?: string;
    priceMin?: number;
    priceMax?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['unified-search', query, params],
    queryFn: () => fetchUnifiedSearch(query, params),
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 30 * 1000,
  });
