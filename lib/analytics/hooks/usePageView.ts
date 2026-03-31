'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '../tracker';

/**
 * Auto-tracks page_view events on every route change.
 * Also captures UTM parameters for attribution.
 */
export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathname = useRef('');

  useEffect(() => {
    if (!pathname || pathname === lastPathname.current) return;
    lastPathname.current = pathname;

    // Capture UTM parameters for marketing attribution
    const utmSource = searchParams?.get('utm_source') ?? undefined;
    const utmMedium = searchParams?.get('utm_medium') ?? undefined;
    const utmCampaign = searchParams?.get('utm_campaign') ?? undefined;
    const utmTerm = searchParams?.get('utm_term') ?? undefined;
    const utmContent = searchParams?.get('utm_content') ?? undefined;

    const utmData = utmSource
      ? { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_term: utmTerm, utm_content: utmContent }
      : undefined;

    track('page_view', {
      path: pathname,
      title: typeof document !== 'undefined' ? document.title : undefined,
      ...(utmData && { utm: utmData }),
    });

    // Persist UTM to sessionStorage so attribution survives multi-page flows
    if (utmSource && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('_utm', JSON.stringify(utmData));
    }
  }, [pathname, searchParams]);
}
