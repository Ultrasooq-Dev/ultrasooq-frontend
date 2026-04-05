'use client';

import { RecommendationCarousel } from './RecommendationCarousel';
import { useCartRecs } from '@/apis/queries/recommendation.queries';

interface CartRecommendationsProps {
  enabled?: boolean;
}

export function CartRecommendations({ enabled = true }: CartRecommendationsProps) {
  const { data } = useCartRecs(10, enabled);

  if (!data?.items || data.items.length === 0) return null;

  return (
    <RecommendationCarousel
      title="Complete Your Order"
      products={data.items}
      placement="cart"
    />
  );
}
