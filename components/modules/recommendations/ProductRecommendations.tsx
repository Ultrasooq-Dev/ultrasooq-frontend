'use client';

import { RecommendationCarousel } from '@/components/modules/recommendations/RecommendationCarousel';
import { useProductRecs } from '@/apis/queries/recommendation.queries';

interface ProductRecommendationsProps {
  productId: number;
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { data: similar } = useProductRecs(productId, 'similar', 10);
  const { data: cobought } = useProductRecs(productId, 'cobought', 10);

  return (
    <div className="mt-8 space-y-6">
      {similar?.items && similar.items.length > 0 && (
        <RecommendationCarousel
          title="Similar Products"
          products={similar.items}
          placement="product_page"
        />
      )}
      {cobought?.items && cobought.items.length > 0 && (
        <RecommendationCarousel
          title="Customers Also Bought"
          products={cobought.items}
          placement="product_page"
        />
      )}
    </div>
  );
}
