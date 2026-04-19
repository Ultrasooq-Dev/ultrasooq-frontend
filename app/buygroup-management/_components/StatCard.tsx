"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { T } from "./theme";

export function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={cn(T.card, T.border, "border rounded-2xl p-5 flex items-start gap-4")}>
      <div className={cn("p-3 rounded-xl", color)}>{icon}</div>
      <div>
        <div className={cn("text-2xl font-bold", T.text)}>{value}</div>
        <div className={cn("text-sm", T.muted)}>{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
