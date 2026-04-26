'use client';

import { useTranslations } from 'next-intl';
import { RecommendationCarousel } from '@/components/modules/recommendations/RecommendationCarousel';
import { useProductRecs } from '@/apis/queries/recommendation.queries';

interface ProductRecommendationsProps {
  productId: string | number;
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const t = useTranslations();
  const { data: similar } = useProductRecs(productId as any, 'similar', 10);
  const { data: cobought } = useProductRecs(productId as any, 'cobought', 10);

  return (
    <div className="mt-8 space-y-6">
      {similar?.items && similar.items.length > 0 && (
        <RecommendationCarousel
          title={t('similar_products')}
          products={similar.items}
          placement="product_page"
        />
      )}
      {cobought?.items && cobought.items.length > 0 && (
        <RecommendationCarousel
          title={t('customers_also_bought_title')}
          products={cobought.items}
          placement="product_page"
        />
      )}
    </div>
  );
}
