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
  MessageCircle, Eye, X, Layers, Clock, Send, Star,
  ChevronRight, Filter, User, Phone, Mail, FileText,
  ShoppingCart, Award, Paperclip,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   2-PANEL RFQ — Clean split layout
   Left: Scrollable RFQ list with search + filters
   Right: Tabbed detail (Customer | Products | Send Quote)
   ═══════════════════════════════════════════════════════════════ */

function maskName(n?: string) { return n && n.length > 2 ? n.slice(0, 2) + "***" : n || "***"; }
function maskFull(f?: string, l?: string) { return `${maskName(f)}${l ? " " + maskName(l) : ""}`; }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3 w-3", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border")} />
      ))}
    </div>
  );
}

// ── RFQ Card (left panel) ───────────────────────────────────────
function RfqCard({ rfq, selected, onClick, currency }: {
  rfq: any; selected: boolean; onClick: () => void; currency: { symbol: string };
}) {
  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const buyer = rfq.buyerIDDetail;
  const totalBudget = products.reduce((s: number, p: any) => s + Number(p.offerPrice || p.offerPriceTo || 0), 0);

  return (
    <button type="button" onClick={onClick}
      className={cn(
        "w-full text-start p-4 border-b transition-all",
        selected ? "bg-primary/5 border-e-[3px] border-e-primary border-b-border" : "border-b-border hover:bg-muted/30",
      )}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
          selected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
          {buyer?.firstName?.[0] || "?"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + unread */}
          <div className="flex items-center justify-between">
            <span className={cn("text-[13px] font-semibold", selected && "text-primary")}>
              {maskFull(buyer?.firstName, buyer?.lastName)}
            </span>
            {rfq.unreadMsgCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">{rfq.unreadMsgCount}</span>
            )}
          </div>

          {/* Product thumbnails */}
          <div className="flex items-center gap-1.5 mt-2">
            {products.slice(0, 3).map((p: any, i: number) => {
              const img = p.rfqProductDetails?.productImages?.[0]?.image;
              const url = img && validator.isURL(img) ? img : null;
              return (
                <div key={i} className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
                  {url ? <Image src={url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                    : <Package className="m-1.5 h-6 w-6 text-muted-foreground/15" />}
                </div>
              );
            })}
            {products.length > 3 && <span className="text-[9px] font-bold text-muted-foreground">+{products.length - 3}</span>}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span>{products.length} item{products.length > 1 ? "s" : ""}</span>
            {totalBudget > 0 && <span className="font-semibold text-foreground">{currency.symbol}{totalBudget.toFixed(0)}</span>}
            <span className="ms-auto text-[9px]">
              {new Date(rfq.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Detail Panel (right side) ───────────────────────────────────
function DetailPanel({ rfq, currency, onQuote }: {
  rfq: any | null; currency: { symbol: string }; onQuote: () => void;
}) {
  const [tab, setTab] = useState<"customer" | "products" | "quote">("products");

  if (!rfq) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-12 bg-muted/10">
        <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/10" />
        <p className="text-base font-semibold text-muted-foreground/30">Select an RFQ</p>
        <p className="mt-1 text-sm text-muted-foreground/20">Choose a request from the list to view details</p>
      </div>
    );
  }

  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;

  const tabs = [
    { key: "customer" as const, label: "Customer", icon: User },
    { key: "products" as const, label: `Products (${products.length})`, icon: Package },
    { key: "quote" as const, label: "Send Quote", icon: Send },
  ];

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-border">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3.5 text-[13px] font-semibold border-b-2 transition-all",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Customer Tab ──────────────────────────── */}
        {tab === "customer" && (
          <div className="p-6 space-y-6">
            {/* Profile card */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                {buyer?.firstName?.[0] || "?"}
              </div>
              <div>
                <h2 className="text-lg font-bold">{maskFull(buyer?.firstName, buyer?.lastName)}</h2>
                {address?.address && (
                  <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {address.address}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {buyer?.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {maskName(buyer.phoneNumber)}</span>}
                  {buyer?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {maskName(buyer.email)}</span>}
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RFQ Rating</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-3xl font-black text-amber-600">4.2</span>
                  <div>
                    <Stars rating={4.2} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">7 RFQs completed</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overall Rating</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-600">4.5</span>
                  <div>
                    <Stars rating={4.5} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">23 orders total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "RFQs", value: "7", icon: FileText },
                { label: "Orders", value: "23", icon: Package },
                { label: "Member Since", value: "Mar '25", icon: Award },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/40 p-3 text-center">
                  <s.icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-lg font-black">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Delivery */}
            {address?.rfqDate && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Delivery needed by {new Date(address.rfqDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Products Tab ──────────────────────────── */}
        {tab === "products" && (
          <div className="p-6 space-y-4">
            {products.map((p: any, i: number) => {
              const pd = p.rfqProductDetails || {};
              const img = pd.productImages?.[0]?.image;
              const imgUrl = img && validator.isURL(img) ? img : null;
              const budget = p.offerPrice || p.offerPriceTo || p.offerPriceFrom;

              // Extract requirements from note
              const note = p.note || "";
              const reqs = [
                { l: "Quality Cert", m: /quality|cert|iso/i },
                { l: "Warranty", m: /warranty|guarantee/i },
                { l: "Samples", m: /sample/i },
                { l: "Custom Pkg", m: /custom.*pack|packaging/i },
                { l: "Branding", m: /brand|logo|print/i },
                { l: "Express", m: /express|urgent|fast/i },
              ].filter((r) => r.m.test(note + " " + (pd.productName || "")));

              return (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  {/* Image */}
                  <div className="h-44 bg-muted relative overflow-hidden">
                    {imgUrl ? (
                      <Image src={imgUrl} alt="" fill className="object-contain p-4" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-muted to-muted/50">
                        <Package className="h-12 w-12 text-muted-foreground/10" />
                      </div>
                    )}
                    <div className="absolute top-3 start-3 flex items-center gap-2">
                      <span className="rounded-lg bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background">
                        #{i + 1}
                      </span>
                      {p.productType && (
                        <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold text-white",
                          p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                          {p.productType === "SAME" ? "Exact Match" : "Similar OK"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-[15px] font-bold leading-snug">{pd.productName || `Product ${i + 1}`}</h3>

                    {/* Specs */}
                    <div className="flex gap-3">
                      {p.quantity && (
                        <div className="flex-1 rounded-xl bg-muted/40 p-3">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Quantity</p>
                          <p className="text-2xl font-black mt-0.5">{p.quantity}</p>
                        </div>
                      )}
                      {budget && (
                        <div className="flex-1 rounded-xl bg-muted/40 p-3">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Budget</p>
                          <p className="text-2xl font-black mt-0.5">{currency.symbol}{Number(budget).toFixed(0)}</p>
                          {p.offerPriceFrom && p.offerPriceTo && (
                            <p className="text-[9px] text-muted-foreground">{currency.symbol}{p.offerPriceFrom} — {currency.symbol}{p.offerPriceTo}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Requirements */}
                    {reqs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {reqs.map((r) => (
                          <span key={r.l} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                            ✓ {r.l}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    {note && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
                        {note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Attachments */}
            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <Paperclip className="mx-auto h-5 w-5 text-muted-foreground/30 mb-1" />
              <p className="text-[11px] text-muted-foreground/50">No attachments provided</p>
            </div>
          </div>
        )}

        {/* ── Quote Tab ─────────────────────────────── */}
        {tab === "quote" && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold">Send a Quote</h3>
            <p className="text-sm text-muted-foreground">
              Review the products and submit your pricing to {maskFull(buyer?.firstName, buyer?.lastName)}
            </p>

            {/* Per-product pricing */}
            {products.map((p: any, i: number) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-[13px] font-semibold">{p.rfqProductDetails?.productName || `Product ${i + 1}`}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Your Price ({currency.symbol})</label>
                    <input type="number" placeholder="0.00"
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Available Qty</label>
                    <input type="number" placeholder={String(p.quantity || 0)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                  </div>
                </div>
              </div>
            ))}

            {/* Message */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Message to Buyer</label>
              <textarea rows={3} placeholder="Add delivery timeline, terms, or any notes..."
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none" />
            </div>

            {/* Delivery estimate */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Estimated Delivery</label>
              <input type="date"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            </div>

            <button type="button" onClick={onQuote}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" /> Submit Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function SellerRfqListPage() {
  const { currency } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [search, setSearch] = useState("");
  const [showRec, setShowRec] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { if (!hasPermission) router.push("/home"); }, [hasPermission, router]);

  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page: 1, limit: 100 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  // Score recommendations
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

  const recCount = scored.filter((s) => s.isRec).length;

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

  const selectedRfq = selectedId ? allRfqs.find((r: any) => r.id === selectedId) : null;

  if (!hasPermission) return <div />;

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* ═══ Left: RFQ List ═══ */}
      <div className="w-[380px] shrink-0 flex flex-col border-e border-border bg-card">
        {/* Header */}
        <div className="shrink-0 px-4 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">RFQ Requests</h1>
            <span className="text-xs text-muted-foreground">{filtered.length} of {allRfqs.length}</span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, buyers..."
              className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pe-3 ps-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
          </div>
          {/* Recommended toggle */}
          <button type="button" onClick={() => setShowRec(!showRec)}
            className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              showRec ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/40 text-muted-foreground hover:bg-muted")}>
            <Sparkles className="h-3.5 w-3.5" />
            Recommended for you
            <span className={cn("ms-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold", showRec ? "bg-primary text-white" : "bg-muted")}>{recCount}</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sellerRfqs.isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border-b border-border">
                <div className="flex gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Package className="mb-2 h-8 w-8 text-muted-foreground/15" />
              <p className="text-sm text-muted-foreground/40">No RFQ requests found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <RfqCard key={item.rfq.id} rfq={item.rfq}
                selected={selectedId === item.rfq.id}
                onClick={() => setSelectedId(item.rfq.id)}
                currency={currency} />
            ))
          )}
        </div>
      </div>

      {/* ═══ Right: Detail ═══ */}
      <div className="flex-1 min-w-0">
        <DetailPanel rfq={selectedRfq} currency={currency}
          onQuote={() => selectedRfq && router.push(`/seller-rfq-request?rfqId=${selectedRfq.rfqQuotesId}&tab=rfq`)} />
      </div>
    </div>
  );
}
