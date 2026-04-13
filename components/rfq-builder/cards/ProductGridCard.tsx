"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Star, ShoppingCart, FileText, Eye, Minus, Plus,
} from "lucide-react";

export interface ProductGridCardProps {
  product: any;
  locale: string;
  currencySymbol: string;
  selectedProductId: number | null;
  isRecommended?: boolean;
  cardQty: number;
  onSetCardQty: (id: number, qty: number) => void;
  onSelectProduct: (product: any) => void;
  onSetSelectedProductId: (id: number) => void;
  onSetActiveTab: (tab: "products" | "customize" | "buynow") => void;
  onSetReqMode: (mode: "rfq" | "vendor") => void;
}

export function ProductGridCard({
  product: p,
  locale,
  currencySymbol,
  selectedProductId,
  isRecommended,
  cardQty,
  onSetCardQty,
  onSelectProduct,
  onSetSelectedProductId,
  onSetActiveTab,
  onSetReqMode,
}: ProductGridCardProps) {
  const isAr = locale === "ar";
  const isBg = p.isBuygroup || p.sellType === "BUYGROUP";
  const hasDiscount = p.originalPrice && p.originalPrice > p.price && p.price > 0;
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const totalStock = p.stock ?? 0;
  const soldCount = p.sold ?? 0;
  const remaining = Math.max(0, totalStock - soldCount);
  const soldPct = totalStock > 0 ? Math.round((soldCount / totalStock) * 100) : 0;
  const remainPct = 100 - soldPct;

  // Buygroup timer — compute inline
  let cardTimer: string | null = null;
  if (isBg && p.dateClose) {
    const getTs = (ds: string, ts?: string) => { const d = new Date(ds); if (ts) { const [h, m] = ts.split(":").map(Number); d.setHours(h || 0, m || 0, 0, 0); } return d.getTime(); };
    const now = Date.now();
    const startTs = p.dateOpen ? getTs(p.dateOpen, p.startTime) : 0;
    const endTs = getTs(p.dateClose, p.endTime);
    if (startTs && now < startTs) cardTimer = isAr ? "لم يبدأ" : "Coming Soon";
    else if (now > endTs) cardTimer = isAr ? "انتهى" : "Expired";
    else {
      const ms = endTs - now; const s = Math.floor(ms / 1000);
      cardTimer = `${Math.floor(s / 86400)} ${isAr ? "يوم" : "Days"}; ${String(Math.floor((s % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }
  }
  const isExpired = cardTimer === (isAr ? "انتهى" : "Expired");
  const isComingSoon = cardTimer === (isAr ? "لم يبدأ" : "Coming Soon");

  return (
    <div
      key={`grid-${p.id}`}
      className={cn(
        "flex flex-col rounded-xl border bg-background shadow-sm overflow-hidden transition-all hover:shadow-md",
        p.id === selectedProductId ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      {/* Image area + timer badge + action icons */}
      <div className="relative bg-muted/30 h-36 flex items-center justify-center group">
        {p.image ? (
          <img src={p.image} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <ShoppingCart className="h-10 w-10 text-muted-foreground/15" />
        )}
        {/* Timer badge (buygroup) */}
        {cardTimer && (
          <span className={cn(
            "absolute top-2 end-2 px-2 py-0.5 rounded text-[9px] font-bold text-white",
            isExpired ? "bg-muted-foreground" : isComingSoon ? "bg-amber-500" : "bg-destructive"
          )}>
            {cardTimer}
          </span>
        )}
        {/* Discount badge */}
        {hasDiscount && !isBg && (
          <span className="absolute top-2 start-2 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold">
            -{discountPct}%
          </span>
        )}
        {/* Hover action icons */}
        <div className="absolute top-2 end-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={cardTimer ? { top: "2rem" } : {}}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetActiveTab("buynow"); onSelectProduct(p); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white" title={isAr ? "عرض" : "View"}>
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {/* Suggested badge */}
        {isRecommended && (
          <span className="absolute bottom-2 start-2 text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">{isAr ? "مقترح" : "Suggested"}</span>
        )}
      </div>

      {/* Product info */}
      <div className="p-2.5 flex-1 flex flex-col">
        <button type="button"
          onClick={() => { onSetSelectedProductId(p.id); onSetActiveTab("buynow"); onSelectProduct(p); }}
          className="text-[11px] font-semibold line-clamp-2 leading-tight text-start hover:text-primary transition-colors">
          {p.name}
        </button>
        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={cn("h-3 w-3", s <= Math.round(p.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
          ))}
          <span className="text-[9px] text-muted-foreground ms-0.5">({p.reviews ?? 0})</span>
        </div>
        <span className="text-[9px] text-muted-foreground mt-0.5">{p.seller}</span>

        {/* Price */}
        <div className="mt-auto pt-2">
          <span className="text-sm font-bold text-primary">{currencySymbol}{p.price}</span>
          {hasDiscount && (
            <span className="text-[9px] text-muted-foreground line-through ms-1">{currencySymbol}{p.originalPrice}</span>
          )}
        </div>
      </div>

      {/* Quantity stepper */}
      <div className="px-2.5 pb-1">
        <span className="text-[9px] text-muted-foreground">{isAr ? "الكمية" : "Quantity"}</span>
        <div className="flex items-center justify-center gap-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onSetCardQty(p.id, Math.max(0, cardQty - 1))}
            disabled={cardQty <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-s border border-border bg-muted text-muted-foreground disabled:opacity-30">
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex h-7 w-10 items-center justify-center border-y border-border bg-background text-xs font-bold">
            {cardQty}
          </div>
          <button type="button" onClick={() => onSetCardQty(p.id, cardQty + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-e border border-border bg-muted text-muted-foreground">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Action button */}
      <div className="px-2.5 pb-2">
        {isExpired ? (
          <div className="w-full py-2 text-center rounded-lg bg-muted text-muted-foreground text-[10px] font-semibold">
            {isAr ? "انتهى" : "Expired"}
          </div>
        ) : isComingSoon ? (
          <div className="w-full py-2 text-center rounded-lg bg-amber-100 text-amber-700 text-[10px] font-semibold">
            {isAr ? "قريباً" : "Coming Soon"}
          </div>
        ) : isBg ? (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetActiveTab("buynow"); }}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-400 to-rose-500 text-white py-2 text-[11px] font-bold hover:from-rose-500 hover:to-rose-600 transition-all">
            <ShoppingCart className="h-3.5 w-3.5" /> {isAr ? "حجز" : "Book"}
          </button>
        ) : (
          <div className="flex gap-1">
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetActiveTab("buynow"); }}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-600 text-white py-2 text-[10px] font-bold hover:bg-green-700">
              <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء" : "Buy"}
            </button>
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetReqMode("rfq"); onSetActiveTab("customize"); }}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-600 text-white py-2 text-[10px] font-bold hover:bg-amber-700">
              <FileText className="h-3 w-3" /> RFQ
            </button>
          </div>
        )}
      </div>

      {/* Progress bar (buygroup only) */}
      {isBg && totalStock > 0 && (
        <div className="px-2.5 pb-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${Math.max(5, remainPct)}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5 text-[8px] text-muted-foreground">
            <span>{isAr ? "تم البيع" : "Sold"}: {soldCount}</span>
            <span>{remainPct}% {isAr ? "متبقي" : "left"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
