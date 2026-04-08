'use client';

import { RecommendedProduct } from '@/apis/requests/recommendation.requests';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationCarouselProps {
  title: string;
  products: RecommendedProduct[];
  placement: string;
}

export function RecommendationCarousel({
  title,
  products,
  placement,
}: RecommendationCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-4">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((product, index) => (
          <RecommendationCard
            key={product.productId}
            product={product}
            placement={placement}
            position={index + 1}
          />
        ))}
      </div>
    </section>
  );
}
