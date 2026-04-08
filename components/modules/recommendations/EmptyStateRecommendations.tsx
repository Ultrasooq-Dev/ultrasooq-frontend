'use client';

import { RecommendationCarousel } from './RecommendationCarousel';
import { usePersonalRecs, useTrendingRecs } from '@/apis/queries/recommendation.queries';

interface EmptyStateRecommendationsProps {
  type: 'cart' | 'search';
  categoryId?: number;
}

export function EmptyStateRecommendations({ type, categoryId }: EmptyStateRecommendationsProps) {
  const { data: personal } = usePersonalRecs(10);
  const { data: trending } = useTrendingRecs(categoryId, 10);

  const title =
    type === 'cart'
      ? 'You might like these products'
      : 'Popular products you might be looking for';

  const products = personal?.items?.length ? personal.items : trending?.items || [];

  if (products.length === 0) return null;

  return (
    <RecommendationCarousel
      title={title}
      products={products}
      placement={`empty_${type}`}
    />
  );
}
