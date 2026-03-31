'use client';

import { useEffect, useRef } from 'react';
import { initTracker, setUser, setupVisibilityFlush } from './tracker';
import { syncClock } from './utils/clock-sync';
import { usePageView } from './hooks/usePageView';
import { useWebVitals } from './hooks/useWebVitals';
import { loadClarity } from './clarity';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  userId?: number;
  locale?: string;
  currency?: string;
  tradeRole?: string;
}

/**
 * AnalyticsProvider — Initializes the analytics SDK on mount.
 *
 * Place after AuthProvider in the provider tree so userId is available.
 * Does clock sync, Clarity init, and visibility flush setup.
 * Contains the usePageView and useWebVitals hooks for global coverage.
 */
export function AnalyticsProvider({
  children,
  userId,
  locale,
  currency,
  tradeRole,
}: AnalyticsProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

    initTracker({ apiBase, userId, locale, currency, tradeRole });
    setupVisibilityFlush();

    // Non-blocking: clock sync and Clarity load in idle time
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        syncClock(apiBase);
        loadClarity(process.env.NEXT_PUBLIC_CLARITY_ID);
      });
    } else {
      setTimeout(() => {
        syncClock(apiBase);
        loadClarity(process.env.NEXT_PUBLIC_CLARITY_ID);
      }, 100);
    }
  }, []);

  // Update userId whenever auth state changes
  useEffect(() => {
    setUser(userId);
  }, [userId]);

  // Track page views and web vitals globally
  usePageView();
  useWebVitals();

  return <>{children}</>;
}
