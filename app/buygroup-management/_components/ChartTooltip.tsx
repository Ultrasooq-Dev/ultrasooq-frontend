"use client";
import { cn } from "@/lib/utils";
import { T } from "./theme";

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(T.card, "rounded-xl p-3 shadow-lg border text-xs", T.border)}>
      <p className={cn("font-semibold mb-1.5", T.text)}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className={T.muted}>{entry.name}:</span>
          <span className={cn("font-semibold", T.text)}>
            {entry.name === "Revenue" ? `$${entry.value}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
