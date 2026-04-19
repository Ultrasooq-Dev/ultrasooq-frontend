"use client";

import React from "react";

export default function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="mb-6 animate-pulse rounded-xl border border-border bg-card p-5">
          <div className="flex gap-5">
            <div className="h-28 w-28 rounded-xl bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-6 w-1/4 rounded bg-muted" />
              <div className="mt-4 h-10 w-full rounded-lg bg-muted" />
            </div>
          </div>
        </div>
        <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
