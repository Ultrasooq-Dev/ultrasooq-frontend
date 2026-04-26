"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Star, ShoppingCart, FileText,
} from "lucide-react";

export interface ProductListCardProps {
  product: any;
  locale: string;
  selectedProductId: number | null;
  isRecommended?: boolean;
  showSelection?: boolean;
  onSelectProduct: (product: any) => void;
  onSetSelectedProductId: (id: number) => void;
  onSetActiveTab: (tab: "products" | "customize" | "buynow") => void;
  onSetReqMode: (mode: "rfq" | "vendor") => void;
}

export function ProductListCard({
  product: p,
  locale,
  selectedProductId,
  isRecommended,
  showSelection,
  onSelectProduct,
  onSetSelectedProductId,
  onSetActiveTab,
  onSetReqMode,
}: ProductListCardProps) {
  const isAr = locale === "ar";
  const isBg = p.isBuygroup || p.sellType === "BUYGROUP";
  const hasDiscount = p.originalPrice && p.originalPrice > p.price && p.price > 0;
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const totalStock = p.stock ?? 0;
  const soldCount = p.sold ?? 0;
  const remainPct = totalStock > 0 ? 100 - Math.round((soldCount / totalStock) * 100) : 100;
  const isSel = showSelection && p.id === selectedProductId;

  // Buygroup timer inline
  let cardTimer: string | null = null;
  if (isBg && p.dateClose) {
    const getTs = (ds: string, ts?: string) => { const d = new Date(ds); if (ts) { const [h, m] = ts.split(":").map(Number); d.setHours(h || 0, m || 0, 0, 0); } return d.getTime(); };
    const now = Date.now();
    const startTs = p.dateOpen ? getTs(p.dateOpen, p.startTime) : 0;
    const endTs = getTs(p.dateClose, p.endTime);
    if (startTs && now < startTs) cardTimer = isAr ? "لم يبدأ" : "Coming Soon";
    else if (now > endTs) cardTimer = isAr ? "انتهى" : "Expired";
    else { const ms = endTs - now; const s = Math.floor(ms / 1000); cardTimer = `${Math.floor(s / 86400)} ${isAr ? "يوم" : "Days"}; ${String(Math.floor((s % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
  }
  const isExpired = cardTimer === (isAr ? "انتهى" : "Expired");
  const isComingSoon = cardTimer === (isAr ? "لم يبدأ" : "Coming Soon");

  return (
    <div
      key={p.id}
      onClick={() => { onSetSelectedProductId(p.id); onSetActiveTab("buynow"); onSelectProduct(p); }}
      role="button"
      tabIndex={0}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      )}
    >
      {/* Image + badges */}
      <div className="relative h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {p.image ? (
          <img src={p.image} alt="" className="h-full w-full object-contain" />
        ) : (
          <ShoppingCart className="h-5 w-5 text-muted-foreground/20" />
        )}
        {cardTimer && (
          <span dir="ltr" className={cn(
            "absolute top-0 end-0 px-1 py-0.5 text-[7px] font-bold text-white rounded-bl",
            isExpired ? "bg-muted-foreground" : isComingSoon ? "bg-amber-500" : "bg-destructive"
          )}>
            {isBg && !isExpired && !isComingSoon ? cardTimer.split(";")[0] : (isExpired ? "!" : "...")}
          </span>
        )}
        {hasDiscount && !isBg && (
          <span className="absolute top-0 start-0 px-1 py-0.5 text-[7px] font-bold text-white bg-rose-500 rounded-br">
            -{discountPct}%
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className={cn("text-xs font-semibold line-clamp-2", isSel && "text-primary")}>{p.name}</span>
            {isRecommended && <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ms-1">{isAr ? "مقترح" : "Suggested"}</span>}
          </div>
          <div className="text-end shrink-0">
            <span className="text-sm font-bold text-primary">{p.price} OMR</span>
            {hasDiscount && <span className="text-[8px] text-muted-foreground line-through block">{p.originalPrice} OMR</span>}
          </div>
        </div>

        {/* Rating + seller + stock */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-2.5 w-2.5", s <= Math.round(p.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">({p.reviews})</span>
          <span className="text-[9px] text-muted-foreground">{"\u2022"} {p.seller}</span>
          {totalStock > 0 && <span className={cn("text-[9px]", p.inStock ? "text-green-600" : "text-destructive")}>{p.inStock ? `${totalStock} ${isAr ? "متوفر" : "in stock"}` : (isAr ? "نفذ" : "Out")}</span>}
          {cardTimer && <span dir="ltr" className={cn("text-[8px] font-bold px-1 py-0.5 rounded text-white", isExpired ? "bg-muted-foreground" : isComingSoon ? "bg-amber-500" : "bg-destructive")}>{cardTimer}</span>}
        </div>

        {/* Buygroup progress bar */}
        {isBg && totalStock > 0 && (
          <div className="mt-1">
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${Math.max(5, remainPct)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[7px] text-muted-foreground mt-0.5">
              <span>{isAr ? "تم البيع" : "Sold"}: {soldCount}</span>
              <span>{remainPct}% {isAr ? "متبقي" : "left"}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {isExpired ? (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">{isAr ? "انتهى" : "Expired"}</span>
          ) : isComingSoon ? (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">{isAr ? "قريباً" : "Coming Soon"}</span>
          ) : isBg ? (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetActiveTab("buynow"); }}
              className="flex items-center gap-1 rounded bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:from-rose-500 hover:to-rose-600 px-3 py-1 text-[10px] font-semibold">
              <ShoppingCart className="h-3 w-3" /> {isAr ? "حجز" : "Book"}
            </button>
          ) : (
            <>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetActiveTab("buynow"); }}
                className="flex items-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[10px] font-semibold">
                <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
              </button>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); onSetSelectedProductId(p.id); onSetReqMode("rfq"); onSetActiveTab("customize"); }}
                className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 text-[10px] font-semibold">
                <FileText className="h-3 w-3" /> RFQ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
