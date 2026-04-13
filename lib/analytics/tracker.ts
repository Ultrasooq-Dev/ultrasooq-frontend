/**
 * Analytics Tracker — Core singleton module.
 *
 * Dual-channel dispatch:
 *  Channel A (piggyback): rides on existing Axios API calls via X-Track-* headers. Zero extra HTTP calls.
 *  Channel B (standalone): only fires when no API call happens within 10s, or on tab close (~5% of pages).
 *
 * All writes are fire-and-forget. Never blocks the user's response.
 */

import { getSessionId } from './utils/session';
import { getDeviceId } from './utils/device-id';
import { getClockOffset } from './utils/clock-sync';

export interface TrackEvent {
  eventName: string;
  eventType: string;
  sessionId?: string;
  deviceId?: string;
  userId?: number;
  pageUrl?: string;
  referrer?: string;
  locale?: string;
  currency?: string;
  tradeRole?: string;
  metadata?: Record<string, unknown>;
  clockOffset?: number;
}

interface WebVitalsSnapshot {
  LCP?: number;
  CLS?: number;
  FID?: number;
  TTFB?: number;
  INP?: number;
}

// ── Module state ─────────────────────────────────────────────────

const queue: TrackEvent[] = [];
let apiBase = '/api/v1';
let userId: number | undefined;
let locale = 'en';
let currency = 'USD';
let tradeRole = '';
let enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
let vitalsSnapshot: WebVitalsSnapshot = {};
let standaloneTimer: ReturnType<typeof setTimeout> | null = null;
const STANDALONE_TIMEOUT_MS = 10_000;

// ── Public API ───────────────────────────────────────────────────

export function initTracker(config: {
  apiBase: string;
  userId?: number;
  locale?: string;
  currency?: string;
  tradeRole?: string;
}) {
  apiBase = config.apiBase;
  if (config.userId) userId = config.userId;
  if (config.locale) locale = config.locale;
  if (config.currency) currency = config.currency;
  if (config.tradeRole) tradeRole = config.tradeRole;
}

export function setUser(uid: number | undefined) {
  userId = uid;
}

export function setVitals(vitals: Partial<WebVitalsSnapshot>) {
  vitalsSnapshot = { ...vitalsSnapshot, ...vitals };
}

export function track(eventName: string, metadata?: Record<string, unknown>) {
  if (!enabled || typeof window === 'undefined') return;

  const eventType = resolveEventType(eventName);

  queue.push({
    eventName,
    eventType,
    sessionId: getSessionId(),
    deviceId: getDeviceId(),
    userId,
    pageUrl: window.location.pathname,
    referrer: document.referrer || undefined,
    locale,
    currency,
    tradeRole: tradeRole || undefined,
    metadata,
    clockOffset: getClockOffset(),
  });

  // Reset the standalone flush timer on each new event
  resetStandaloneTimer();
}

/**
 * Drain the queue and return events + vitals as headers payload.
 * Called by the Axios interceptor on every outgoing request (Channel A).
 */
export function drainForPiggyback(): { events: string; vitals: string | null } {
  if (!enabled) return { events: '[]', vitals: null };

  const batch = queue.splice(0, 50); // max 50 per header
  const events = batch.length > 0 ? JSON.stringify(batch) : '[]';

  const vitals =
    Object.keys(vitalsSnapshot).length > 0
      ? JSON.stringify(vitalsSnapshot)
      : null;

  // Clear vitals after piggybacking (they'll refresh each page)
  if (vitals) vitalsSnapshot = {};

  // Cancel standalone timer — we just piggybacked
  if (standaloneTimer) {
    clearTimeout(standaloneTimer);
    standaloneTimer = null;
  }

  return { events, vitals };
}

/**
 * Flush queue via standalone POST (Channel B).
 * Used only when no Axios call fires within STANDALONE_TIMEOUT_MS.
 */
async function standaloneFlush(): Promise<void> {
  if (!enabled || queue.length === 0) return;

  const batch = queue.splice(0, 50);

  try {
    await fetch(`${apiBase}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Silent fail — push back events on failure
    queue.unshift(...batch);
  }
}

/**
 * Flush on tab close or visibility hidden (keepalive so request survives).
 * Sends both queued events AND any pending web vitals.
 */
export function setupVisibilityFlush() {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;

    const batch = queue.splice(0, 50);
    const hasVitals = Object.keys(vitalsSnapshot).length > 0;

    if (batch.length === 0 && !hasVitals) return;

    const body = JSON.stringify({
      events: batch,
      ...(hasVitals ? { vitals: vitalsSnapshot } : {}),
    });

    // Clear vitals after sending
    if (hasVitals) vitalsSnapshot = {};

    // navigator.sendBeacon has size limit (~64KB), use fetch+keepalive for reliability
    const sent = navigator.sendBeacon
      ? navigator.sendBeacon(`${apiBase}/analytics/events`, new Blob([body], { type: 'application/json' }))
      : false;

    if (!sent) {
      fetch(`${apiBase}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────

function resetStandaloneTimer() {
  if (standaloneTimer) clearTimeout(standaloneTimer);

  standaloneTimer = setTimeout(() => {
    // No API call in 10s — flush standalone (Channel B, ~5% of pages)
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => standaloneFlush());
    } else {
      standaloneFlush();
    }
  }, STANDALONE_TIMEOUT_MS);
}

function resolveEventType(eventName: string): string {
  const typeMap: Record<string, string> = {
    page_view: 'pageView',
    session_heartbeat: 'navigation',
    product_view: 'interaction',
    product_click: 'interaction',
    product_search: 'interaction',
    add_to_cart: 'transaction',
    remove_from_cart: 'transaction',
    checkout_start: 'transaction',
    order_complete: 'transaction',
    rfq_submitted: 'transaction',
    api_error: 'interaction',
    api_request: 'interaction',
  };
  return typeMap[eventName] ?? 'interaction';
}
