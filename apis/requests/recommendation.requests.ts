import http from '../http';

export interface RecommendedProduct {
  productId: number;
  productName: string;
  image: string;
  price: number;
  sellerId: number;
  sellerName: string;
  category: string;
  score: number;
  reason: string;
  recId: string;
}

export interface RecommendationResponse {
  items: RecommendedProduct[];
  algorithm: string;
  segment: string;
  cached: boolean;
}

export const fetchPersonalRecs = async (
  limit = 20,
): Promise<RecommendationResponse> => {
  const { data } = await http.get('/recommendations/personal', {
    params: { limit },
  });
  return data;
};

export const fetchProductRecs = async (
  productId: number,
  type: 'similar' | 'cobought' | 'crosssell' = 'similar',
  limit = 10,
): Promise<RecommendationResponse> => {
  const { data } = await http.get(`/recommendations/product/${productId}`, {
    params: { type, limit },
  });
  return data;
};

export const fetchTrendingRecs = async (
  categoryId?: number,
  limit = 20,
): Promise<RecommendationResponse> => {
  const { data } = await http.get('/recommendations/trending', {
    params: { categoryId, limit },
  });
  return data;
};

export const postRecommendationFeedback = async (feedback: {
  recId: string;
  productId: number;
  action: 'impression' | 'click' | 'cart' | 'purchase' | 'dismiss';
  placement?: string;
  position?: number;
  algorithm?: string;
}): Promise<void> => {
  await http.post('/recommendations/feedback', feedback);
};
