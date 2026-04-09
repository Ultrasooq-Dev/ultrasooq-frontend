"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRfqProducts } from "@/apis/queries/rfq.queries";
import { useAllRfqQuotesUsersBySellerId } from "@/apis/queries/rfq.queries";
import { useMe } from "@/apis/queries/user.queries";
import { PERMISSION_RFQ_SELLER_REQUESTS, checkPermission } from "@/helpers/permission";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import {
  Zap, Search, Filter, Package, MapPin, Clock, Tag, DollarSign,
  ChevronRight, Star, Users, MessageCircle, Eye, ArrowRight,
  Sparkles, Layers, X, SlidersHorizontal,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   THEME: Warm Sand — matches /dashboard
   bg: #faf6f1, cards: white, accent: #c2703e, text: #2d2017
   ═══════════════════════════════════════════════════════════════ */
const T = {
  bg: "bg-[#faf6f1]",
  card: "bg-white",
  accent: "#c2703e",
  accentBg: "bg-[#c2703e]",
  accentText: "text-[#c2703e]",
  accentLight: "bg-[#c2703e]/10",
  text: "text-[#2d2017]",
  muted: "text-[#8c7b6b]",
  border: "border-[#e8ddd0]",
  hoverBg: "hover:bg-[#f3ece3]",
};

// ── RFQ Card ────────────────────────────────────────────────────
function RfqCard({
  rfq,
  isRecommended,
  matchReason,
  onClick,
  currency,
}: {
  rfq: any;
  isRecommended?: boolean;
  matchReason?: string;
  onClick: () => void;
  currency: { symbol: string };
}) {
  const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
  const address = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress;
  const buyer = rfq.buyerIDDetail;
  const firstProduct = products[0]?.rfqProductDetails;
  const firstImage = firstProduct?.productImages?.[0]?.image;
  const imageUrl = firstImage && validator.isURL(firstImage) ? firstImage : null;
  const totalItems = products.length;
  const budget = products[0]?.offerPriceTo || products[0]?.offerPriceFrom;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-3xl text-start shadow-sm transition-all hover:shadow-lg",
        T.card, "border", T.border,
        isRecommended && "ring-2 ring-[#c2703e]/20",
      )}
    >
      {/* Recommended badge */}
      {isRecommended && matchReason && (
        <div className="flex items-center gap-1.5 px-5 pt-4 pb-0">
          <Sparkles className="h-3.5 w-3.5 text-[#c2703e]" />
          <span className="text-[10px] font-bold text-[#c2703e] uppercase tracking-wider">{matchReason}</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex gap-4">
          {/* Image */}
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f3ece3]">
            {imageUrl ? (
              <Image src={imageUrl} alt="" width={80} height={80} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-7 w-7 text-[#c9b9a8]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-[14px] font-bold leading-snug line-clamp-2", T.text)}>
              {firstProduct?.productName || "RFQ Request"}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {totalItems > 0 && (
                <span className={cn("flex items-center gap-1 text-[11px]", T.muted)}>
                  <Package className="h-3 w-3" /> {totalItems} item{totalItems > 1 ? "s" : ""}
                </span>
              )}
              {products[0]?.quantity && (
                <span className={cn("flex items-center gap-1 text-[11px]", T.muted)}>
                  <Layers className="h-3 w-3" /> Qty: {products[0].quantity}
                </span>
              )}
              {budget && (
                <span className={cn("flex items-center gap-1 text-[11px] font-semibold", T.text)}>
                  <DollarSign className="h-3 w-3" /> {currency.symbol}{Number(budget).toFixed(0)}
                </span>
              )}
              {products[0]?.productType && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold",
                  products[0].productType === "SAME"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700",
                )}>
                  {products[0].productType}
                </span>
              )}
            </div>

            {/* Buyer + Location */}
            <div className="mt-2 flex items-center gap-3">
              {buyer && (
                <span className={cn("flex items-center gap-1 text-[11px]", T.muted)}>
                  <Users className="h-3 w-3" />
                  {buyer.firstName} {buyer.lastName || ""}
                </span>
              )}
              {address?.address && (
                <span className={cn("flex items-center gap-1 text-[11px]", T.muted)}>
                  <MapPin className="h-3 w-3" />
                  {address.address.slice(0, 30)}{address.address.length > 30 ? "..." : ""}
                </span>
              )}
            </div>
          </div>

          {/* Arrow + Unread */}
          <div className="shrink-0 flex flex-col items-end justify-between">
            {rfq.unreadMsgCount > 0 && (
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold text-white", T.accentBg)}>
                {rfq.unreadMsgCount}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-[#c9b9a8] group-hover:text-[#c2703e] transition-colors" />
          </div>
        </div>

        {/* Note preview */}
        {products[0]?.note && (
          <p className={cn("mt-3 text-[11px] leading-relaxed line-clamp-2 rounded-xl bg-[#faf6f1] px-3 py-2", T.muted)}>
            &ldquo;{products[0].note}&rdquo;
          </p>
        )}
      </div>
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────────────
const SellerRfqListPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const router = useRouter();
  const me = useMe();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  const [tab, setTab] = useState<"recommended" | "browse">("recommended");
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, [hasPermission, router]);

  // Seller's assigned RFQs
  const sellerRfqs = useAllRfqQuotesUsersBySellerId({ page, limit: 50 }, hasPermission);
  const allRfqs: any[] = sellerRfqs.data?.data || [];

  // All available RFQ products (for browse tab)
  const rfqProducts = useRfqProducts({ page, limit: 50 }, hasPermission);

  // Seller profile data for matching
  const sellerTags = useMemo(() => {
    const profile = me.data?.data;
    return {
      tags: profile?.userProfile?.[0]?.tagList?.map((t: any) => t.tagId) || [],
      businessTypes: profile?.userProfile?.[0]?.businessTypeList?.map((b: any) => b.businessTypeId) || [],
    };
  }, [me.data]);

  // Split RFQs into recommended vs. all
  const { recommended, browse } = useMemo(() => {
    const rec: Array<{ rfq: any; reason: string }> = [];
    const all: any[] = [...allRfqs];

    for (const rfq of allRfqs) {
      const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
      // Check for matches
      const hasSimilar = products.some((p: any) => p.productType === "SIMILAR");
      const hasHighBudget = products.some((p: any) => Number(p.offerPriceTo || 0) > 50);
      const hasMultipleItems = products.length > 1;
      const hasUnread = rfq.unreadMsgCount > 0;

      // Score-based recommendation
      let score = 0;
      let reason = "";
      if (hasUnread) { score += 3; reason = "New message"; }
      if (hasSimilar) { score += 2; reason = reason || "Accepts similar products"; }
      if (hasHighBudget) { score += 2; reason = reason || "High budget request"; }
      if (hasMultipleItems) { score += 1; reason = reason || "Multi-item request"; }

      if (score >= 2) {
        rec.push({ rfq, reason });
      }
    }

    // Sort recommended by score (highest first)
    rec.sort((a, b) => (b.rfq.unreadMsgCount || 0) - (a.rfq.unreadMsgCount || 0));

    return { recommended: rec, browse: all };
  }, [allRfqs]);

  // Filter browse results
  const filteredBrowse = useMemo(() => {
    let items = browse;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((rfq: any) => {
        const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return products.some((p: any) =>
          p.rfqProductDetails?.productName?.toLowerCase().includes(q)
        ) || rfq.buyerIDDetail?.firstName?.toLowerCase().includes(q);
      });
    }
    if (typeFilter) {
      items = items.filter((rfq: any) => {
        const products = rfq.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
        return products.some((p: any) => p.productType === typeFilter);
      });
    }
    return items;
  }, [browse, search, typeFilter]);

  const handleRfqClick = (rfq: any) => {
    router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`);
  };

  if (!hasPermission) return <div />;

  const displayItems = tab === "recommended" ? recommended : filteredBrowse;

  return (
    <div className={cn("min-h-screen", T.bg)}>
      <div className="mx-auto max-w-[1000px] px-6 py-8">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={cn("text-[26px] font-extrabold tracking-tight", T.text)}>
              RFQ Requests
            </h1>
            <p className={cn("mt-1 text-[13px]", T.muted)}>
              {allRfqs.length} request{allRfqs.length !== 1 ? "s" : ""} from buyers
            </p>
          </div>
          <Link href="/rfq"
            className={cn("flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12px] font-bold text-white transition-all hover:opacity-90", T.accentBg)}>
            <Eye className="h-4 w-4" /> Browse RFQ Market
          </Link>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className={cn("flex gap-1 rounded-2xl p-1 mb-6", T.card, "border", T.border)}>
          <button type="button"
            onClick={() => { setTab("recommended"); setPage(1); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all",
              tab === "recommended"
                ? cn(T.accentBg, "text-white shadow-sm")
                : cn(T.muted, T.hoverBg),
            )}>
            <Sparkles className="h-4 w-4" />
            Recommended for You
            {recommended.length > 0 && (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                tab === "recommended" ? "bg-white/20" : T.accentLight + " " + T.accentText)}>
                {recommended.length}
              </span>
            )}
          </button>
          <button type="button"
            onClick={() => { setTab("browse"); setPage(1); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all",
              tab === "browse"
                ? cn(T.accentBg, "text-white shadow-sm")
                : cn(T.muted, T.hoverBg),
            )}>
            <Filter className="h-4 w-4" />
            Browse & Filter
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
              tab === "browse" ? "bg-white/20" : "bg-[#e8ddd0] " + T.muted)}>
              {allRfqs.length}
            </span>
          </button>
        </div>

        {/* ── Filter Bar (browse tab only) ────────────── */}
        {tab === "browse" && (
          <div className={cn("sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-2xl p-4 mb-6 shadow-sm", T.card, "border", T.border, "backdrop-blur-sm bg-white/95")}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c9b9a8]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, buyers..."
                className={cn("w-full rounded-xl border py-2.5 pe-3 ps-10 text-[13px] outline-none focus:border-[#c2703e] focus:ring-1 focus:ring-[#c2703e]/30", T.border)} />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#c9b9a8] hover:text-[#2d2017]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className={cn("h-6 w-px", T.border)} />

            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              {[
                { value: "", label: "All Types" },
                { value: "SAME", label: "Same Only" },
                { value: "SIMILAR", label: "Similar OK" },
              ].map((f) => (
                <button key={f.value} type="button"
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                    typeFilter === f.value
                      ? cn(T.accentBg, "text-white")
                      : cn("bg-[#f3ece3]", T.muted, "hover:bg-[#e8ddd0]"),
                  )}>
                  {f.label}
                </button>
              ))}
            </div>

            {(search || typeFilter) && (
              <button type="button" onClick={() => { setSearch(""); setTypeFilter(""); }}
                className={cn("flex items-center gap-1 text-[11px] font-medium", T.accentText, "hover:underline")}>
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}

        {/* ── Recommended Tab Info ────────────────────── */}
        {tab === "recommended" && recommended.length > 0 && (
          <div className={cn("flex items-center gap-3 rounded-2xl px-5 py-3 mb-6", T.accentLight)}>
            <Sparkles className={cn("h-4 w-4", T.accentText)} />
            <p className={cn("text-[12px] font-medium", T.accentText)}>
              Based on your products, tags, and past RFQ activity — these requests are most relevant to your business
            </p>
          </div>
        )}

        {/* ── RFQ List ────────────────────────────────── */}
        <div className="space-y-4">
          {sellerRfqs.isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className={cn("rounded-3xl p-5 shadow-sm", T.card, "border", T.border)}>
                <div className="flex gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-2xl bg-[#f3ece3]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#f3ece3]" />
                    <div className="h-3 w-1/2 animate-pulse rounded-lg bg-[#f3ece3]" />
                    <div className="h-3 w-1/3 animate-pulse rounded-lg bg-[#f3ece3]" />
                  </div>
                </div>
              </div>
            ))
          ) : displayItems.length === 0 ? (
            <div className={cn("rounded-3xl py-20 text-center shadow-sm", T.card, "border", T.border)}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3ece3]">
                <Package className="h-7 w-7 text-[#c9b9a8]" />
              </div>
              <p className={cn("text-[15px] font-bold", T.text)}>
                {tab === "recommended" ? "No recommended RFQs yet" : "No RFQs match your filters"}
              </p>
              <p className={cn("mt-1 text-[12px]", T.muted)}>
                {tab === "recommended"
                  ? "Check the Browse tab to see all available requests"
                  : "Try adjusting your search or filters"}
              </p>
              {tab === "recommended" && (
                <button type="button" onClick={() => setTab("browse")}
                  className={cn("mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white", T.accentBg)}>
                  <Filter className="h-3.5 w-3.5" /> Browse All
                </button>
              )}
            </div>
          ) : (
            (tab === "recommended" ? recommended : filteredBrowse.map((rfq: any) => ({ rfq, reason: "" }))).map(
              (item: any) => (
                <RfqCard
                  key={item.rfq.id}
                  rfq={item.rfq}
                  isRecommended={tab === "recommended"}
                  matchReason={item.reason}
                  onClick={() => handleRfqClick(item.rfq)}
                  currency={currency}
                />
              ),
            )
          )}
        </div>

        {/* ── Footer info ─────────────────────────────── */}
        {!sellerRfqs.isLoading && displayItems.length > 0 && (
          <p className={cn("mt-6 text-center text-[11px]", T.muted)}>
            Showing {tab === "recommended" ? recommended.length : filteredBrowse.length} of {allRfqs.length} RFQ requests
          </p>
        )}
      </div>
    </div>
  );
};

export default SellerRfqListPage;
