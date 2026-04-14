"use client";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  color = "bg-primary",
  height = "h-2",
}: {
  value: number;
  max: number;
  color?: string;
  height?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", height)}>
      <div
        className={cn("rounded-full transition-all duration-500", color, height)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
