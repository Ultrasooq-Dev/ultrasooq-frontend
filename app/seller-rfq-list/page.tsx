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
  Sparkles, Search, Package, MapPin, DollarSign, Users,
  MessageCircle, X, Layers, Clock, Send, Star,
  ChevronDown, ChevronUp, Phone, Mail, Award,
  FileText, Paperclip, Filter, Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ACCORDION RFQ — Single scrollable list.
   Each RFQ is a row. Click to expand inline → shows buyer,
   products, and quote form all in one view.
   ═══════════════════════════════════════════════════════════════ */

function mask(n?: string) { return n && n.length > 2 ? n.slice(0, 2) + "***" : n || "***"; }
function maskFull(f?: string, l?: string) { return `${mask(f)}${l ? " " + mask(l) : ""}`; }

function Stars({ r }: { r: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3 w-3", i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-border")} />
      ))}
    </span>
  );
}

// ── Accordion Row ───────────────────────────────────────────────
function RfqRow({ rfq, expanded, onToggle, currency, onQuote }: {
  rfq: any; expanded: boolean; onToggle: () => void;
  currency: { symbol: string }; onQuote: () => void;
}) {
  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;
  const totalBudget = products.reduce((s: number, p: any) => s + Number(p.offerPrice || p.offerPriceTo || 0), 0);
  const totalQty = products.reduce((s: number, p: any) => s + (p.quantity || 0), 0);

  return (
    <div className={cn(
      "rounded-2xl border transition-all",
      expanded ? "border-primary shadow-lg shadow-primary/5" : "border-border hover:border-border/80 hover:shadow-sm",
    )}>
      {/* ── Collapsed Header — always visible ──────── */}
      <button type="button" onClick={onToggle}
        className="w-full text-start px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            expanded ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
            {buyer?.firstName?.[0] || "?"}
          </div>

          {/* Buyer + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold", expanded && "text-primary")}>
                {maskFull(buyer?.firstName, buyer?.lastName)}
              </span>
              {rfq.unreadMsgCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">{rfq.unreadMsgCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
              {address?.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{address.address.split(",")[0]}</span>}
              <span>{new Date(rfq.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>

          {/* Product thumbnails */}
          <div className="hidden sm:flex items-center gap-1">
            {products.slice(0, 4).map((p: any, i: number) => {
              const img = p.rfqProductDetails?.productImages?.[0]?.image;
              const url = img && validator.isURL(img) ? img : null;
              return (
                <div key={i} className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
                  {url ? <Image src={url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                    : <Package className="m-1.5 h-6 w-6 text-muted-foreground/15" />}
                </div>
              );
            })}
            {products.length > 4 && <span className="text-[9px] font-bold text-muted-foreground">+{products.length - 4}</span>}
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {products.length}</span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {totalQty}</span>
            {totalBudget > 0 && <span className="font-semibold text-foreground">{currency.symbol}{totalBudget.toFixed(0)}</span>}
          </div>

          {/* Expand icon */}
          {expanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground/40" />}
        </div>
      </button>

      {/* ── Expanded Content ────────────────────────── */}
      {expanded && (
        <div className="border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-0">

            {/* Col 1: Buyer Info */}
            <div className="border-b lg:border-b-0 lg:border-e border-border p-5 space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer</h4>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                  {buyer?.firstName?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold">{maskFull(buyer?.firstName, buyer?.lastName)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {buyer?.phoneNumber && <span>{mask(buyer.phoneNumber)}</span>}
                    {buyer?.email && <span>{mask(buyer.email)}</span>}
                  </div>
                </div>
              </div>

              {/* Ratings inline */}
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><Stars r={4.2} /> <b className="text-amber-600">4.2</b> RFQ</span>
                <span className="flex items-center gap-1"><Stars r={4.5} /> <b className="text-emerald-600">4.5</b> Total</span>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>7 RFQs</span> <span>·</span> <span>23 Orders</span>
                {address?.rfqDate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Clock className="h-3 w-3" /> {new Date(address.rfqDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </>
                )}
              </div>

              {/* Quick actions */}
              <div className="space-y-2 pt-2">
                <button type="button" onClick={onQuote}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
                  <Send className="h-3.5 w-3.5" /> Send Quote
                </button>
                <button type="button" onClick={onQuote}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <MessageCircle className="h-3 w-3" /> Open Chat
                </button>
              </div>
            </div>

            {/* Col 2-3: Products */}
            <div className="lg:col-span-2 p-5">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Products ({products.length})
              </h4>
              <div className="space-y-3">
                {products.map((p: any, i: number) => {
                  const pd = p.rfqProductDetails || {};
                  const img = pd.productImages?.[0]?.image;
                  const imgUrl = img && validator.isURL(img) ? img : null;
                  const budget = p.offerPrice || p.offerPriceTo || p.offerPriceFrom;
                  const note = p.note || "";

                  const reqs = [
                    { l: "Quality", m: /quality|cert|iso/i }, { l: "Warranty", m: /warranty/i },
                    { l: "Samples", m: /sample/i }, { l: "Custom Pkg", m: /custom.*pack/i },
                    { l: "Branding", m: /brand|logo/i }, { l: "Express", m: /express|urgent|fast/i },
                  ].filter((r) => r.m.test(note + " " + (pd.productName || "")));

                  return (
                    <div key={i} className="flex gap-4 rounded-xl border border-border p-3">
                      {/* Image */}
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {imgUrl ? <Image src={imgUrl} alt="" width={96} height={96} className="h-full w-full object-cover" />
                          : <Package className="m-6 h-12 w-12 text-muted-foreground/10" />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-[13px] font-bold leading-snug line-clamp-2">{pd.productName || `Product ${i + 1}`}</h5>
                          {p.productType && (
                            <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold text-white",
                              p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                              {p.productType === "SAME" ? "EXACT" : "SIMILAR"}
                            </span>
                          )}
                        </div>

                        {/* Specs row */}
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          {p.quantity && <span>Qty: <b className="text-foreground">{p.quantity}</b></span>}
                          {budget && <span>Budget: <b className="text-foreground">{currency.symbol}{Number(budget).toFixed(0)}</b></span>}
                          {p.offerPriceFrom && p.offerPriceTo && (
                            <span className="text-[10px]">({currency.symbol}{p.offerPriceFrom} — {currency.symbol}{p.offerPriceTo})</span>
                          )}
                        </div>

                        {/* Requirements */}
                        {reqs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reqs.map((r) => (
                              <span key={r.l} className="rounded-full bg-primary/5 border border-primary/15 px-2 py-0.5 text-[9px] font-semibold text-primary">
                                ✓ {r.l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Note */}
                        {note && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 dark:bg-amber-950/20 dark:border-amber-800">
                            {note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function SellerRfqListPage() {
  const { currency } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [search, setSearch] = useState("");
  const [showRec, setShowRec] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => { if (!hasPermission) router.push("/home"); }, [hasPermission, router]);

  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page: 1, limit: 100 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  const scored = useMemo(() => {
    return allRfqs.map((rfq) => {
      const prods = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      let s = 0;
      if (rfq.unreadMsgCount > 0) s += 4;
      if (prods.some((p: any) => (p.quantity || 0) >= 10)) s += 2;
      if (prods.some((p: any) => p.productType === "SIMILAR")) s += 1;
      if (prods.length > 1) s += 1;
      return { rfq, isRec: s >= 2 };
    });
  }, [allRfqs]);

  const filtered = useMemo(() => {
    let items = showRec ? scored.filter((s) => s.isRec) : scored;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((s) => {
        const prods = s.rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return prods.some((p: any) => p.rfqProductDetails?.productName?.toLowerCase().includes(q))
          || s.rfq.buyerIDDetail?.firstName?.toLowerCase().includes(q);
      });
    }
    return items;
  }, [scored, showRec, search]);

  if (!hasPermission) return <div />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">RFQ Requests</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{allRfqs.length} requests from buyers</p>
          </div>
          <a href="/rfq" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90">
            <Eye className="h-4 w-4" /> Browse Market
          </a>
        </div>

        {/* Filter bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-sm px-4 py-3 mb-4 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, buyers..."
              className="w-full rounded-xl border border-border bg-muted/30 py-2 pe-3 ps-10 text-sm outline-none focus:border-primary" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
          </div>

          <button type="button" onClick={() => setShowRec(!showRec)}
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              showRec ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted")}>
            <Sparkles className="h-3.5 w-3.5" /> Recommended
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              showRec ? "bg-white/20" : "bg-muted")}>{scored.filter((s) => s.isRec).length}</span>
          </button>

          <span className="ms-auto text-xs text-muted-foreground">{filtered.length} results</span>
        </div>

        {/* RFQ List */}
        <div className="space-y-3">
          {sellerRfqs.isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border py-20 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/15" />
              <p className="text-sm font-semibold text-muted-foreground/40">No RFQ requests found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <RfqRow key={item.rfq.id} rfq={item.rfq}
                expanded={expandedId === item.rfq.id}
                onToggle={() => setExpandedId(expandedId === item.rfq.id ? null : item.rfq.id)}
                currency={currency}
                onQuote={() => router.push(`/seller-rfq-request?rfqId=${item.rfq.rfqQuotesId}&tab=rfq`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
