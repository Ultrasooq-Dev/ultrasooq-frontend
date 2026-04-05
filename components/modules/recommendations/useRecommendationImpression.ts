'use client';

import { useRef, useEffect } from 'react';
import { postRecommendationFeedback } from '@/apis/requests/recommendation.requests';

export function useRecommendationImpression(
  recId: string,
  productId: number,
  placement: string,
  position: number,
) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!ref.current || tracked.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          postRecommendationFeedback({
            recId,
            productId,
            action: 'impression',
            placement,
            position,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [recId, productId, placement, position]);

  return ref;
}
