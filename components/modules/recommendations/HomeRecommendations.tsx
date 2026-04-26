'use client';

import { useTranslations } from 'next-intl';
import { RecommendationCarousel } from './RecommendationCarousel';
import { usePersonalRecs, useTrendingRecs } from '@/apis/queries/recommendation.queries';

export function HomeRecommendations() {
  const t = useTranslations();
  const { data: personal } = usePersonalRecs(20);
  const { data: trending } = useTrendingRecs(undefined, 20);

  const personalItems = personal?.items ?? [];
  const trendingItems = trending?.items ?? [];

  if (personalItems.length === 0 && trendingItems.length === 0) return null;

  return (
    <>
      {personalItems.length > 0 && (
        <RecommendationCarousel
          title={t('recommended_products')}
          subtitle={t('recommended')}
          products={personalItems}
          placement="homepage"
          sectionClass="bg-card"
        />
      )}
      {trendingItems.length > 0 && (
        <RecommendationCarousel
          title={t('trending_now')}
          subtitle={t('trending_n_high_rate_product')}
          products={trendingItems}
          placement="homepage"
          sectionClass="bg-muted/40"
        />
      )}
    </>
  );
}
