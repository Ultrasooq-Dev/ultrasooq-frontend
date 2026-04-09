"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAllRfqQuotesUsersBySellerId } from "@/apis/queries/rfq.queries";
import { PERMISSION_RFQ_SELLER_REQUESTS, checkPermission } from "@/helpers/permission";
import Image from "next/image";
import { cn } from "@/lib/utils";
import validator from "validator";
import {
  Sparkles, Search, Package, MapPin, DollarSign, ChevronRight,
  Users, MessageCircle, Eye, X, Layers, SlidersHorizontal,
  ChevronLeft, Clock, ArrowRight, Send,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   3-PANEL LAYOUT — Product Hub style for seller RFQ discovery
   Panel 1: Filters sidebar (collapsible)
   Panel 2: RFQ card grid (scrollable)
   Panel 3: RFQ detail preview (when selected)
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 3, name: "Electronics", emoji: "💻" },
  { id: 292, name: "Fashion", emoji: "👗" },
  { id: 662, name: "Home & Garden", emoji: "🏡" },
  { id: 1025, name: "Health & Beauty", emoji: "💊" },
  { id: 1443, name: "Automotive", emoji: "🚗" },
  { id: 1544, name: "Baby & Kids", emoji: "👶" },
  { id: 1698, name: "Food & Beverages", emoji: "🍕" },
  { id: 1882, name: "Appliances", emoji: "🔌" },
  { id: 1240, name: "Sports", emoji: "⚽" },
  { id: 2250, name: "Industrial", emoji: "🏭" },
  { id: 2353, name: "Construction", emoji: "🏗️" },
  { id: 2715, name: "Agriculture", emoji: "🌾" },
];

// ── Panel 1: Filter Sidebar ─────────────────────────────────────
function FilterPanel({
  collapsed, onToggle, search, onSearch, selectedCat, onCatChange,
  typeFilter, onTypeChange, showRecommended, onRecommendedToggle, recCount, totalCount,
}: {
  collapsed: boolean; onToggle: () => void;
  search: string; onSearch: (v: string) => void;
  selectedCat: number | null; onCatChange: (id: number | null) => void;
  typeFilter: string; onTypeChange: (v: string) => void;
  showRecommended: boolean; onRecommendedToggle: () => void;
  recCount: number; totalCount: number;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3 border-e border-border bg-card">
        <button type="button" onClick={onToggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRecommendedToggle}
          className={cn("p-2 rounded-lg", showRecommended ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
          <Sparkles className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-e border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-xs font-bold">Filters</span>
        <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-border bg-muted/30 py-2 pe-2 ps-8 text-xs outline-none focus:border-primary" />
        </div>

        {/* Recommended toggle */}
        <button type="button" onClick={onRecommendedToggle}
          className={cn("flex w-full items-center gap-2 rounded-xl p-3 text-xs font-semibold transition-all",
            showRecommended ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
          <Sparkles className="h-4 w-4" />
          <span className="flex-1 text-start">Recommended</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            showRecommended ? "bg-primary text-white" : "bg-muted")}>{recCount}</span>
        </button>

        {/* Categories */}
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Categories</h4>
          <div className="space-y-0.5">
            <button type="button" onClick={() => onCatChange(null)}
              className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors",
                !selectedCat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
              All Categories
              <span className="ms-auto text-[9px]">{totalCount}</span>
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => onCatChange(selectedCat === c.id ? null : c.id)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors",
                  selectedCat === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                <span>{c.emoji}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Product Type</h4>
          {[
            { v: "", l: "All types" },
            { v: "SAME", l: "Exact match only" },
            { v: "SIMILAR", l: "Similar accepted" },
          ].map((t) => (
            <button key={t.v} type="button" onClick={() => onTypeChange(t.v)}
              className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors",
                typeFilter === t.v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel 2: RFQ Card ───────────────────────────────────────────
function RfqMiniCard({
  rfq, selected, recommended, reason, onClick, currency,
}: {
  rfq: any; selected: boolean; recommended?: boolean; reason?: string;
  onClick: () => void; currency: { symbol: string };
}) {
  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const buyer = rfq.buyerIDDetail;
  const first = products[0]?.rfqProductDetails;
  const img = first?.productImages?.[0]?.image;
  const imageUrl = img && validator.isURL(img) ? img : null;
  const budget = products[0]?.offerPriceTo || products[0]?.offerPriceFrom;

  return (
    <button type="button" onClick={onClick}
      className={cn(
        "w-full text-start rounded-xl border p-3 transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
      )}>
      <div className="flex gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? <Image src={imageUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
            : <Package className="m-3 h-8 w-8 text-muted-foreground/15" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {recommended && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
            <p className={cn("text-[12px] font-semibold truncate", selected ? "text-primary" : "text-foreground")}>
              {first?.productName || "RFQ Request"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span>{products.length} item{products.length > 1 ? "s" : ""}</span>
            {products[0]?.quantity && <><span>·</span><span>Qty {products[0].quantity}</span></>}
            {budget && <><span>·</span><span className="font-semibold text-foreground">{currency.symbol}{Number(budget).toFixed(0)}</span></>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {buyer && <span className="text-[10px] text-muted-foreground">{buyer.firstName}</span>}
            {rfq.unreadMsgCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">{rfq.unreadMsgCount} new</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Panel 3: Detail Preview ─────────────────────────────────────
function DetailPanel({ rfq, currency, onQuote }: { rfq: any | null; currency: { symbol: string }; onQuote: () => void }) {
  if (!rfq) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8 bg-muted/20">
        <Eye className="mb-3 h-10 w-10 text-muted-foreground/15" />
        <p className="text-sm font-semibold text-muted-foreground/40">Select an RFQ</p>
        <p className="mt-1 text-xs text-muted-foreground/30">Click on a request to see details</p>
      </div>
    );
  }

  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          {buyer?.profilePicture ? (
            <img src={buyer.profilePicture} className="h-10 w-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {buyer?.firstName?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-bold">{buyer?.firstName} {buyer?.lastName || ""}</p>
            {address?.address && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {address.address}
              </p>
            )}
          </div>
        </div>
        {address?.rfqDate && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Delivery by {new Date(address.rfqDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Requested Products ({products.length})
        </h3>
        <div className="space-y-3">
          {products.map((p: any, i: number) => {
            const pd = p.rfqProductDetails || {};
            const pImg = pd.productImages?.[0]?.image;
            const pImgUrl = pImg && validator.isURL(pImg) ? pImg : null;
            return (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {pImgUrl ? <Image src={pImgUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
                      : <Package className="m-4 h-8 w-8 text-muted-foreground/15" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-snug line-clamp-2">{pd.productName || `Product ${i + 1}`}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {p.quantity && <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Qty: {p.quantity}</span>}
                      {p.offerPriceFrom && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {currency.symbol}{p.offerPriceFrom}{p.offerPriceTo ? ` - ${currency.symbol}${p.offerPriceTo}` : ""}</span>}
                      {p.productType && (
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold",
                          p.productType === "SAME" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                          {p.productType === "SAME" ? "Exact" : "Similar OK"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {p.note && (
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed rounded-lg bg-muted/30 px-3 py-2">
                    &ldquo;{p.note}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Last message preview */}
        {rfq.lastUnreadMessage?.content && (
          <div className="mt-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Last Message</h3>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs">{rfq.lastUnreadMessage.content}</p>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {new Date(rfq.lastUnreadMessage.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
          <Send className="h-4 w-4" /> Quote & Chat
        </button>
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Eye className="h-3.5 w-3.5" /> View Full Details
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function SellerRfqListPage() {
  const { currency } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [showRecommended, setShowRecommended] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { if (!hasPermission) router.push("/home"); }, [hasPermission, router]);

  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page: 1, limit: 100 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  // Score recommendations
  const scored = useMemo(() => {
    return allRfqs.map((rfq) => {
      const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      let score = 0; let reason = "";
      if (rfq.unreadMsgCount > 0) { score += 4; reason = "New message"; }
      if (products.some((p: any) => (p.quantity || 0) >= 10)) { score += 2; reason = reason || "Bulk order"; }
      if (products.some((p: any) => p.productType === "SIMILAR")) { score += 1; reason = reason || "Similar OK"; }
      if (products.length > 1) { score += 1; reason = reason || "Multi-item"; }
      return { rfq, score, reason, isRec: score >= 2 };
    }).sort((a, b) => b.score - a.score);
  }, [allRfqs]);

  const recCount = scored.filter((s) => s.isRec).length;

  // Filter
  const filtered = useMemo(() => {
    let items = showRecommended ? scored.filter((s) => s.isRec) : scored;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((s) => {
        const prods = s.rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return prods.some((p: any) => p.rfqProductDetails?.productName?.toLowerCase().includes(q))
          || s.rfq.buyerIDDetail?.firstName?.toLowerCase().includes(q);
      });
    }
    if (typeFilter) {
      items = items.filter((s) => {
        const prods = s.rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return prods.some((p: any) => p.productType === typeFilter);
      });
    }
    return items;
  }, [scored, showRecommended, search, typeFilter]);

  const selectedRfq = selectedId ? allRfqs.find((r: any) => r.id === selectedId) : null;

  const col1 = filterCollapsed ? "50px" : "220px";

  if (!hasPermission) return <div />;

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: `${col1} 1fr 380px`,
        gridTemplateRows: "1fr",
        transition: "grid-template-columns 0.2s ease",
      }}
    >
      {/* Panel 1: Filters */}
      <FilterPanel
        collapsed={filterCollapsed}
        onToggle={() => setFilterCollapsed(!filterCollapsed)}
        search={search}
        onSearch={setSearch}
        selectedCat={selectedCat}
        onCatChange={setSelectedCat}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        showRecommended={showRecommended}
        onRecommendedToggle={() => setShowRecommended(!showRecommended)}
        recCount={recCount}
        totalCount={allRfqs.length}
      />

      {/* Panel 2: RFQ List */}
      <div className="flex flex-col h-full min-h-0 border-e border-border bg-muted/20">
        <div className="shrink-0 px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {showRecommended ? "Recommended" : "All Requests"}
            </h2>
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sellerRfqs.isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex gap-3">
                  <div className="h-14 w-14 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-2 h-8 w-8 text-muted-foreground/15" />
              <p className="text-xs text-muted-foreground/40">No RFQ requests found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <RfqMiniCard
                key={item.rfq.id}
                rfq={item.rfq}
                selected={selectedId === item.rfq.id}
                recommended={item.isRec}
                reason={item.reason}
                onClick={() => setSelectedId(item.rfq.id)}
                currency={currency}
              />
            ))
          )}
        </div>
      </div>

      {/* Panel 3: Detail */}
      <DetailPanel
        rfq={selectedRfq}
        currency={currency}
        onQuote={() => {
          if (selectedRfq) {
            router.push(`/seller-rfq-request?rfqId=${selectedRfq.rfqQuotesId}&tab=rfq`);
          }
        }}
      />
    </div>
  );
}
