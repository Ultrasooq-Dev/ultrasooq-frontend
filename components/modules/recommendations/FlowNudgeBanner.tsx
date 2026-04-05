'use client';

import Link from 'next/link';
import { useFlowNudge } from '@/apis/queries/recommendation.queries';

export function FlowNudgeBanner() {
  const { data: nudges } = useFlowNudge();

  if (!nudges || nudges.length === 0) return null;

  const nudge = nudges[0]; // Top-confidence nudge

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{nudge.message}</p>
        <Link
          href={nudge.ctaUrl}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {nudge.ctaText}
        </Link>
      </div>
    </div>
  );
}
