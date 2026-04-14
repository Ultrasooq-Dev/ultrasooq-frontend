"use client";
import React from "react";
import {
  Clock, CheckCircle2, AlertTriangle, XCircle, ShieldCheck,
  Package, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { DealStatus } from "./types";

export function StatusBadge({ status }: { status: DealStatus | string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    ACTIVE: { bg: T.infoBg, text: T.infoText, icon: <Clock className="h-3.5 w-3.5" />, label: "Active" },
    THRESHOLD_MET: { bg: T.successBg, text: T.success, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Threshold Met" },
    CONFIRMED: { bg: "bg-indigo-50", text: "text-indigo-600", icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Confirmed" },
    EXPIRED: { bg: T.warningBg, text: T.warning, icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Expired" },
    CANCELLED: { bg: T.dangerBg, text: T.danger, icon: <XCircle className="h-3.5 w-3.5" />, label: "Cancelled" },
    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Completed" },
    PLACED: { bg: T.infoBg, text: T.infoText, icon: <Clock className="h-3.5 w-3.5" />, label: "Placed" },
    SHIPPED: { bg: "bg-indigo-50", text: "text-indigo-600", icon: <Package className="h-3.5 w-3.5" />, label: "Shipped" },
    DELIVERED: { bg: T.successBg, text: T.success, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Delivered" },
    REFUNDED: { bg: T.dangerBg, text: T.danger, icon: <RefreshCw className="h-3.5 w-3.5" />, label: "Refunded" },
  };

  const c = config[status] || config.ACTIVE;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>
      {c.icon} {c.label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
