'use client';

import { RecommendedProduct } from '@/apis/requests/recommendation.requests';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationCarouselProps {
  title: string;
  subtitle?: string;
  products: RecommendedProduct[];
  placement: string;
  sectionClass?: string;
}

export function RecommendationCarousel({
  title,
  subtitle,
  products,
  placement,
  sectionClass = '',
}: RecommendationCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section
      className={`${sectionClass} w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20`}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 sm:mb-12">
          <h2
            className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl"
            translate="no"
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-muted-foreground max-w-2xl text-sm sm:text-base"
              translate="no"
            >
              {subtitle}
            </p>
          )}
        </div>
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
      </div>
    </section>
  );
}
