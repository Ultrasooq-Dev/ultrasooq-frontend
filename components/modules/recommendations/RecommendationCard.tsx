'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  RecommendedProduct,
  postRecommendationFeedback,
} from '@/apis/requests/recommendation.requests';
import { useRecommendationImpression } from './useRecommendationImpression';
import { RecommendationReason } from './RecommendationReason';

interface RecommendationCardProps {
  product: RecommendedProduct;
  placement: string;
  position: number;
}

export function RecommendationCard({
  product,
  placement,
  position,
}: RecommendationCardProps) {
  const ref = useRecommendationImpression(
    product.recId,
    product.productId,
    placement,
    position,
  );

  const handleClick = () => {
    postRecommendationFeedback({
      recId: product.recId,
      productId: product.productId,
      action: 'click',
      placement,
      position,
      algorithm: product.recId.split('_')[2],
    });
  };

  return (
    <div ref={ref} className="min-w-[200px] flex-shrink-0 snap-start">
      <Link
        href={`/product/${product.productId}`}
        onClick={handleClick}
        className="block rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
      >
        <div className="relative mb-2 aspect-square overflow-hidden rounded-md">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.productName}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <p className="line-clamp-2 text-sm font-medium">
          {product.productName}
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(product.price)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.sellerName}
        </p>
        <div className="mt-2">
          <RecommendationReason reason={product.reason} />
        </div>
      </Link>
    </div>
  );
}
