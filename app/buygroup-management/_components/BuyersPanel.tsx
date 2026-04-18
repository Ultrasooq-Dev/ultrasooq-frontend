"use client";
import { useState } from "react";
import { Users, Search, Star, Eye, X, MessageCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { BuyGroupDeal } from "./types";
import { maskName, maskEmail } from "./utils";
import { RatingStars } from "./RatingStars";
import { OrderStatusBadge } from "./StatusBadge";

const PANEL_PAGE_SIZE = 8;

interface BuyersPanelProps {
  deal: BuyGroupDeal;
  onClose: () => void;
}

export function BuyersPanel({ deal, onClose }: BuyersPanelProps) {
  const t = useTranslations();
  const [panelSearch, setPanelSearch] = useState("");
  const [panelPage, setPanelPage] = useState(1);

  const dealFinished = ["COMPLETED", "CONFIRMED"].includes(deal.status);
  const filtered = deal.orders.filter((o) => {
    if (!panelSearch) return true;
    const term = panelSearch.toLowerCase();
    const name = dealFinished ? o.customerName.toLowerCase() : maskName(o.customerName, false).toLowerCase();
    return name.includes(term) || String(o.orderId).includes(term);
  });
  const totalPages = Math.ceil(filtered.length / PANEL_PAGE_SIZE);
  const paged = filtered.slice((panelPage - 1) * PANEL_PAGE_SIZE, panelPage * PANEL_PAGE_SIZE);
  const avgRating = deal.orders.length > 0
    ? deal.orders.reduce((s, o) => s + o.customerRating, 0) / deal.orders.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 transition-opacity" />
      <div
        className={cn(T.card, "relative w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("p-5 border-b flex items-start justify-between", T.border)}>
          <div>
            <h3 className={cn("text-lg font-semibold", T.text)}>{t("buyers")} — {deal.productName}</h3>
            <div className={cn("flex items-center gap-4 mt-1.5 text-sm", T.muted)}>
              <span>{deal.orders.length} {t("total_buyers")}</span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} {t("avg")}
              </span>
              {!dealFinished && (
                <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", T.warningBg, T.warning)}>
                  <Eye className="h-3 w-3" /> {t("info_masked_until_deal_finalized")}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className={cn("px-5 py-3 border-b", T.border)}>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search_by_name_or_order")}
              value={panelSearch}
              onChange={(e) => { setPanelSearch(e.target.value); setPanelPage(1); }}
              className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}
            />
          </div>
        </div>

        {/* Buyers List */}
        <div className="flex-1 overflow-y-auto">
          {paged.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className={T.muted}>{t("no_buyers_found")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((order) => (
                <div key={order.id} className={cn("px-5 py-4 hover:bg-muted/50/50 transition-colors", order.status === "CANCELLED" && "opacity-50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary-foreground", T.accentBg)}>
                        {maskName(order.customerName, dealFinished).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold truncate", T.text)}>
                            {maskName(order.customerName, dealFinished)}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {maskEmail(order.customerEmail, dealFinished)}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <RatingStars rating={order.customerRating} />
                        </div>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className={cn("text-sm font-semibold", T.text)}>{deal.currency}{order.total.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">x{order.quantity} {t("units")}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">#{order.orderId}</div>
                    </div>
                  </div>
                  {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
                    <div className="flex items-center gap-1.5 mt-3 ms-13">
                      <button className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-muted/50", T.border, T.muted)}>
                        <MessageCircle className="h-3.5 w-3.5" /> {t("message")}
                      </button>
                      <button className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors", T.dangerBorder, T.danger, "hover:bg-red-50")}>
                        <XCircle className="h-3.5 w-3.5" /> {t("cancel_refund")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className={cn("px-5 py-3 border-t flex items-center justify-between", T.border)}>
            <span className={cn("text-xs", T.muted)}>
              {(panelPage - 1) * PANEL_PAGE_SIZE + 1}–{Math.min(panelPage * PANEL_PAGE_SIZE, filtered.length)} {t("of")} {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={panelPage <= 1} onClick={() => setPanelPage((p) => p - 1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPanelPage(p)}
                  className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-colors", panelPage === p ? cn(T.accentBg, "text-primary-foreground") : "hover:bg-muted text-muted-foreground")}
                >
                  {p}
                </button>
              ))}
              <button disabled={panelPage >= totalPages} onClick={() => setPanelPage((p) => p + 1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
