"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useAllRfqQuotesUsersBySellerId } from "@/apis/queries/rfq.queries";
import { useMe } from "@/apis/queries/user.queries";
import { PERMISSION_RFQ_SELLER_REQUESTS, checkPermission } from "@/helpers/permission";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import {
  Sparkles, Search, Package, MapPin, Clock, DollarSign,
  ChevronRight, Users, MessageCircle, Eye, Filter, X,
  Layers, Tag, Grid3X3, List, SlidersHorizontal,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Categories used for filtering — from the DB
   ═══════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: 3, name: "Electronics", emoji: "💻" },
  { id: 292, name: "Fashion", emoji: "👗" },
  { id: 662, name: "Home & Garden", emoji: "🏡" },
  { id: 1025, name: "Health & Beauty", emoji: "💊" },
  { id: 1443, name: "Automotive", emoji: "🚗" },
  { id: 1544, name: "Baby & Kids", emoji: "👶" },
  { id: 1698, name: "Food & Beverages", emoji: "🍕" },
  { id: 1882, name: "Home Appliances", emoji: "🔌" },
  { id: 1240, name: "Sports & Outdoors", emoji: "⚽" },
  { id: 2250, name: "Industrial", emoji: "🏭" },
  { id: 2353, name: "Construction", emoji: "🏗️" },
  { id: 2715, name: "Agriculture", emoji: "🌾" },
];

// ── RFQ Card ────────────────────────────────────────────────────
function RfqCard({
  rfq, recommended, reason, onClick, currency, viewMode,
}: {
  rfq: any; recommended?: boolean; reason?: string;
  onClick: () => void; currency: { symbol: string }; viewMode: "grid" | "list";
}) {
  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;
  const first = products[0]?.rfqProductDetails;
  const img = first?.productImages?.[0]?.image;
  const imageUrl = img && validator.isURL(img) ? img : null;
  const budget = products[0]?.offerPriceTo || products[0]?.offerPriceFrom;
  const date = address?.rfqDate ? new Date(address.rfqDate) : null;

  if (viewMode === "list") {
    return (
      <button type="button" onClick={onClick}
        className="group flex w-full items-center gap-4 rounded-2xl border border-[#e8ddd0] bg-white px-5 py-4 text-start transition-all hover:shadow-md hover:border-[#c2703e]/20">
        {recommended && <Sparkles className="h-4 w-4 shrink-0 text-[#c2703e]" />}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f3ece3]">
          {imageUrl ? <Image src={imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
            : <Package className="m-3 h-6 w-6 text-[#c9b9a8]" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#2d2017] truncate">{first?.productName || "RFQ Request"}</p>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#8c7b6b]">
            {buyer && <span>{buyer.firstName} {buyer.lastName || ""}</span>}
            <span>·</span>
            <span>{products.length} item{products.length > 1 ? "s" : ""}</span>
            {products[0]?.quantity && <><span>·</span><span>Qty: {products[0].quantity}</span></>}
            {budget && <><span>·</span><span className="font-semibold text-[#2d2017]">{currency.symbol}{Number(budget).toFixed(0)}</span></>}
          </div>
        </div>
        {rfq.unreadMsgCount > 0 && (
          <span className="rounded-full bg-[#c2703e] px-2 py-0.5 text-[9px] font-bold text-white">{rfq.unreadMsgCount}</span>
        )}
        <ChevronRight className="h-4 w-4 text-[#c9b9a8] group-hover:text-[#c2703e] transition-colors" />
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border border-[#e8ddd0] bg-white text-start shadow-sm transition-all hover:shadow-lg hover:border-[#c2703e]/20 overflow-hidden",
        recommended && "ring-1 ring-[#c2703e]/15",
      )}>
      {/* Image */}
      <div className="relative h-36 w-full bg-[#f3ece3] overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-[#c9b9a8]" />
          </div>
        )}
        {recommended && (
          <div className="absolute top-3 start-3 flex items-center gap-1 rounded-lg bg-[#c2703e] px-2 py-1">
            <Sparkles className="h-3 w-3 text-white" />
            <span className="text-[9px] font-bold text-white uppercase">{reason || "For You"}</span>
          </div>
        )}
        {rfq.unreadMsgCount > 0 && (
          <div className="absolute top-3 end-3 flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm px-2 py-1">
            <MessageCircle className="h-3 w-3 text-[#c2703e]" />
            <span className="text-[10px] font-bold text-[#c2703e]">{rfq.unreadMsgCount}</span>
          </div>
        )}
        {products[0]?.productType && (
          <div className="absolute bottom-3 start-3">
            <span className={cn(
              "rounded-md px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm",
              products[0].productType === "SAME" ? "bg-emerald-500/90 text-white" : "bg-blue-500/90 text-white",
            )}>
              {products[0].productType === "SAME" ? "Exact Match" : "Similar OK"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-[#2d2017] leading-snug line-clamp-2">
          {first?.productName || "RFQ Request"}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8c7b6b]">
          <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {products.length} item{products.length > 1 ? "s" : ""}</span>
          {products[0]?.quantity && <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Qty: {products[0].quantity}</span>}
          {budget && <span className="flex items-center gap-1 font-semibold text-[#2d2017]"><DollarSign className="h-3 w-3" /> {currency.symbol}{Number(budget).toFixed(0)}</span>}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {buyer?.profilePicture ? (
              <img src={buyer.profilePicture} className="h-6 w-6 rounded-full object-cover" alt="" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3ece3] text-[9px] font-bold text-[#8c7b6b]">
                {buyer?.firstName?.[0] || "?"}
              </div>
            )}
            <span className="text-[11px] font-medium text-[#2d2017]">{buyer?.firstName} {buyer?.lastName || ""}</span>
          </div>
          {address?.address && (
            <span className="flex items-center gap-1 text-[10px] text-[#8c7b6b]">
              <MapPin className="h-3 w-3" /> {address.address.split(",")[0]}
            </span>
          )}
        </div>

        {products[0]?.note && (
          <p className="mt-3 text-[11px] text-[#8c7b6b] leading-relaxed line-clamp-2 rounded-xl bg-[#faf6f1] px-3 py-2">
            &ldquo;{products[0].note}&rdquo;
          </p>
        )}
      </div>
    </button>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function SellerRfqListPage() {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const router = useRouter();
  const me = useMe();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [tab, setTab] = useState<"recommended" | "browse">("recommended");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [page] = useState(1);

  useEffect(() => { if (!hasPermission) router.push("/home"); }, [hasPermission, router]);

  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page, limit: 100 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  // Recommendation scoring
  const { recommended, all } = useMemo(() => {
    const rec: Array<{ rfq: any; reason: string }> = [];
    for (const rfq of allRfqs) {
      const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      let score = 0; let reason = "";
      if (rfq.unreadMsgCount > 0) { score += 4; reason = "New Message"; }
      if (products.some((p: any) => p.productType === "SIMILAR")) { score += 2; reason = reason || "Similar OK"; }
      if (products.some((p: any) => Number(p.offerPriceTo || 0) > 100)) { score += 2; reason = reason || "High Budget"; }
      if (products.length > 1) { score += 1; reason = reason || "Multi-Item"; }
      if (products.some((p: any) => (p.quantity || 0) >= 10)) { score += 2; reason = reason || "Bulk Order"; }
      if (score >= 2) rec.push({ rfq, reason });
    }
    rec.sort((a, b) => (b.rfq.unreadMsgCount || 0) - (a.rfq.unreadMsgCount || 0));
    return { recommended: rec, all: allRfqs };
  }, [allRfqs]);

  // Filter browse
  const filtered = useMemo(() => {
    let items = all;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((rfq: any) => {
        const prods = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return prods.some((p: any) => p.rfqProductDetails?.productName?.toLowerCase().includes(q))
          || rfq.buyerIDDetail?.firstName?.toLowerCase().includes(q);
      });
    }
    if (typeFilter) {
      items = items.filter((rfq: any) => {
        const prods = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return prods.some((p: any) => p.productType === typeFilter);
      });
    }
    return items;
  }, [all, search, typeFilter]);

  const displayItems = tab === "recommended"
    ? recommended.map((r) => ({ rfq: r.rfq, reason: r.reason, isRec: true }))
    : filtered.map((rfq: any) => ({ rfq, reason: "", isRec: false }));

  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 8);

  if (!hasPermission) return <div />;

  return (
    <div className="min-h-screen bg-[#faf6f1]">
      <div className="mx-auto max-w-[1100px] px-6 py-8">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#2d2017]">RFQ Requests</h1>
            <p className="mt-1 text-[13px] text-[#8c7b6b]">{allRfqs.length} request{allRfqs.length !== 1 ? "s" : ""} from buyers</p>
          </div>
          <Link href="/rfq" className="flex items-center gap-1.5 rounded-2xl bg-[#c2703e] px-4 py-2.5 text-[12px] font-bold text-white hover:opacity-90 transition-all">
            <Eye className="h-4 w-4" /> Browse RFQ Market
          </Link>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="flex gap-1 rounded-2xl bg-white border border-[#e8ddd0] p-1 mb-6">
          {[
            { key: "recommended" as const, label: "Recommended", icon: Sparkles, count: recommended.length },
            { key: "browse" as const, label: "Browse & Filter", icon: SlidersHorizontal, count: allRfqs.length },
          ].map((t) => (
            <button key={t.key} type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all",
                tab === t.key ? "bg-[#c2703e] text-white shadow-sm" : "text-[#8c7b6b] hover:bg-[#f3ece3]",
              )}>
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                tab === t.key ? "bg-white/20" : "bg-[#f3ece3]")}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Browse Controls ─────────────────────────── */}
        {tab === "browse" && (
          <div className="space-y-4 mb-6">
            {/* Search + View toggle */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c9b9a8]" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, buyers..."
                  className="w-full rounded-xl border border-[#e8ddd0] bg-white py-2.5 pe-3 ps-10 text-[13px] outline-none focus:border-[#c2703e] focus:ring-1 focus:ring-[#c2703e]/30" />
                {search && <button type="button" onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-[#c9b9a8]"><X className="h-3.5 w-3.5" /></button>}
              </div>
              <div className="flex rounded-xl border border-[#e8ddd0] bg-white p-0.5">
                <button type="button" onClick={() => setViewMode("grid")}
                  className={cn("rounded-lg p-2 transition-colors", viewMode === "grid" ? "bg-[#c2703e] text-white" : "text-[#8c7b6b]")}>
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setViewMode("list")}
                  className={cn("rounded-lg p-2 transition-colors", viewMode === "list" ? "bg-[#c2703e] text-white" : "text-[#8c7b6b]")}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-2xl border border-[#e8ddd0] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-widest">Categories</h3>
                <button type="button" onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-[10px] font-medium text-[#c2703e] hover:underline">
                  {showAllCategories ? "Show less" : `Show all ${CATEGORIES.length}`}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedCategory(null)}
                  className={cn("rounded-xl px-3 py-2 text-[11px] font-semibold transition-all",
                    !selectedCategory ? "bg-[#c2703e] text-white shadow-sm" : "bg-[#f3ece3] text-[#8c7b6b] hover:bg-[#e8ddd0]")}>
                  All
                </button>
                {visibleCategories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={cn("rounded-xl px-3 py-2 text-[11px] font-semibold transition-all",
                      selectedCategory === cat.id ? "bg-[#c2703e] text-white shadow-sm" : "bg-[#f3ece3] text-[#8c7b6b] hover:bg-[#e8ddd0]")}>
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Type + Active filters */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-[#8c7b6b]">Product Type:</span>
              {["", "SAME", "SIMILAR"].map((v) => (
                <button key={v} type="button" onClick={() => setTypeFilter(v)}
                  className={cn("rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                    typeFilter === v ? "bg-[#c2703e] text-white" : "bg-white border border-[#e8ddd0] text-[#8c7b6b] hover:border-[#c2703e]/30")}>
                  {v === "" ? "All" : v === "SAME" ? "Exact Match" : "Similar OK"}
                </button>
              ))}
              {(search || typeFilter || selectedCategory) && (
                <>
                  <div className="h-4 w-px bg-[#e8ddd0]" />
                  <button type="button" onClick={() => { setSearch(""); setTypeFilter(""); setSelectedCategory(null); }}
                    className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                </>
              )}
              <span className="ms-auto text-[11px] text-[#8c7b6b]">{filtered.length} results</span>
            </div>
          </div>
        )}

        {/* ── Recommended Info ────────────────────────── */}
        {tab === "recommended" && recommended.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#c2703e]/5 border border-[#c2703e]/10 px-5 py-3 mb-6">
            <Sparkles className="h-4 w-4 text-[#c2703e] shrink-0" />
            <p className="text-[12px] font-medium text-[#c2703e]">
              Matched to your products, tags, and past activity — most relevant requests first
            </p>
          </div>
        )}

        {/* ── RFQ Grid/List ───────────────────────────── */}
        {sellerRfqs.isLoading ? (
          <div className={cn("gap-4", viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#e8ddd0] bg-white overflow-hidden">
                <div className="h-36 animate-pulse bg-[#f3ece3]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#f3ece3]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#f3ece3]" />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="rounded-3xl border border-[#e8ddd0] bg-white py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3ece3]">
              <Package className="h-7 w-7 text-[#c9b9a8]" />
            </div>
            <p className="text-[15px] font-bold text-[#2d2017]">
              {tab === "recommended" ? "No recommended RFQs" : "No matches found"}
            </p>
            <p className="mt-1 text-[12px] text-[#8c7b6b]">
              {tab === "recommended" ? "Switch to Browse to see all requests" : "Try different filters"}
            </p>
            {tab === "recommended" && (
              <button type="button" onClick={() => setTab("browse")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c2703e] px-4 py-2 text-[12px] font-semibold text-white">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Browse All
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3",
          )}>
            {displayItems.map((item) => (
              <RfqCard
                key={item.rfq.id}
                rfq={item.rfq}
                recommended={item.isRec}
                reason={item.reason}
                onClick={() => router.push(`/seller-rfq-request?rfqId=${item.rfq.rfqQuotesId}&tab=rfq`)}
                currency={currency}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {displayItems.length > 0 && (
          <p className="mt-6 text-center text-[11px] text-[#8c7b6b]">
            Showing {displayItems.length} of {allRfqs.length} requests
          </p>
        )}
      </div>
    </div>
  );
}
