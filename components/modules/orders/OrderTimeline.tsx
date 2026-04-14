"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { TIMELINE_STEPS, stepIndex } from "./constants";
import type { OrderTimelineProps } from "./types";

export default function OrderTimeline({ status, dates }: OrderTimelineProps) {
  const t = useTranslations();
  const { selectedLocale } = useAuth();
  const activeIdx = stepIndex(status);
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/20">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-semibold text-red-600">
          {t("order_cancelled")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const isActive = activeIdx >= i;
        const isCurrent = activeIdx === i;
        const dateKey = step.key.toLowerCase();
        const dateStr = dates[dateKey] || dates[step.key] || "";

        return (
          <div
            key={step.key}
            className="flex items-start"
            style={{ flex: i < TIMELINE_STEPS.length - 1 ? 1 : "none" }}
          >
            {/* Step circle */}
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  isActive
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-card text-muted-foreground",
                  isCurrent && "ring-4 ring-emerald-500/20",
                )}
              >
                {isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[9px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-center text-[10px] font-medium leading-tight",
                  isActive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {t(step.label)}
              </span>
              {dateStr && (
                <span className="mt-0.5 text-[9px] text-muted-foreground">
                  {new Date(dateStr).toLocaleDateString(
                    selectedLocale || "en",
                    { weekday: "short", day: "numeric", month: "short" },
                  )}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div className="mt-3 flex-1 px-1">
                <div
                  className={cn(
                    "h-[2px] w-full rounded-full transition-colors",
                    activeIdx > i ? "bg-emerald-500" : "bg-border",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
