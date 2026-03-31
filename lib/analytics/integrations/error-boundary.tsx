'use client';

import React from 'react';
import { getSessionId } from '../utils/session';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

/**
 * React Error Boundary that reports uncaught errors to the analytics backend.
 * Uses POST /analytics/errors directly (not queued) so errors reach the DB immediately.
 * Class component required — React error boundaries cannot be function components.
 */
export class AnalyticsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

    fetch(`${apiBase}/analytics/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        source: 'frontend',
        level: 'error',
        sessionId: getSessionId(),
        pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
        metadata: {
          componentStack: info.componentStack?.slice(0, 500),
          release: process.env.NEXT_PUBLIC_RELEASE_SHA ?? undefined,
        },
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
