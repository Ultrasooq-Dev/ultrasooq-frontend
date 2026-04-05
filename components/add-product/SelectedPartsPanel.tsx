"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Package, X, Check, Trash2, AlertTriangle, DollarSign,
  ChevronRight, Star, MapPin,
} from "lucide-react";

export interface SelectedPart {
  id: string;
  name: string;
  zone?: string;
  brand?: string;
  price?: number;
  oem?: boolean;
  damaged?: boolean;
}

interface SelectedPartsPanelProps {
  parts: SelectedPart[];
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  onRemovePart: (id: string) => void;
  onToggleDamaged: (id: string) => void;
  onRemoveAllDamaged: () => void;
  onMarkAllReady: () => void;
  locale: string;
}

export default function SelectedPartsPanel({
  parts, selectedPartId, onSelectPart, onRemovePart,
  onToggleDamaged, onRemoveAllDamaged, onMarkAllReady, locale,
}: SelectedPartsPanelProps) {
  const isAr = locale === "ar";

  const goodParts = parts.filter((p) => !p.damaged);
  const damagedParts = parts.filter((p) => p.damaged);
  const totalPrice = goodParts.reduce((s, p) => s + (p.price ?? 0), 0);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background border-s border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-green-600" />
          <span className="text-sm font-bold flex-1">{isAr ? "القطع المختارة" : "Selected Parts"}</span>
          <span className="text-xs text-muted-foreground">{parts.length} {isAr ? "قطعة" : "parts"}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="px-3 py-2 border-b border-border shrink-0 flex items-center gap-2 bg-green-50/50 dark:bg-green-950/10">
        <div className="flex-1">
          <span className="text-xs text-muted-foreground">{goodParts.length} {isAr ? "صالح" : "good"}</span>
          {damagedParts.length > 0 && (
            <span className="text-xs text-destructive ms-2">{damagedParts.length} {isAr ? "تالف" : "damaged"}</span>
          )}
        </div>
        <span className="text-sm font-bold text-green-600"><DollarSign className="h-3 w-3 inline" />{totalPrice} OMR</span>
      </div>

      {/* Bulk actions */}
      <div className="px-3 py-1.5 border-b border-border shrink-0 flex gap-1.5">
        {damagedParts.length > 0 && (
          <button type="button" onClick={onRemoveAllDamaged}
            className="flex items-center gap-1 rounded-md bg-destructive/10 text-destructive px-2 py-1 text-[10px] font-medium hover:bg-destructive/20">
            <Trash2 className="h-3 w-3" /> {isAr ? "حذف التالف" : "Remove Damaged"} ({damagedParts.length})
          </button>
        )}
        <button type="button" onClick={onMarkAllReady}
          className="flex items-center gap-1 rounded-md bg-green-600/10 text-green-600 px-2 py-1 text-[10px] font-medium hover:bg-green-600/20">
          <Check className="h-3 w-3" /> {isAr ? "تجهيز الكل" : "Mark All Ready"}
        </button>
      </div>

      {/* Parts list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {parts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Package className="h-8 w-8 mb-2 opacity-10" />
            <p className="text-xs">{isAr ? "لا توجد قطع مختارة" : "No parts selected yet"}</p>
            <p className="text-[10px] opacity-60 mt-1">{isAr ? "اختر من الكتالوج أو المخطط" : "Select from catalog or diagram"}</p>
          </div>
        )}

        {/* Good parts */}
        {goodParts.map((part) => {
          const isSel = part.id === selectedPartId;
          return (
            <div key={part.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-b border-border/20 transition-colors cursor-pointer",
                isSel ? "bg-primary/5 border-s-2 border-s-primary" : "hover:bg-muted/20"
              )}
              onClick={() => onSelectPart(part.id)}>
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={cn("text-xs block truncate", isSel ? "font-bold" : "font-medium")}>{part.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {part.zone && <span className="text-[9px] text-muted-foreground">{part.zone}</span>}
                  {part.brand && <span className="text-[9px] text-muted-foreground">· {part.brand}</span>}
                  {part.oem && <span className="text-[7px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-0.5 rounded font-bold">OEM</span>}
                </div>
              </div>
              {part.price && <span className="text-[10px] font-bold text-green-600 shrink-0">{part.price}</span>}
              {/* Mark as damaged */}
              <button type="button" onClick={(e) => { e.stopPropagation(); onToggleDamaged(part.id); }}
                title={isAr ? "تحديد كتالف" : "Mark damaged"}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-amber-500 shrink-0">
                <AlertTriangle className="h-3 w-3" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemovePart(part.id); }}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-destructive shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Damaged parts */}
        {damagedParts.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-destructive/5 border-b border-destructive/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {isAr ? "قطع تالفة" : "Damaged Parts"} ({damagedParts.length})
              </span>
            </div>
            {damagedParts.map((part) => (
              <div key={part.id}
                className="flex items-center gap-2 px-3 py-2 border-b border-border/10 bg-destructive/5 opacity-60">
                <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                <span className="text-xs flex-1 truncate line-through">{part.name}</span>
                {/* Restore */}
                <button type="button" onClick={() => onToggleDamaged(part.id)}
                  title={isAr ? "استعادة" : "Restore"}
                  className="text-[10px] text-primary hover:underline shrink-0">
                  {isAr ? "استعادة" : "Restore"}
                </button>
                <button type="button" onClick={() => onRemovePart(part.id)}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
