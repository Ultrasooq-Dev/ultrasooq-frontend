"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Truck, PackageCheck } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onBulkUpdate: (status: string) => Promise<void>;
  onClearSelection: () => void;
  isPending: boolean;
}

const BULK_ACTIONS = [
  { status: "CONFIRMED", label: "confirm_all", color: "bg-blue-500 hover:bg-blue-600", icon: CheckCircle },
  { status: "SHIPPED", label: "ship_all", color: "bg-indigo-500 hover:bg-indigo-600", icon: Truck },
  { status: "OFD", label: "mark_ofd", color: "bg-amber-500 hover:bg-amber-600", icon: Truck },
  { status: "DELIVERED", label: "deliver_all", color: "bg-emerald-500 hover:bg-emerald-600", icon: PackageCheck },
];

export default function BulkActionBar({
  selectedCount,
  onBulkUpdate,
  onClearSelection,
  isPending,
}: BulkActionBarProps) {
  const t = useTranslations();

  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
      <span className="text-sm font-semibold text-primary">
        {selectedCount} {t("selected") || "selected"}
      </span>
      <div className="h-4 w-px bg-border" />
      {BULK_ACTIONS.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={isPending}
          onClick={() => onBulkUpdate(action.status)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${action.color}`}
        >
          <action.icon className="h-3.5 w-3.5" />
          {t(action.label) || action.label}
        </button>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClearSelection}
        className="text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {t("clear_selection") || "Clear selection"}
      </button>
    </div>
  );
}
