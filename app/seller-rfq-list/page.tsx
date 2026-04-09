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
            {buyer && <span className="text-[10px] text-muted-foreground">{maskName(buyer.firstName)}</span>}
            {rfq.unreadMsgCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">{rfq.unreadMsgCount} new</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Mask buyer name: "Ahmed" → "Ah***" ─────────────────────────
function maskName(name?: string): string {
  if (!name || name.length <= 2) return name || "***";
  return name.slice(0, 2) + "***";
}
function maskFullName(first?: string, last?: string): string {
  return `${maskName(first)}${last ? " " + maskName(last) : ""}`;
}

// ── Star Rating Display ─────────────────────────────────────────
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} className={cn("h-3.5 w-3.5", i < Math.round(rating) ? "text-amber-400" : "text-border")}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Panel 3: Detail Preview ─────────────────────────────────────
function DetailPanel({ rfq, currency, onQuote }: { rfq: any | null; currency: { symbol: string }; onQuote: () => void }) {
  if (!rfq) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8 bg-muted/20">
        <Eye className="mb-3 h-10 w-10 text-muted-foreground/15" />
        <p className="text-sm font-semibold text-muted-foreground/40">Select an RFQ</p>
        <p className="mt-1 text-xs text-muted-foreground/30">Click on a request to preview details</p>
      </div>
    );
  }

  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;

  // Mock ratings (replace with real data when available)
  const rfqRating = 4.2;
  const totalRating = 4.5;
  const rfqCount = 7;
  const orderCount = 23;
  const memberSince = "Mar 2025";

  return (
    <div className="flex h-full flex-col bg-card">
      {/* ── Customer Profile Section ────────────────── */}
      <div className="shrink-0 border-b border-border">
        {/* Profile header */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            {buyer?.profilePicture ? (
              <img src={buyer.profilePicture} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-border" alt="" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary ring-2 ring-primary/20">
                {buyer?.firstName?.[0] || "?"}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-base font-bold">{maskFullName(buyer?.firstName, buyer?.lastName)}</h2>
              {address?.address && (
                <p className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {address.address}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">Member since {memberSince}</p>
            </div>
          </div>

          {/* Ratings */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">RFQ Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-amber-600">{rfqRating}</span>
                <div>
                  <Stars rating={rfqRating} />
                  <p className="text-[9px] text-muted-foreground mt-0.5">{rfqCount} RFQs completed</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Overall Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-emerald-600">{totalRating}</span>
                <div>
                  <Stars rating={totalRating} />
                  <p className="text-[9px] text-muted-foreground mt-0.5">{orderCount} orders total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer stats */}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {rfqCount} RFQs</span>
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {orderCount} Orders</span>
            {address?.rfqDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Need by {new Date(address.rfqDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Requested Products ──────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Requested Products ({products.length})
          </h3>
          <div className="space-y-3">
            {products.map((p: any, i: number) => {
              const pd = p.rfqProductDetails || {};
              const pImg = pd.productImages?.[0]?.image;
              const pImgUrl = pImg && validator.isURL(pImg) ? pImg : null;
              return (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  {/* Product image banner */}
                  <div className="h-32 bg-muted relative overflow-hidden">
                    {pImgUrl ? (
                      <Image src={pImgUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/15" />
                      </div>
                    )}
                    {p.productType && (
                      <span className={cn("absolute top-2 start-2 rounded-md px-2 py-0.5 text-[9px] font-bold text-white",
                        p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                        {p.productType === "SAME" ? "Exact Match" : "Similar OK"}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold leading-snug">{pd.productName || `Product ${i + 1}`}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      {p.quantity && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Qty: <span className="font-semibold text-foreground">{p.quantity}</span>
                        </span>
                      )}
                      {(p.offerPriceFrom || p.offerPriceTo) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Budget: <span className="font-semibold text-foreground">
                            {currency.symbol}{p.offerPriceFrom || 0}
                            {p.offerPriceTo ? ` — ${currency.symbol}${p.offerPriceTo}` : ""}
                          </span>
                        </span>
                      )}
                    </div>
                    {p.note && (
                      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed rounded-lg bg-muted/30 px-3 py-2 italic">
                        &ldquo;{p.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last message */}
        {rfq.lastUnreadMessage?.content && (
          <div className="px-6 pb-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Latest Message</h3>
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs leading-relaxed">{rfq.lastUnreadMessage.content}</p>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {new Date(rfq.lastUnreadMessage.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ────────────────────────────────── */}
      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
          <Send className="h-4 w-4" /> Send Quote
        </button>
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <MessageCircle className="h-3.5 w-3.5" /> Open Chat
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
        gridTemplateColumns: `${col1} 300px 1fr`,
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
