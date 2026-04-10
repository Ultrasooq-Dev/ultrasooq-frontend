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
  Phone, Mail, Award, FileText, Paperclip, Eye,
  ShoppingCart, ChevronRight,
} from "lucide-react";

function mask(n?: string) { return n && n.length > 2 ? n.slice(0, 2) + "***" : n || "***"; }
function maskFull(f?: string, l?: string) { return `${mask(f)}${l ? " " + mask(l) : ""}`; }
function Stars2({ r }: { r: number }) {
  return <span className="inline-flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={cn("h-3 w-3", i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-border")} />)}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   2-PANEL: Compact list (left) + Scrollable detail (right)
   Left panel uses tiny rows — 1 line per RFQ = see 20+ at once
   Right panel shows everything about the selected RFQ
   ═══════════════════════════════════════════════════════════════ */

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

  const scored = useMemo(() => allRfqs.map(rfq => {
    const prods = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
    let s = 0;
    if (rfq.unreadMsgCount > 0) s += 4;
    if (prods.some((p: any) => (p.quantity || 0) >= 10)) s += 2;
    if (prods.some((p: any) => p.productType === "SIMILAR")) s += 1;
    if (prods.length > 1) s += 1;
    return { rfq, isRec: s >= 2 };
  }), [allRfqs]);

  const filtered = useMemo(() => {
    let items = showRec ? scored.filter(s => s.isRec) : scored;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(s => {
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

      {/* ═══ LEFT: Compact RFQ List ═══ */}
      <div className="w-[260px] shrink-0 flex flex-col border-e border-border bg-card">
        {/* Header + Search */}
        <div className="shrink-0 p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">RFQ Requests</h2>
            <span className="text-[10px] text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full rounded-lg border border-border bg-muted/30 py-1.5 pe-2 ps-8 text-[11px] outline-none focus:border-primary" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute end-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
          </div>
          <button type="button" onClick={() => setShowRec(!showRec)}
            className={cn("flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all",
              showRec ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
            <Sparkles className="h-3 w-3" /> Recommended
            <span className={cn("ms-auto rounded-full px-1.5 py-0.5 text-[8px] font-bold", showRec ? "bg-primary text-white" : "bg-muted")}>{scored.filter(s => s.isRec).length}</span>
          </button>
        </div>

        {/* List — compact rows */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(item => {
            const r = item.rfq;
            const buyer = r.buyerIDDetail;
            const prods = r.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
            const budget = prods.reduce((s: number, p: any) => s + Number(p.offerPrice || p.offerPriceTo || 0), 0);
            const isSelected = selectedId === r.id;

            return (
              <button key={r.id} type="button" onClick={() => setSelectedId(r.id)}
                className={cn("w-full text-start flex items-center gap-2 px-3 py-2 border-b border-border/30 transition-all",
                  isSelected ? "bg-primary/5 border-e-[3px] border-e-primary" : "hover:bg-muted/20")}>
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold",
                  isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{buyer?.firstName?.[0] || "?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {item.isRec && <Sparkles className="h-2 w-2 text-primary shrink-0" />}
                    <span className={cn("text-[11px] font-semibold truncate", isSelected && "text-primary")}>{maskFull(buyer?.firstName, buyer?.lastName)}</span>
                    <span className="ms-auto text-[9px] text-muted-foreground">{prods.length}📦</span>
                    {r.unreadMsgCount > 0 && <span className="rounded-full bg-primary px-1 py-px text-[7px] font-bold text-white">{r.unreadMsgCount}</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && !sellerRfqs.isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-2 h-6 w-6 text-muted-foreground/15" />
              <p className="text-[10px] text-muted-foreground/40">No requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT: Full Detail (scrollable) ═══ */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-background">
        {!selectedRfq ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-12">
            <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/10" />
            <p className="text-base font-semibold text-muted-foreground/30">Select an RFQ</p>
            <p className="mt-1 text-sm text-muted-foreground/20">Choose a request to see customer, products & send a quote</p>
          </div>
        ) : (() => {
          const rfq = selectedRfq;
          const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
          const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
          const buyer = rfq.buyerIDDetail;

          return (
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

              {/* ── Customer Card ──────────────────────── */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                    {buyer?.firstName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{maskFull(buyer?.firstName, buyer?.lastName)}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {address?.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{address.address}</span>}
                      {buyer?.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{mask(buyer.phoneNumber)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1"><Stars2 r={4.2} /> <span className="text-xs font-bold text-amber-600">4.2</span></div>
                    <span className="text-[9px] text-muted-foreground">7 RFQs · 23 Orders</span>
                  </div>
                </div>

                {address?.rfqDate && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm dark:bg-amber-950/20 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-300">
                      Delivery by {new Date(address.rfqDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Products ──────────────────────────── */}
              <div>
                <h3 className="text-sm font-bold mb-3">Requested Products ({products.length})</h3>
                <div className="space-y-4">
                  {products.map((p: any, i: number) => {
                    const pd = p.rfqProductDetails || {};
                    const img = pd.productImages?.[0]?.image;
                    const imgUrl = img && validator.isURL(img) ? img : null;
                    const budget = p.offerPrice || p.offerPriceTo || p.offerPriceFrom;
                    const note = p.note || "";
                    const reqs = [
                      { l: "Quality Cert", m: /quality|cert|iso/i }, { l: "Warranty", m: /warranty/i },
                      { l: "Samples", m: /sample/i }, { l: "Custom Pkg", m: /custom.*pack/i },
                      { l: "Branding", m: /brand|logo/i }, { l: "Express", m: /express|urgent|fast/i },
                    ].filter(r => r.m.test(note + " " + (pd.productName || "")));

                    return (
                      <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex">
                          {/* Image */}
                          <div className="w-48 shrink-0 bg-muted relative overflow-hidden">
                            {imgUrl ? <Image src={imgUrl} alt="" fill className="object-contain p-3" />
                              : <div className="flex h-full w-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/10" /></div>}
                            {p.productType && (
                              <span className={cn("absolute top-2 start-2 rounded-md px-2 py-0.5 text-[9px] font-bold text-white",
                                p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                                {p.productType === "SAME" ? "EXACT" : "SIMILAR OK"}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-[15px] font-bold leading-snug">{pd.productName || `Product ${i + 1}`}</h4>
                              <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold">#{i + 1}</span>
                            </div>

                            {/* Specs */}
                            <div className="flex gap-3">
                              {p.quantity && (
                                <div className="rounded-xl bg-muted/50 px-4 py-2">
                                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Qty</p>
                                  <p className="text-xl font-black">{p.quantity}</p>
                                </div>
                              )}
                              {budget && (
                                <div className="rounded-xl bg-muted/50 px-4 py-2">
                                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Budget</p>
                                  <p className="text-xl font-black">{currency.symbol}{Number(budget).toFixed(0)}</p>
                                  {p.offerPriceFrom && p.offerPriceTo && <p className="text-[9px] text-muted-foreground">{currency.symbol}{p.offerPriceFrom} — {currency.symbol}{p.offerPriceTo}</p>}
                                </div>
                              )}
                            </div>

                            {/* Requirements */}
                            {reqs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {reqs.map(r => (
                                  <span key={r.l} className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary">✓ {r.l}</span>
                                ))}
                              </div>
                            )}

                            {/* Note */}
                            {note && (
                              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
                                {note}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Attachments ────────────────────────── */}
              <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-center">
                <Paperclip className="mx-auto h-5 w-5 text-muted-foreground/30 mb-1" />
                <p className="text-[11px] text-muted-foreground/50">No attachments provided</p>
              </div>

              {/* ── Actions ────────────────────────────── */}
              <div className="flex gap-3">
                <button type="button" onClick={() => router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  <Send className="h-4 w-4" /> Send Quote
                </button>
                <button type="button" onClick={() => router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <MessageCircle className="h-4 w-4" /> Open Chat
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
