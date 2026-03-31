'use client';

import { useCallback } from 'react';
import { track } from '../tracker';

/**
 * Manual event tracking hook.
 * Returns a stable trackEvent function that components can call on user interactions.
 */
export function useTrackEvent() {
  return useCallback((eventName: string, metadata?: Record<string, unknown>) => {
    track(eventName, metadata);
  }, []);
}
