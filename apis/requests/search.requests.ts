import http from '../http';
import { getApiUrl } from '@/config/api';

export interface UnifiedSearchResponse {
  status: boolean;
  parsed: {
    type: 'single' | 'multi' | 'shopping_list' | 'browse';
    language: string;
    queryCount: number;
    wasRewritten?: boolean;
  };
  data: any;
  totalCount: number;
  didYouMean?: string | null;
  autoCorrected?: { from: string; to: string } | null;
  rewritten?: { from: string; to: string } | null;
}

export const fetchUnifiedSearch = async (
  query: string,
  params?: {
    page?: number;
    limit?: number;
    sort?: string;
    brandIds?: string;
    categoryIds?: string;
    priceMin?: number;
    priceMax?: number;
    productType?: string;
    sellType?: string;
    hasDiscount?: string;
    isCustomProduct?: string;
  },
): Promise<UnifiedSearchResponse> => {
  const { data } = await http.get(`${getApiUrl()}/product/search/unified`, {
    params: { q: query, ...params },
  });
  return data;
};
