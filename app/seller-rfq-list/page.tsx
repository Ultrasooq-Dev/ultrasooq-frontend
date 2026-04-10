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
  ChevronDown, ChevronUp, Phone, Mail,
  FileText, Paperclip, Eye, List, Info,
} from "lucide-react";

function mask(n?: string) { return n && n.length > 2 ? n.slice(0, 2) + "***" : n || "***"; }
function maskFull(f?: string, l?: string) { return `${mask(f)}${l ? " " + mask(l) : ""}`; }

/* ═══════════════════════════════════════════════════════════════
   SINGLE PAGE — Two tabs:
   Tab 1: "All RFQs" — expandable accordion list
   Tab 2: "Details" — full detail view of selected RFQ
   ═══════════════════════════════════════════════════════════════ */

export default function SellerRfqListPage() {
  const { currency } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);
  const [search, setSearch] = useState("");
  const [showRec, setShowRec] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");

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

  const detailRfq = detailId ? allRfqs.find((r: any) => r.id === detailId) : null;

  const openDetail = (id: number) => { setDetailId(id); setActiveTab("detail"); };

  if (!hasPermission) return <div />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">RFQ Requests</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{allRfqs.length} requests from buyers</p>
          </div>
          <a href="/rfq" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary/90">
            <Eye className="h-4 w-4" /> Browse Market
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 mb-5">
          <button type="button" onClick={() => setActiveTab("list")}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
              activeTab === "list" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted")}>
            <List className="h-4 w-4" /> All RFQs
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
              activeTab === "list" ? "bg-white/20" : "bg-muted")}>{filtered.length}</span>
          </button>
          <button type="button" onClick={() => { if (detailId) setActiveTab("detail"); }}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
              activeTab === "detail" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted",
              !detailId && "opacity-40 cursor-not-allowed")}>
            <Info className="h-4 w-4" /> Details
            {detailRfq && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
              activeTab === "detail" ? "bg-white/20" : "bg-muted")}>{maskFull(detailRfq.buyerIDDetail?.firstName)}</span>}
          </button>
        </div>

        {/* ═══ TAB 1: List with expandable rows ═══ */}
        {activeTab === "list" && (
          <>
            {/* Filter bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-4 py-2.5 mb-4 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full rounded-lg border border-border bg-muted/30 py-2 pe-3 ps-10 text-sm outline-none focus:border-primary" />
                {search && <button type="button" onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
              </div>
              <button type="button" onClick={() => setShowRec(!showRec)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                  showRec ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted")}>
                <Sparkles className="h-3.5 w-3.5" /> Recommended
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", showRec ? "bg-white/20" : "bg-muted")}>
                  {scored.filter(s => s.isRec).length}
                </span>
              </button>
              <span className="ms-auto text-xs text-muted-foreground">{filtered.length} results</span>
            </div>

            {/* Accordion list */}
            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-border py-16 text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/15" />
                  <p className="text-sm text-muted-foreground/40">No RFQ requests found</p>
                </div>
              )}
              {filtered.map(item => {
                const r = item.rfq;
                const buyer = r.buyerIDDetail;
                const prods = r.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
                const isExpanded = expandedId === r.id;
                const totalBudget = prods.reduce((s: number, p: any) => s + Number(p.offerPrice || p.offerPriceTo || 0), 0);

                return (
                  <div key={r.id} className={cn("rounded-xl border transition-all",
                    isExpanded ? "border-primary shadow-md" : "border-border hover:shadow-sm")}>

                    {/* Row header */}
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="w-full text-start flex items-center gap-3 px-4 py-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                        isExpanded ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{buyer?.firstName?.[0] || "?"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.isRec && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                          <span className={cn("text-sm font-semibold truncate", isExpanded && "text-primary")}>{maskFull(buyer?.firstName, buyer?.lastName)}</span>
                          {r.unreadMsgCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white">{r.unreadMsgCount}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                          <span>{prods.length} product{prods.length > 1 ? "s" : ""}</span>
                          {totalBudget > 0 && <span className="font-semibold text-foreground">{currency.symbol}{totalBudget.toFixed(0)}</span>}
                        </div>
                      </div>
                      {/* Thumbnails */}
                      <div className="hidden sm:flex items-center gap-1">
                        {prods.slice(0, 3).map((p: any, i: number) => {
                          const img = p.rfqProductDetails?.productImages?.[0]?.image;
                          const url = img && validator.isURL(img) ? img : null;
                          return <div key={i} className="h-8 w-8 shrink-0 rounded-lg bg-muted border border-border overflow-hidden">
                            {url ? <Image src={url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                              : <Package className="m-1 h-6 w-6 text-muted-foreground/10" />}
                          </div>;
                        })}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                    </button>

                    {/* Expanded: quick product preview + "View Full Details" */}
                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3 space-y-2">
                        {prods.map((p: any, i: number) => {
                          const pd = p.rfqProductDetails || {};
                          const img = pd.productImages?.[0]?.image;
                          const imgUrl = img && validator.isURL(img) ? img : null;
                          const budget = p.offerPrice || p.offerPriceTo || p.offerPriceFrom;
                          return (
                            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted overflow-hidden">
                                {imgUrl ? <Image src={imgUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
                                  : <Package className="m-2 h-6 w-6 text-muted-foreground/10" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold truncate">{pd.productName || `Product ${i + 1}`}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  {p.quantity && <span>Qty: {p.quantity}</span>}
                                  {budget && <span className="font-semibold text-foreground">{currency.symbol}{Number(budget).toFixed(0)}</span>}
                                  {p.productType && <span className={cn("rounded px-1 py-px text-[8px] font-bold text-white",
                                    p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>{p.productType}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => openDetail(r.id)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90">
                            <Eye className="h-3.5 w-3.5" /> View Full Details
                          </button>
                          <button type="button" onClick={() => router.push(`/seller-rfq-request?rfqId=${r.rfqQuotesId}&tab=rfq`)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
                            <Send className="h-3.5 w-3.5" /> Quote & Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ TAB 2: Full Detail ═══ */}
        {activeTab === "detail" && detailRfq && (() => {
          const rfq = detailRfq;
          const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
          const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
          const buyer = rfq.buyerIDDetail;

          return (
            <div className="space-y-6">
              {/* Back */}
              <button type="button" onClick={() => setActiveTab("list")}
                className="text-xs font-medium text-muted-foreground hover:text-foreground">
                ← Back to all RFQs
              </button>

              {/* Customer */}
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
                  <div className="shrink-0 text-end">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className={cn("h-3.5 w-3.5", i <= 4 ? "fill-amber-400 text-amber-400" : "text-border")} />)}
                      <span className="text-sm font-bold text-amber-600 ms-1">4.2</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">7 RFQs · 23 Orders</p>
                  </div>
                </div>
                {address?.rfqDate && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm dark:bg-amber-950/20 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-300">
                      Delivery by {new Date(address.rfqDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Products */}
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

                    // All 6 requirement checkboxes (matching buyer form)
                    const allReqs = [
                      { key: "quality", label: "Quality Cert", checked: /quality|cert|iso/i.test(note + " " + (pd.productName || "")) },
                      { key: "warranty", label: "Warranty", checked: /warranty|guarantee/i.test(note) },
                      { key: "samples", label: "Samples", checked: /sample/i.test(note) },
                      { key: "custom_pkg", label: "Custom Pkg", checked: /custom.*pack|packaging/i.test(note) },
                      { key: "branding", label: "Branding", checked: /brand|logo|print/i.test(note) },
                      { key: "express", label: "Express", checked: /express|urgent|fast|rush/i.test(note) },
                    ];

                    return (
                      <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                        {/* Product header: image + title + specs */}
                        <div className="flex">
                          <div className="w-44 shrink-0 bg-muted relative overflow-hidden min-h-[140px]">
                            {imgUrl ? <Image src={imgUrl} alt="" fill className="object-contain p-3" />
                              : <div className="flex h-full w-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/10" /></div>}
                            {p.productType && (
                              <span className={cn("absolute top-2 start-2 rounded-md px-2 py-0.5 text-[9px] font-bold text-white",
                                p.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                                {p.productType === "SAME" ? "EXACT" : "SIMILAR OK"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="text-[15px] font-bold leading-snug">{pd.productName || `Product ${i + 1}`}</h4>
                              <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                            </div>
                            <div className="flex gap-3">
                              {p.quantity && <div className="rounded-xl bg-muted/50 px-4 py-2"><p className="text-[8px] font-bold text-muted-foreground uppercase">Qty</p><p className="text-xl font-black">{p.quantity}</p></div>}
                              {budget && <div className="rounded-xl bg-muted/50 px-4 py-2"><p className="text-[8px] font-bold text-muted-foreground uppercase">Budget</p><p className="text-xl font-black">{currency.symbol}{Number(budget).toFixed(0)}</p>{p.offerPriceFrom && p.offerPriceTo && <p className="text-[9px] text-muted-foreground">{currency.symbol}{p.offerPriceFrom} — {currency.symbol}{p.offerPriceTo}</p>}</div>}
                            </div>
                          </div>
                        </div>

                        {/* Specs & Requirements (per product) */}
                        <div className="border-t border-border px-4 py-3 space-y-3">
                          {/* Buyer's notes */}
                          {note ? (
                            <div>
                              <h5 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Specs & Requirements</h5>
                              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
                                {note}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">No specs or notes provided</p>
                          )}

                          {/* Requirement checkboxes — matching the buyer form exactly */}
                          <div className="flex flex-wrap items-center gap-2">
                            {allReqs.map(r => (
                              <span key={r.key} className={cn(
                                "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold",
                                r.checked
                                  ? "border-primary/30 bg-primary/5 text-primary"
                                  : "border-border bg-muted/30 text-muted-foreground/50",
                              )}>
                                <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded border text-[8px]",
                                  r.checked ? "border-primary bg-primary text-white" : "border-border bg-card")}>
                                  {r.checked && "✓"}
                                </span>
                                {r.label}
                              </span>
                            ))}
                          </div>

                          {/* Attachments (per product) */}
                          <div>
                            <h5 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <Paperclip className="h-3 w-3" /> Attachments
                            </h5>
                            <div className="rounded-xl border border-dashed border-border py-3 text-center">
                              <p className="text-[10px] text-muted-foreground/40">No attachments for this product</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button type="button" onClick={() => router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90">
                  <Send className="h-4 w-4" /> Send Quote
                </button>
                <button type="button" onClick={() => router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                  <MessageCircle className="h-4 w-4" /> Open Chat
                </button>
              </div>
            </div>
          );
        })()}

        {activeTab === "detail" && !detailRfq && (
          <div className="rounded-2xl border border-border py-20 text-center">
            <Info className="mx-auto mb-2 h-8 w-8 text-muted-foreground/15" />
            <p className="text-sm text-muted-foreground/40">No RFQ selected</p>
            <button type="button" onClick={() => setActiveTab("list")} className="mt-3 text-xs font-medium text-primary hover:underline">
              ← Go to list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
