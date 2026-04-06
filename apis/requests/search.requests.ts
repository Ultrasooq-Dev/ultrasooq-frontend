import http from '../http';

export interface UnifiedSearchResponse {
  status: boolean;
  parsed: {
    type: 'single' | 'multi' | 'shopping_list';
    language: string;
    queryCount: number;
  };
  data: any;
  totalCount: number;
  didYouMean?: string | null;
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
  },
): Promise<UnifiedSearchResponse> => {
  const { data } = await http.get('/product/search/unified', {
    params: { q: query, ...params },
  });
  return data;
};
