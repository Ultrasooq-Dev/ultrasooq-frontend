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
  ChevronLeft, Clock, Send, Filter, Star,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   4-PANEL RFQ EXPLORER
   P1: Filters (collapsible)
   P2: RFQ list (buyer cards)
   P3: Product cart (items in selected RFQ)
   P4: Product detail (specs of selected product)
   ═══════════════════════════════════════════════════════════════ */

function maskName(n?: string) { return n && n.length > 2 ? n.slice(0, 2) + "***" : n || "***"; }
function maskFull(f?: string, l?: string) { return `${maskName(f)}${l ? " " + maskName(l) : ""}`; }

const CATS = [
  { id: 3, name: "Electronics", e: "💻" }, { id: 292, name: "Fashion", e: "👗" },
  { id: 662, name: "Home & Garden", e: "🏡" }, { id: 1025, name: "Health", e: "💊" },
  { id: 1443, name: "Auto", e: "🚗" }, { id: 1698, name: "Food", e: "🍕" },
  { id: 1882, name: "Appliances", e: "🔌" }, { id: 1240, name: "Sports", e: "⚽" },
  { id: 2250, name: "Industrial", e: "🏭" }, { id: 2353, name: "Construction", e: "🏗️" },
];

// ── P1: Filter Sidebar ──────────────────────────────────────────
function P1({ collapsed, onToggle, search, onSearch, showRec, onRecToggle, recCount, total }: {
  collapsed: boolean; onToggle: () => void; search: string; onSearch: (v: string) => void;
  showRec: boolean; onRecToggle: () => void; recCount: number; total: number;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 border-e border-border bg-card">
        <button type="button" onClick={onToggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Filter className="h-4 w-4" /></button>
        <button type="button" onClick={onRecToggle} className={cn("p-2 rounded-lg", showRec ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}><Sparkles className="h-4 w-4" /></button>
        <button type="button" onClick={onToggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight className="h-3 w-3" /></button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-e border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <span className="text-[11px] font-bold">Filters</span>
        <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3">
        <div className="relative">
          <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search..."
            className="w-full rounded-lg border border-border bg-muted/30 py-1.5 pe-2 ps-7 text-[11px] outline-none focus:border-primary" />
        </div>
        <button type="button" onClick={onRecToggle}
          className={cn("flex w-full items-center gap-2 rounded-lg p-2.5 text-[11px] font-semibold transition-all",
            showRec ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/40 text-muted-foreground hover:bg-muted")}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="flex-1 text-start">Recommended</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold", showRec ? "bg-primary text-white" : "bg-muted")}>{recCount}</span>
        </button>
        <div>
          <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">Categories</h4>
          {CATS.map((c) => (
            <button key={c.id} type="button" className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              <span>{c.e}</span><span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── P2: RFQ Buyer List ──────────────────────────────────────────
function P2({ rfqs, selectedId, onSelect, currency }: {
  rfqs: any[]; selectedId: number | null; onSelect: (id: number) => void; currency: { symbol: string };
}) {
  return (
    <div className="flex flex-col h-full border-e border-border bg-background">
      <div className="shrink-0 px-3 py-2.5 border-b border-border bg-card">
        <span className="text-[11px] font-bold">{rfqs.length} RFQ Requests</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-2 h-6 w-6 text-muted-foreground/15" />
            <p className="text-[10px] text-muted-foreground/40">No requests</p>
          </div>
        ) : (
          rfqs.map((item) => {
            const r = item.rfq;
            const buyer = r.buyerIDDetail;
            const products = r.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
            const isSelected = selectedId === r.id;
            return (
              <button key={r.id} type="button" onClick={() => onSelect(r.id)}
                className={cn(
                  "w-full text-start px-3 py-3 border-b border-border/50 transition-all",
                  isSelected ? "bg-primary/5 border-e-2 border-e-primary" : "hover:bg-muted/30",
                )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    {buyer?.firstName?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.isRec && <Sparkles className="h-2.5 w-2.5 text-primary shrink-0" />}
                      <span className={cn("text-[11px] font-semibold truncate", isSelected ? "text-primary" : "")}>
                        {maskFull(buyer?.firstName, buyer?.lastName)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-muted-foreground">
                      <Package className="h-2.5 w-2.5" />
                      <span>{products.length} product{products.length > 1 ? "s" : ""}</span>
                      {r.unreadMsgCount > 0 && (
                        <span className="rounded-full bg-primary px-1 py-px text-[7px] font-bold text-white">{r.unreadMsgCount}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── P3: Product Cart (items in selected RFQ) ────────────────────
function P3({ rfq, selectedProductIdx, onSelectProduct, currency, onQuote }: {
  rfq: any | null; selectedProductIdx: number | null;
  onSelectProduct: (idx: number) => void; currency: { symbol: string }; onQuote: () => void;
}) {
  if (!rfq) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6 border-e border-border bg-muted/10">
        <Users className="mb-2 h-6 w-6 text-muted-foreground/15" />
        <p className="text-[11px] text-muted-foreground/40">Select an RFQ request</p>
      </div>
    );
  }

  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const buyer = rfq.buyerIDDetail;
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;

  return (
    <div className="flex h-full flex-col border-e border-border bg-card">
      {/* Buyer header */}
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {buyer?.firstName?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold truncate">{maskFull(buyer?.firstName, buyer?.lastName)}</p>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              {address?.address && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{address.address.split(",")[0]}</span>}
              {address?.rfqDate && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(address.rfqDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </div>
          </div>
        </div>
        {/* Rating row */}
        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 4.2 RFQ</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-emerald-400 fill-emerald-400" /> 4.5 Overall</span>
          <span>·</span>
          <span>7 RFQs · 23 Orders</span>
        </div>
      </div>

      {/* Product count */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-muted/20">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Cart — {products.length} product{products.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto">
        {products.map((p: any, i: number) => {
          const pd = p.rfqProductDetails || {};
          const img = pd.productImages?.[0]?.image;
          const imgUrl = img && validator.isURL(img) ? img : null;
          const isSelected = selectedProductIdx === i;
          const budget = p.offerPrice || p.offerPriceTo || p.offerPriceFrom;

          return (
            <button key={i} type="button" onClick={() => onSelectProduct(i)}
              className={cn(
                "w-full text-start px-3 py-3 border-b border-border/50 transition-all flex gap-3",
                isSelected ? "bg-primary/5 border-e-2 border-e-primary" : "hover:bg-muted/20",
              )}>
              {/* Number */}
              <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold mt-0.5",
                isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{i + 1}</div>
              {/* Image */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {imgUrl ? <Image src={imgUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
                  : <Package className="m-2.5 h-7 w-7 text-muted-foreground/15" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-semibold truncate", isSelected ? "text-primary" : "")}>{pd.productName || `Product ${i + 1}`}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                  {p.quantity && <span>Qty: {p.quantity}</span>}
                  {budget && <span className="font-semibold text-foreground">{currency.symbol}{Number(budget).toFixed(0)}</span>}
                  {p.productType && (
                    <span className={cn("rounded px-1 py-px text-[7px] font-bold",
                      p.productType === "SAME" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                      {p.productType === "SAME" ? "EXACT" : "SIMILAR"}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="shrink-0 border-t border-border p-3 space-y-1.5">
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-bold text-white hover:bg-primary/90">
          <Send className="h-3.5 w-3.5" /> Send Quote
        </button>
        <button type="button" onClick={onQuote}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[10px] font-medium text-muted-foreground hover:bg-muted">
          <MessageCircle className="h-3 w-3" /> Open Chat
        </button>
      </div>
    </div>
  );
}

// ── P4: Product Detail ──────────────────────────────────────────
function P4({ product, currency }: { product: any | null; currency: { symbol: string } }) {
  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-8 bg-muted/10">
        <Eye className="mb-2 h-8 w-8 text-muted-foreground/10" />
        <p className="text-[11px] text-muted-foreground/40">Select a product to see details</p>
      </div>
    );
  }

  const pd = product.rfqProductDetails || {};
  const img = pd.productImages?.[0]?.image;
  const imgUrl = img && validator.isURL(img) ? img : null;
  const hasPrice = product.offerPrice || product.offerPriceFrom || product.offerPriceTo;

  // Auto-extract requirements from note
  const note = product.note || "";
  const reqs = [
    { l: "Quality Cert", m: /quality|cert|iso/i },
    { l: "Warranty", m: /warranty|guarantee/i },
    { l: "Samples", m: /sample/i },
    { l: "Custom Pkg", m: /custom.*pack|packaging/i },
    { l: "Branding", m: /brand|logo|print/i },
    { l: "Express", m: /express|urgent|fast|rush/i },
    { l: "Bulk", m: /bulk|wholesale/i },
    { l: "Corporate", m: /corporate|company|business/i },
  ].filter((r) => r.m.test(note + " " + (pd.productName || "")));

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Image */}
      <div className="shrink-0 h-48 bg-muted relative overflow-hidden">
        {imgUrl ? (
          <Image src={imgUrl} alt="" fill className="object-contain p-2" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/10" />
          </div>
        )}
        {product.productType && (
          <span className={cn("absolute top-3 start-3 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow",
            product.productType === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
            {product.productType === "SAME" ? "Exact Match Only" : "Similar Products OK"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Title */}
        <h2 className="text-[16px] font-bold leading-snug">{pd.productName || "Product"}</h2>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {product.quantity && (
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Quantity</p>
              <p className="text-[22px] font-black leading-none mt-1">{product.quantity}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">units requested</p>
            </div>
          )}
          {hasPrice && (
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Budget</p>
              <p className="text-[22px] font-black leading-none mt-1">
                {currency.symbol}{product.offerPrice || product.offerPriceFrom || 0}
              </p>
              {product.offerPriceTo && (
                <p className="text-[9px] text-muted-foreground mt-0.5">up to {currency.symbol}{product.offerPriceTo}</p>
              )}
            </div>
          )}
        </div>

        {/* Requirements badges */}
        {reqs.length > 0 && (
          <div>
            <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {reqs.map((r) => (
                <span key={r.l} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                  ✓ {r.l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buyer's notes */}
        {note && (
          <div>
            <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Buyer&apos;s Notes</h4>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300">
              {note}
            </div>
          </div>
        )}

        {/* Specs (from product if available) */}
        <div>
          <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Specifications</h4>
          <div className="rounded-xl border border-border p-3 text-[11px] text-muted-foreground">
            <p className="italic">Specs will be auto-extracted from product description</p>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Attachments</h4>
          <div className="rounded-xl border border-dashed border-border py-4 text-center">
            <p className="text-[10px] text-muted-foreground/40">No attachments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function SellerRfqListPage() {
  const { currency } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [showRec, setShowRec] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [selectedProductIdx, setSelectedProductIdx] = useState<number | null>(null);

  useEffect(() => { if (!hasPermission) router.push("/home"); }, [hasPermission, router]);

  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page: 1, limit: 100 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  const scored = useMemo(() => {
    return allRfqs.map((rfq) => {
      const prods = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      let s = 0; if (rfq.unreadMsgCount > 0) s += 4;
      if (prods.some((p: any) => (p.quantity || 0) >= 10)) s += 2;
      if (prods.some((p: any) => p.productType === "SIMILAR")) s += 1;
      if (prods.length > 1) s += 1;
      return { rfq, score: s, isRec: s >= 2 };
    }).sort((a, b) => b.score - a.score);
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

  const selectedRfq = selectedRfqId ? allRfqs.find((r: any) => r.id === selectedRfqId) : null;
  const selectedProduct = selectedRfq && selectedProductIdx !== null
    ? (selectedRfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [])[selectedProductIdx]
    : null;

  const col1 = filterCollapsed ? "48px" : "180px";

  if (!hasPermission) return <div />;

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden" style={{
      display: "grid",
      gridTemplateColumns: `${col1} 220px 280px 1fr`,
      gridTemplateRows: "1fr",
      transition: "grid-template-columns 0.2s ease",
    }}>
      <P1 collapsed={filterCollapsed} onToggle={() => setFilterCollapsed(!filterCollapsed)}
        search={search} onSearch={setSearch} showRec={showRec} onRecToggle={() => setShowRec(!showRec)}
        recCount={scored.filter((s) => s.isRec).length} total={allRfqs.length} />

      <P2 rfqs={filtered} selectedId={selectedRfqId}
        onSelect={(id) => { setSelectedRfqId(id); setSelectedProductIdx(0); }}
        currency={currency} />

      <P3 rfq={selectedRfq} selectedProductIdx={selectedProductIdx}
        onSelectProduct={setSelectedProductIdx} currency={currency}
        onQuote={() => selectedRfq && router.push(`/seller-rfq-request?rfqId=${selectedRfq.rfqQuotesId}&tab=rfq`)} />

      <P4 product={selectedProduct} currency={currency} />
    </div>
  );
}
