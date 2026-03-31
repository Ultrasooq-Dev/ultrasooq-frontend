/**
 * Axios interceptor integration — Channel A (piggyback).
 *
 * Attaches X-Track-* headers to every outgoing Axios request.
 * The backend LoggingInterceptor reads these headers and writes events to Redis.
 * This is the primary channel: zero extra HTTP calls, 100% coverage.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { generateRequestId } from '../utils/request-id';
import { getSessionId } from '../utils/session';
import { drainForPiggyback } from '../tracker';

export function attachAnalyticsInterceptors(http: AxiosInstance) {
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;

  http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Generate a unique requestId for this specific API call
    const requestId = generateRequestId();
    const sessionId = getSessionId();

    config.headers['X-Request-Id'] = requestId;
    config.headers['X-Session-Id'] = sessionId;
    config.headers['X-Track-Page'] = window.location.pathname;

    // Drain queued events and vitals into headers
    const { events, vitals } = drainForPiggyback();
    if (events && events !== '[]') {
      config.headers['X-Track-Events'] = events;
    }
    if (vitals) {
      config.headers['X-Track-Vitals'] = vitals;
    }

    // Store requestId on config for correlation in response interceptor
    (config as any)._requestId = requestId;
    (config as any)._requestStart = Date.now();

    return config;
  });

  http.interceptors.response.use(
    (response) => {
      // Echo back requestId from response header (backend sets X-Request-Id)
      const echoedId = response.headers['x-request-id'];
      if (echoedId) {
        (response as any).requestId = echoedId;
      }
      return response;
    },
    (error) => {
      // Track API errors via standalone POST (immediate, not queued)
      if (typeof window !== 'undefined' && error?.response) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const sessionId = getSessionId();

        fetch(`${apiBase}/analytics/errors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            source: 'frontend',
            level: 'error',
            sessionId,
            endpoint: error.config?.url,
            statusCode: error.response?.status,
            metadata: { method: error.config?.method, status: error.response?.status, release: process.env.NEXT_PUBLIC_RELEASE_SHA ?? undefined },
          }),
        }).catch(() => {});
      }
      return Promise.reject(error);
    },
  );
}
