"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3 w-3", i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
      <span className="text-xs text-muted-foreground ms-1">({rating.toFixed(1)})</span>
    </span>
  );
}
