// Public API — import from '@/lib/analytics'
export { AnalyticsProvider } from './analytics-provider';
export { AnalyticsErrorBoundary } from './integrations/error-boundary';
export { useTrackEvent } from './hooks/useTrackEvent';
export { usePageView } from './hooks/usePageView';
export { attachAnalyticsInterceptors } from './integrations/axios-tracker';
export { track } from './tracker';
