'use client';

import { useEffect } from 'react';
import { setVitals } from '../tracker';

/**
 * Captures Core Web Vitals per page via dynamic import.
 * Uses the web-vitals package if available (bundled with Next.js).
 * Falls back silently if package is unavailable.
 */
export function useWebVitals() {
  useEffect(() => {
    let mounted = true;

    // Dynamic import with any-typed handlers to avoid strict type issues
    // web-vitals may or may not be in node_modules depending on Next.js version
    import('web-vitals' as any).then((wv: any) => {
      if (!mounted) return;

      wv.onCLS?.((m: any) => setVitals({ CLS: m.value }));
      wv.onFID?.((m: any) => setVitals({ FID: m.value }));
      wv.onLCP?.((m: any) => setVitals({ LCP: m.value }));
      wv.onTTFB?.((m: any) => setVitals({ TTFB: m.value }));
      wv.onINP?.((m: any) => setVitals({ INP: m.value }));
    }).catch(() => {
      // web-vitals not available in this environment — non-fatal
    });

    return () => { mounted = false; };
  }, []);
}
