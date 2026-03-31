/**
 * Microsoft Clarity loader — free heatmaps + session recordings.
 * Only loads when NEXT_PUBLIC_CLARITY_ID is set.
 * Called once on AnalyticsProvider mount.
 */
export function loadClarity(clarityId?: string) {
  if (!clarityId || typeof window === 'undefined') return;
  if ((window as any).clarity) return; // already loaded

  // Microsoft Clarity inline snippet (minified)
  const c = window as any;
  c.clarity = c.clarity || function (...args: any[]) {
    (c.clarity.q = c.clarity.q || []).push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityId}`;
  document.head.appendChild(script);
}
