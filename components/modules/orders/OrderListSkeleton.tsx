"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="p-5">
          <div className="h-1 mb-4 bg-muted rounded overflow-hidden">
            <div className="h-full w-1/3 animate-pulse bg-muted-foreground/10 rounded" />
          </div>
          <div className="flex gap-5">
            <Skeleton className="h-24 w-24 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex flex-1 gap-0.5">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Skeleton key={s} className="h-[3px] flex-1 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
