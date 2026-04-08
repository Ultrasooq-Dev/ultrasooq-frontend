'use client';

import { RecommendationCarousel } from './RecommendationCarousel';
import { usePersonalRecs, useTrendingRecs } from '@/apis/queries/recommendation.queries';

export function HomeRecommendations() {
  const { data: personal } = usePersonalRecs(20);
  const { data: trending } = useTrendingRecs(undefined, 20);

  return (
    <div className="space-y-6">
      {personal?.items && personal.items.length > 0 && (
        <RecommendationCarousel
          title="Recommended for You"
          products={personal.items}
          placement="homepage"
        />
      )}
      {trending?.items && trending.items.length > 0 && (
        <RecommendationCarousel
          title="Trending Now"
          products={trending.items}
          placement="homepage"
        />
      )}
    </div>
  );
}
