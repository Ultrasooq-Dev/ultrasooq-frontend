"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Star, ShoppingCart, MessageSquare, Wrench,
  Minus, Plus, Loader2, Clock,
} from "lucide-react";

export interface BuyTabProps {
  locale: string;
  selectedProduct: any;
  buyListings: any[];
  buyDetailQuery: { data: any; isLoading: boolean };
  buygroupTimeLeft: string | null;
  // Per-product quantity
  getCardQty: (id: number) => number;
  setCardQty: (id: number, qty: number) => void;
  // Actions
  onAddToCart: (productPriceId: number, quantity?: number) => void;
  onSetSelectedProductId: (id: number) => void;
  onSetViewingProductId: (id: number | null) => void;
  onSetReqMode: (mode: "rfq" | "vendor") => void;
  onSetActiveTab: (tab: "products" | "customize" | "buynow") => void;
  // Buygroup disclaimer
  hasSeenBuygroupDisclaimer: boolean;
  onOpenBuygroupDisclaimer: (priceId: number, qty: number) => void;
}

export function BuyTab({
  locale,
  selectedProduct,
  buyListings,
  buyDetailQuery,
  buygroupTimeLeft,
  getCardQty,
  setCardQty,
  onAddToCart,
  onSetSelectedProductId,
  onSetViewingProductId,
  onSetReqMode,
  onSetActiveTab,
  hasSeenBuygroupDisclaimer,
  onOpenBuygroupDisclaimer,
}: BuyTabProps) {
  const isAr = locale === "ar";
  const buySearchQuery = { isLoading: buyDetailQuery.isLoading, data: buyDetailQuery.data };

  return (
    <div className="p-3">
      {/* Selected product header */}
      {selectedProduct && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30 border border-border">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
          <div className="flex-1 min-w-0">
            <button type="button" onClick={() => onSetViewingProductId(selectedProduct.id)}
              className="text-[11px] font-bold block truncate text-primary hover:underline text-start">
              {selectedProduct.name}
            </button>
            <span className="text-[9px] text-muted-foreground">
              {buySearchQuery?.isLoading ? (isAr ? "جاري البحث..." : "Searching sellers...") : `${buyListings.length} ${isAr ? "عرض لهذا المنتج" : "listings for this product"}`}
            </span>
          </div>
          <span className="text-xs font-bold text-primary">{selectedProduct.price} OMR</span>
        </div>
      )}

      {!buySearchQuery?.isLoading && buyListings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-xs">{isAr ? "اختر منتج من قائمة المنتجات أولاً" : "Select a product from the Products tab first"}</p>
        </div>
      )}

      {buySearchQuery?.isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-2 overflow-hidden">
        {buyListings.map((p: any) => {
          const isBg = p.sellType === "BUYGROUP";
          const hasDisc = p.originalPrice > p.price && p.price > 0;
          const discPct = hasDisc ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
          const totalStock = p.stock ?? 0;
          const soldCount = 0; // TODO: track sold
          const remainPct = totalStock > 0 ? 100 - Math.round((soldCount / totalStock) * 100) : 100;

          // Buygroup timer
          let timer: string | null = null;
          if (isBg) {
            const detail = buyDetailQuery?.data;
            const bgPp = detail?.product_productPrice?.find((pp: any) => pp.sellType === "BUYGROUP") || detail?.product_productPrice?.[0];
            const dc = bgPp?.dateClose;
            if (dc) {
              const getTs = (ds: string, ts?: string) => { const d = new Date(ds); if (ts) { const [h, m] = ts.split(":").map(Number); d.setHours(h || 0, m || 0, 0, 0); } return d.getTime(); };
              const now = Date.now();
              const startTs = bgPp?.dateOpen ? getTs(bgPp.dateOpen, bgPp.startTime) : 0;
              const endTs = getTs(dc, bgPp?.endTime);
              if (startTs && now < startTs) timer = isAr ? "لم يبدأ" : "Coming Soon";
              else if (now > endTs) timer = isAr ? "انتهى" : "Expired";
              else { const ms = endTs - now; const s = Math.floor(ms / 1000); timer = `${Math.floor(s / 86400)} ${isAr ? "يوم" : "Days"}; ${String(Math.floor((s % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
            } else if (buygroupTimeLeft) {
              timer = buygroupTimeLeft;
            }
          }
          const isExp = timer === (isAr ? "انتهى" : "Expired");
          const isSoon = timer === (isAr ? "لم يبدأ" : "Coming Soon") || timer === (isAr ? "لم يبدأ بعد" : "Not Started");

          return (
            <div key={p.id} className="rounded-lg border border-border hover:border-primary/30 transition-colors bg-background overflow-hidden">
              {/* Timer bar for buygroup */}
              {isBg && timer && (
                <div className={cn("flex items-center justify-between px-3 py-1 text-[9px] font-bold text-white",
                  isExp ? "bg-muted-foreground" : isSoon ? "bg-amber-500" : "bg-destructive")}>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {isBg ? (isAr ? "مجموعة شراء" : "Buy Group") : ""}</span>
                  <span dir="ltr">{timer}</span>
                </div>
              )}

              <div className="p-3">
                {/* Product info */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground/20" />
                    {hasDisc && (
                      <span className="absolute top-0 start-0 px-1 py-0.5 text-[7px] font-bold text-white bg-rose-500 rounded-br">
                        -{discPct}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => onSetViewingProductId(p.productId)}
                        className="text-xs font-semibold line-clamp-2 text-foreground hover:text-primary hover:underline transition-colors text-start">
                        {p.name}
                      </button>
                      <div className="text-end shrink-0">
                        <span className="text-sm font-bold text-primary">{p.price} OMR</span>
                        {hasDisc && <span className="text-[9px] text-muted-foreground line-through block">{p.originalPrice} OMR</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{p.seller}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={cn("h-2.5 w-2.5", s <= Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />)}
                      </div>
                      <span className="text-[9px] text-muted-foreground">({p.reviews})</span>
                      <span className="text-[9px] text-muted-foreground">{"\u00B7"}</span>
                      <span className={cn("text-[9px]", p.inStock ? "text-green-600" : "text-destructive")}>
                        {totalStock > 0 ? `${totalStock} ${isAr ? "متوفر" : "in stock"}` : (isAr ? "غير متوفر" : "Out of stock")}
                      </span>
                      {p.brand && <span className="text-[8px] bg-muted px-1 rounded">{p.brand}</span>}
                      <span className="text-[8px] text-muted-foreground">{"\u00B7"} {p.delivery}</span>
                    </div>
                    {p.description && <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                </div>

                {/* Buygroup progress bar */}
                {isBg && totalStock > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${Math.max(5, remainPct)}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground mt-0.5">
                      <span>{isAr ? "تم البيع" : "Sold"}: {soldCount}</span>
                      <span>{remainPct}% {isAr ? "متبقي" : "left"}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {/* Quantity stepper */}
                  <div className="flex items-center rounded border border-border">
                    <button type="button" onClick={() => setCardQty(p.productId, getCardQty(p.productId) - 1)}
                      disabled={getCardQty(p.productId) <= 0 || isExp || isSoon}
                      className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-7 w-9 items-center justify-center border-x border-border text-[11px] font-bold">{getCardQty(p.productId)}</span>
                    <button type="button" onClick={() => setCardQty(p.productId, getCardQty(p.productId) + 1)}
                      disabled={isExp || isSoon}
                      className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Button states */}
                  {isExp ? (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded">{isAr ? "انتهى" : "Expired"}</span>
                  ) : isSoon ? (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded">{isAr ? "قريباً" : "Coming Soon"}</span>
                  ) : (
                    <>
                      <button type="button" onClick={() => {
                        if (isBg && !hasSeenBuygroupDisclaimer) {
                          onOpenBuygroupDisclaimer(p.priceId, getCardQty(p.productId) || 1);
                          return;
                        }
                        onAddToCart(p.priceId, getCardQty(p.productId) || 1);
                      }}
                        className={cn("flex items-center gap-1 rounded px-3 py-1.5 text-[10px] font-semibold",
                          isBg ? "bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:from-rose-500 hover:to-rose-600" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                        <ShoppingCart className="h-3 w-3" /> {isBg ? (isAr ? "حجز" : "Book") : (isAr ? "سلة" : "Cart")}
                      </button>
                      {!isBg && p.enableChat && (
                        <button type="button" className="flex items-center gap-1 rounded bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-[10px] font-semibold">
                          <MessageSquare className="h-3 w-3" /> {isAr ? "رسالة" : "Message"}
                        </button>
                      )}
                      {!isBg && p.isCustomProduct && (
                        <button type="button" onClick={() => { onSetSelectedProductId(p.productId); onSetReqMode("vendor"); onSetActiveTab("customize"); }}
                          className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-3 py-1.5 text-[10px] font-semibold">
                          <Wrench className="h-3 w-3" /> {isAr ? "تخصيص" : "Customize"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
