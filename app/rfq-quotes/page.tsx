"use client";
import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/shared/Pagination";
import {
  useAllRfqQuotesByBuyerId,
  useDeleteRfqQuote,
  useAllRfqQuotesUsersByBuyerId,
  useRfqAnalytics,
} from "@/apis/queries/rfq.queries";
import { Skeleton } from "@/components/ui/skeleton";
import validator from "validator";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import DeleteContent from "@/components/shared/DeleteContent";
import { useToast } from "@/components/ui/use-toast";
import { PERMISSION_RFQ_QUOTES, checkPermission } from "@/helpers/permission";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

import moment from "moment";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import {
  FileSearch, Store, BarChart3, TrendingUp, MessageSquare,
  Eye, DollarSign, Clock, Activity, Percent, Package,
  ChevronRight, ChevronUp, ChevronDown, BadgeCheck, Zap, Trash2, CheckCircle2, Circle,
  Send, Users, Paperclip,
} from "lucide-react";
import { SellerRfqListContent } from "@/app/seller-rfq-list/page";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";

// ─── Pluralize helper ─────────────────────────────────────────────
function pl(n: number, singular: string, plural?: string) {
  return n === 1 ? singular : (plural || singular + "s");
}

// ─── Analytics Summary Card ──────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, subtitle, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#c2703e]/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[#8a7560] uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-[#2d2017]">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-[#a89580]">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      <div className="absolute -bottom-4 -end-4 h-16 w-16 rounded-full bg-gradient-to-tl from-[#c2703e]/5 to-transparent" />
    </div>
  );
}

// ─── Timeline Chart Tooltip ──────────────────────────────────────
function TimelineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#e8dfd4] bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-[#2d2017]">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[10px] text-[#8a7560]">
          {p.name}: <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Lifecycle Step ──────────────────────────────────────────────
function LifecycleStep({ label, count, done, isLast }: { label: string; count: number; done: boolean; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
        done ? "bg-[#c2703e] text-white" : "bg-[#e8dfd4] text-[#8a7560]"
      )}>
        {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-[10px] font-semibold leading-tight", done ? "text-[#2d2017]" : "text-[#a89580]")}>
          {label}
        </span>
        <span className="text-[9px] text-[#a89580]">{count}</span>
      </div>
      {!isLast && (
        <div className={cn("h-px w-4 mx-0.5", done ? "bg-[#c2703e]" : "bg-[#e8dfd4]")} />
      )}
    </div>
  );
}

// ─── Products Table (compact accordion for multi-product RFQs) ──
function ProductsTable({ products, rfqId, currency, t }: {
  products: any[];
  rfqId: number;
  currency: { symbol: string };
  t: (key: string) => string;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#2d2017] uppercase tracking-wider">
          Products ({products.length})
        </h3>
        <Link href={`/messages?channel=c_rfq&rfqId=${rfqId}`}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#c2703e] hover:text-[#a85d32] transition-colors">
          <MessageSquare className="h-3 w-3" /> Open Chat
        </Link>
      </div>

      <div className="rounded-xl border border-[#e8dfd4] bg-white overflow-hidden divide-y divide-[#e8dfd4]">
        {products.map((prod: any, idx: number) => {
          const imgUrl = prod.image && validator.isURL(prod.image) ? prod.image : null;
          const budget = prod.budgetTo || prod.budgetFrom || null;
          const note = prod.note || "";
          const isOpen = expandedIdx === idx;

          const allReqs = [
            { key: "quality", label: "Quality Cert", checked: /quality|cert|iso/i.test(note + " " + prod.name) },
            { key: "warranty", label: "Warranty", checked: /warranty|guarantee/i.test(note) },
            { key: "samples", label: "Samples", checked: /sample/i.test(note) },
            { key: "custom_pkg", label: "Custom Pkg", checked: /custom.*pack|packaging/i.test(note) },
            { key: "branding", label: "Branding", checked: /brand|logo|print/i.test(note) },
            { key: "express", label: "Express", checked: /express|urgent|fast|rush/i.test(note) },
          ];
          const activeReqs = allReqs.filter(r => r.checked);

          return (
            <div key={prod.id || idx}>
              {/* Compact row — always visible */}
              <button type="button" onClick={() => setExpandedIdx(isOpen ? null : idx)}
                className={cn("flex items-center gap-3 w-full px-3 py-2.5 text-start transition-colors",
                  isOpen ? "bg-[#faf6f1]" : "hover:bg-[#faf6f1]/50")}>
                {/* Image */}
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#f5ede4] overflow-hidden">
                  {imgUrl ? (
                    <Image src={imgUrl} alt={prod.name} width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="m-2 h-6 w-6 text-[#c2703e]/15" />
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#2d2017] truncate">{prod.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#8a7560] mt-0.5">
                    <span>Qty: <span className="font-bold text-[#2d2017]">{prod.quantity}</span></span>
                    {budget && (
                      <span className="font-bold text-[#2d2017]">{currency.symbol}{Number(budget).toFixed(0)}</span>
                    )}
                    <span className={cn("rounded px-1.5 py-px text-[8px] font-bold text-white",
                      prod.type === "SAME" ? "bg-emerald-500" : "bg-blue-500")}>
                      {prod.type === "SAME" ? "EXACT" : "SIMILAR"}
                    </span>
                    {activeReqs.length > 0 && (
                      <span className="text-[#c2703e] text-[9px]">{activeReqs.length} req{activeReqs.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                {/* Expand arrow */}
                {isOpen ? <ChevronUp className="h-4 w-4 text-[#c2703e] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#a89580]/40 shrink-0" />}
              </button>

              {/* Expanded detail — seller-style full view */}
              {isOpen && (
                <div className="bg-[#faf6f1] px-3 pb-3 space-y-3">
                  {/* Qty + Budget boxes */}
                  <div className="flex gap-2">
                    <div className="rounded-lg bg-white border border-[#e8dfd4] px-3 py-2 text-center">
                      <p className="text-[7px] font-bold text-[#a89580] uppercase">Qty</p>
                      <p className="text-lg font-black text-[#2d2017]">{prod.quantity}</p>
                    </div>
                    {budget && (
                      <div className="rounded-lg bg-white border border-[#e8dfd4] px-3 py-2 text-center">
                        <p className="text-[7px] font-bold text-[#a89580] uppercase">Budget</p>
                        <p className="text-lg font-black text-[#2d2017]">{currency.symbol}{Number(budget).toFixed(0)}</p>
                        {prod.budgetFrom && prod.budgetTo && (
                          <p className="text-[8px] text-[#a89580]">{currency.symbol}{prod.budgetFrom} — {currency.symbol}{prod.budgetTo}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  {note ? (
                    <div>
                      <h5 className="text-[8px] font-bold text-[#8a7560] uppercase tracking-widest mb-1">Specs & Requirements</h5>
                      <div className="rounded-lg bg-white border border-[#e8dfd4] px-3 py-2 text-[11px] leading-relaxed text-[#2d2017]">
                        {note}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] text-[#a89580] italic">No specs or notes</p>
                  )}

                  {/* Requirement chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {allReqs.map(r => (
                      <span key={r.key} className={cn(
                        "flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-medium",
                        r.checked ? "border-[#c2703e]/30 bg-[#c2703e]/5 text-[#c2703e]" : "border-[#e8dfd4] bg-white text-[#a89580]/40",
                      )}>
                        <span className={cn("flex h-3 w-3 items-center justify-center rounded border text-[7px]",
                          r.checked ? "border-[#c2703e] bg-[#c2703e] text-white" : "border-[#e8dfd4] bg-white")}>
                          {r.checked && "✓"}
                        </span>
                        {r.label}
                      </span>
                    ))}
                  </div>

                  {/* Attachments */}
                  <div className="rounded-lg border border-dashed border-[#e8dfd4] bg-white py-2 text-center">
                    <p className="text-[9px] text-[#a89580]/40 flex items-center justify-center gap-1">
                      <Paperclip className="h-3 w-3" /> No attachments
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
const RfqQuotesPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const router = useRouter();
  const searchParamsRfq = useSearchParams();
  const currentAccountRfq = useCurrentAccount();
  const currentRole = currentAccountRfq?.data?.data?.account?.tradeRole;
  const isSeller = currentRole === "COMPANY" || currentRole === "FREELANCER";
  const initialRfqTab = searchParamsRfq?.get("view") === "seller" ? "seller" : searchParamsRfq?.get("view") === "buyer" ? "buyer" : (isSeller ? "seller" : "buyer");
  const [rfqViewTab, setRfqViewTab] = useState<"buyer" | "seller">(initialRfqTab);
  const hasPermission = checkPermission(PERMISSION_RFQ_QUOTES);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>();

  // Analytics data
  const analyticsQuery = useRfqAnalytics(hasPermission && rfqViewTab === "buyer");
  const analytics = analyticsQuery.data?.data;

  const rfqQuotesByBuyerIdQuery = useAllRfqQuotesByBuyerId({ page, limit }, hasPermission);
  const deleteRfqQuote = useDeleteRfqQuote();

  const memoizedRfqQuotesProducts = useMemo(() => {
    return (
      rfqQuotesByBuyerIdQuery.data?.data?.map((item: any) => {
        const prods = item?.rfqQuotesProducts || [];
        return {
          id: item?.id,
          productImages: prods
            .map((ele: any) => ele?.rfqProductDetails?.productImages?.[0]?.image)
            .filter((img: any) => img && typeof img === "string"),
          productNames: prods
            .map((ele: any) => ele?.rfqProductDetails?.productName)
            .filter(Boolean),
          products: prods.map((p: any) => ({
            id: p.id,
            productId: p.rfqProductId,
            name: p.rfqProductDetails?.productName || "Unnamed Product",
            image: p.rfqProductDetails?.productImages?.[0]?.image || null,
            quantity: p.quantity || 1,
            type: p.productType || "SIMILAR",
            budgetFrom: p.offerPriceFrom ? Number(p.offerPriceFrom) : null,
            budgetTo: p.offerPriceTo ? Number(p.offerPriceTo) : null,
            note: p.note || null,
          })),
          rfqDate: item?.rfqQuotes_rfqQuoteAddress?.rfqDate || "-",
          address: item?.rfqQuotes_rfqQuoteAddress?.address || "-",
          countryId: item?.rfqQuotes_rfqQuoteAddress?.countryId,
          stateId: item?.rfqQuotes_rfqQuoteAddress?.stateId,
          cityId: item?.rfqQuotes_rfqQuoteAddress?.cityId,
          createdAt: item?.createdAt,
          productCount: prods.length || 0,
        };
      }) || []
    );
  }, [rfqQuotesByBuyerIdQuery.data?.data]);

  // Match per-RFQ analytics to each card
  const perRfqMap = useMemo(() => {
    const map = new Map<number, any>();
    if (analytics?.perRfq) {
      for (const r of analytics.perRfq) {
        map.set(r.rfqId, r);
      }
    }
    return map;
  }, [analytics?.perRfq]);

  // Build timeline chart data from perRfq analytics
  const timelineData = useMemo(() => {
    if (!analytics?.perRfq || analytics.perRfq.length === 0) return [];
    // Group RFQs by date
    const dateMap = new Map<string, { rfqs: number; views: number; offers: number; responses: number }>();
    for (const r of analytics.perRfq) {
      const date = moment(r.createdAt).format("MMM DD");
      const existing = dateMap.get(date) || { rfqs: 0, views: 0, offers: 0, responses: 0 };
      existing.rfqs += 1;
      existing.views += r.views || 0;
      existing.offers += r.offers || 0;
      existing.responses += r.responses || 0;
      dateMap.set(date, existing);
    }
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => moment(a.date, "MMM DD").valueOf() - moment(b.date, "MMM DD").valueOf());
  }, [analytics?.perRfq]);

  const formatDate = useMemo(
    () => (originalDateString: string) => {
      if (!originalDateString || originalDateString === "-") return "-";
      const originalDate = new Date(originalDateString);
      if (!originalDate || originalDate.toString() === "Invalid Date") return "-";
      return moment(originalDate).format("MMM DD, YYYY");
    },
    [],
  );

  const handleToggleDeleteModal = () => {
    setIsDeleteModalOpen(!isDeleteModalOpen);
    setSelectedProductId(undefined);
  };

  const handleConfirmation = async (isConfirmed: boolean) => {
    if (!isConfirmed) {
      setIsDeleteModalOpen(false);
      setSelectedProductId(undefined);
      return;
    }
    if (!selectedProductId) return;
    const response = await deleteRfqQuote.mutateAsync({ rfqQuotesId: selectedProductId });
    if (response.status && response.data) {
      setIsDeleteModalOpen(false);
      toast({ title: t("product_delete_successful"), description: response.message, variant: "success" });
      setSelectedProductId(undefined);
    } else {
      toast({ title: t("product_delete_failed"), description: response.message, variant: "danger" });
    }
  };

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, []);

  if (!hasPermission) return <div></div>;

  const summary = analytics?.summary;

  return (
    <>
      <div className="min-h-screen bg-[#faf6f1]">
        <div className="container m-auto max-w-7xl px-4 py-8">
          {/* Header + Tabs */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-[#c2703e]/10">
                <BarChart3 className="h-6 w-6 text-[#c2703e]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2d2017]" dir={langDir} translate="no">
                  {t("rfq_quotes") || "RFQ Quotes"}
                </h1>
                <p className="text-sm text-[#8a7560]">
                  Track performance, manage requests & monitor vendor responses
                </p>
              </div>
            </div>
            <div className="flex gap-0 border-b border-[#e8dfd4]">
              <button onClick={() => setRfqViewTab("buyer")}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  rfqViewTab === "buyer"
                    ? "border-[#c2703e] text-[#c2703e]"
                    : "border-transparent text-[#8a7560] hover:text-[#2d2017]"
                )}>
                <FileSearch className="h-4 w-4" />
                My RFQ Requests
              </button>
              {isSeller && (
                <button onClick={() => setRfqViewTab("seller")}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                    rfqViewTab === "seller"
                      ? "border-[#c2703e] text-[#c2703e]"
                      : "border-transparent text-[#8a7560] hover:text-[#2d2017]"
                  )}>
                  <Store className="h-4 w-4" />
                  Seller Requests
                </button>
              )}
            </div>
          </div>

          {rfqViewTab === "seller" && isSeller ? (
            <SellerRfqListContent />
          ) : (
            <>
              {/* ─── Analytics Dashboard ─── */}
              {analyticsQuery.isLoading ? (
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                  </div>
                  <Skeleton className="h-40 rounded-2xl" />
                </div>
              ) : summary && summary.totalRfqs > 0 ? (
                <div className="space-y-4 mb-8">
                  {/* Stat Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard
                      icon={Package}
                      label="Total RFQs"
                      value={summary.totalRfqs}
                      iconBg="bg-blue-50"
                      iconColor="text-blue-600"
                    />
                    <StatCard
                      icon={Activity}
                      label="Active"
                      value={summary.activeRfqs}
                      subtitle={summary.activeRfqs > 0 ? "Currently open" : "None open"}
                      iconBg="bg-green-50"
                      iconColor="text-green-600"
                    />
                    <StatCard
                      icon={DollarSign}
                      label="Offers"
                      value={summary.totalOffers}
                      subtitle={summary.totalOffers > 0 ? pl(summary.totalOffers, "price proposal") : "No offers yet"}
                      iconBg="bg-amber-50"
                      iconColor="text-amber-600"
                    />
                    <StatCard
                      icon={Percent}
                      label="Response Rate"
                      value={`${summary.avgResponseRate}%`}
                      subtitle="Vendor reply rate"
                      iconBg="bg-purple-50"
                      iconColor="text-purple-600"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Best Savings"
                      value={summary.bestSavingsPercent > 0 ? `${summary.bestSavingsPercent}%` : "\u2014"}
                      subtitle={summary.bestSavingsPercent > 0 ? "vs your budget" : "No savings yet"}
                      iconBg="bg-emerald-50"
                      iconColor="text-emerald-600"
                    />
                    <StatCard
                      icon={Clock}
                      label="Pending"
                      value={summary.pendingResponses}
                      subtitle={summary.pendingResponses > 0 ? pl(summary.pendingResponses, "awaiting reply", "awaiting replies") : "All responded"}
                      iconBg="bg-orange-50"
                      iconColor="text-orange-600"
                    />
                  </div>

                  {/* ─── Timeline Chart ─── */}
                  {timelineData.length > 0 && (
                    <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[#c2703e]" />
                          <h3 className="text-sm font-bold text-[#2d2017]">RFQ Activity Timeline</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px]">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#c2703e]" /> Views</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Responses</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Offers</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c2703e" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#c2703e" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="gResponses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="gOffers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a7560" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#a89580" }} tickLine={false} axisLine={false} width={30} />
                          <Tooltip content={<TimelineTooltip />} />
                          <Area type="monotone" dataKey="views" name="Views" stroke="#c2703e" strokeWidth={2} fill="url(#gViews)" dot={{ r: 3, fill: "#c2703e", strokeWidth: 0 }} />
                          <Area type="monotone" dataKey="responses" name="Responses" stroke="#a855f7" strokeWidth={1.5} fill="url(#gResponses)" dot={{ r: 2, fill: "#a855f7", strokeWidth: 0 }} />
                          <Area type="monotone" dataKey="offers" name="Offers" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gOffers)" dot={{ r: 2, fill: "#f59e0b", strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Loading State */}
              {rfqQuotesByBuyerIdQuery?.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                  ))}
                </div>
              ) : null}

              {/* Empty State */}
              {!memoizedRfqQuotesProducts.length && !rfqQuotesByBuyerIdQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[#e8dfd4] bg-white/50">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5ede4]">
                    <FileSearch className="h-10 w-10 text-[#c2703e]/60" />
                  </div>
                  <p className="text-center text-lg font-medium text-[#8a7560]" dir={langDir} translate="no">
                    {t("no_product_found")}
                  </p>
                  <p className="mt-2 text-sm text-[#a89580]">
                    Submit your first RFQ from the Product Hub to get started
                  </p>
                  <Link href="/product-hub"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#c2703e] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#a85d32] transition-colors">
                    <Zap className="h-4 w-4" /> Go to Product Hub
                  </Link>
                </div>
              ) : null}

              {/* ─── RFQ Quote Cards ─── */}
              {!rfqQuotesByBuyerIdQuery.isLoading && memoizedRfqQuotesProducts.length > 0 && (
                <div className="space-y-4">
                  {memoizedRfqQuotesProducts.map((item: any) => (
                    <RfqQuoteCard
                      key={item?.id}
                      item={item}
                      analytics={perRfqMap.get(item?.id)}
                      formatDate={formatDate}
                      onDelete={() => { handleToggleDeleteModal(); setSelectedProductId(item?.id); }}
                      langDir={langDir}
                      t={t}
                      currency={currency}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {rfqQuotesByBuyerIdQuery.data?.totalCount > limit && (
                <div className="mt-8">
                  <Pagination page={page} setPage={setPage} totalCount={rfqQuotesByBuyerIdQuery.data?.totalCount} limit={limit} />
                </div>
              )}

              <Dialog open={isDeleteModalOpen} onOpenChange={handleToggleDeleteModal}>
                <DeleteContent
                  onClose={() => handleConfirmation(false)}
                  onConfirm={() => handleConfirmation(true)}
                  isLoading={deleteRfqQuote.isPending}
                />
              </Dialog>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Enhanced RFQ Quote Card ─────────────────────────────────────
interface RfqQuoteCardProps {
  item: any;
  analytics?: {
    views: number;
    responses: number;
    offers: number;
    bestPrice: number | null;
    avgPrice: number | null;
    responseRate: number;
    timeToFirstResponse: string | null;
    status: string;
    productCount?: number;
    timeline?: Array<{ date: string; views: number; responses: number; offers: number }>;
  };
  formatDate: (date: string) => string;
  onDelete: () => void;
  langDir: string;
  t: (key: string) => string;
  currency: { symbol: string };
}

const RfqQuoteCard: React.FC<RfqQuoteCardProps> = ({
  item, analytics, formatDate, onDelete, langDir, t, currency,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch vendor data for expanded view only
  const vendorsQuery = useAllRfqQuotesUsersByBuyerId(
    { page: 1, limit: 100, rfqQuotesId: item?.id },
    isExpanded && !!item?.id,
  );

  const vendorCount = vendorsQuery.data?.data?.length || analytics?.views || 0;

  const totalUnreadMessages = useMemo(() => {
    if (!vendorsQuery.data?.data || !Array.isArray(vendorsQuery.data.data)) return 0;
    return vendorsQuery.data.data.reduce((total: number, vendor: any) => {
      const count = vendor.unreadMsgCount || vendor.unreadMessageCount || 0;
      return total + (typeof count === "number" ? count : 0);
    }, 0);
  }, [vendorsQuery.data?.data]);

  const getVendorOfferPrice = (vendor: any) => {
    const products = vendor?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];
    const hasPriceRequests = vendor?.rfqProductPriceRequests?.length > 0;
    if (hasPriceRequests && products.length > 0) {
      const total = products.reduce((sum: number, product: any) => {
        const pr = vendor.rfqProductPriceRequests?.find((r: any) => r.rfqQuoteProductId === product.id);
        return pr ? sum + parseFloat(pr.requestedPrice || "0") * (product.quantity || 1) : sum;
      }, 0);
      return total > 0 ? total.toString() : null;
    }
    if (products.length > 0) {
      const allHaveBudget = products.every((p: any) => p.offerPriceFrom > 0 && p.offerPriceTo > 0);
      if (allHaveBudget) {
        const budgetMax = products.reduce((s: number, p: any) => s + parseFloat(p.offerPriceTo || "0") * (p.quantity || 1), 0);
        if (Math.abs(parseFloat(vendor?.offerPrice || "0") - budgetMax) < 0.01) return null;
      }
    }
    return vendor?.offerPrice || null;
  };

  const vendorsWithOffers = useMemo(() => {
    if (!vendorsQuery.data?.data) return [];
    return vendorsQuery.data.data
      .map((v: any) => ({ ...v, calculatedOfferPrice: getVendorOfferPrice(v) }))
      .filter((v: any) => v.calculatedOfferPrice && v.calculatedOfferPrice !== "-" && v.calculatedOfferPrice !== null);
  }, [vendorsQuery.data?.data]);

  const isActive = analytics?.status === "active";
  const views = analytics?.views || 0;
  const responses = analytics?.responses || 0;
  const offers = analytics?.offers || 0;

  // First product name for display
  const primaryProductName = item?.productNames?.[0] || null;
  const remainingProducts = (item?.productCount || 0) - 1;

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md",
      isExpanded ? "border-[#c2703e]/30" : "border-[#e8dfd4]")}>
      {/* ─── Compact Row (always visible) — matches seller-list design ─── */}
      <button type="button" onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-4 w-full px-4 py-3.5 text-start hover:bg-[#faf6f1]/50 transition-colors">
        {/* Product thumbnail */}
        <div className="h-12 w-12 shrink-0 rounded-xl bg-[#f5ede4] overflow-hidden border border-[#e8dfd4]">
          {item?.productImages?.[0] && validator.isURL(item.productImages[0]) ? (
            <Image src={item.productImages[0]} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <Package className="m-3 h-6 w-6 text-[#c2703e]/20" />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#2d2017]">
              RFQ{String(item?.id || "").padStart(5, "0")}
            </span>
            <span className="text-[10px] text-[#8a7560]">
              {item?.productCount} {pl(item?.productCount || 0, "product")}
            </span>
            {analytics && (
              <span className={cn(
                "rounded px-1.5 py-px text-[8px] font-bold uppercase",
                isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
              )}>
                {isActive ? "Active" : "Expired"}
              </span>
            )}
          </div>
          {primaryProductName && (
            <p className="text-[11px] text-[#8a7560] truncate mt-0.5">
              {primaryProductName}
              {remainingProducts > 0 && <span className="text-[#a89580]"> +{remainingProducts} more</span>}
            </p>
          )}
          <div className="flex items-center gap-2 text-[9px] text-[#a89580] mt-0.5">
            <span>{formatDate(item?.createdAt)}</span>
            {views > 0 && (
              <span className="font-medium"><span className="text-[#c2703e]">{views}</span> {pl(views, "vendor")}</span>
            )}
            {responses > 0 && (
              <span className="font-medium"><span className="text-purple-600">{responses}</span> {pl(responses, "response")}</span>
            )}
            {offers > 0 && (
              <span className="font-medium text-green-600">{offers} {pl(offers, "offer")}</span>
            )}
          </div>
        </div>

        {/* Right side: actions + expand */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link href={`/messages?channel=c_rfq&rfqId=${item?.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e8dfd4] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#8a7560] hover:border-[#c2703e] hover:text-[#c2703e] transition-all">
            <MessageSquare className="h-3 w-3" /> Chat
          </Link>
          <button type="button" onClick={onDelete}
            className="rounded-lg border border-[#e8dfd4] bg-white p-1.5 text-[#8a7560] hover:border-red-300 hover:text-red-500 transition-all">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {isExpanded ? <ChevronUp className="h-4 w-4 text-[#c2703e] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#a89580]/40 shrink-0" />}
      </button>

      {/* ─── Expanded: Products + Timeline + Vendors ─── */}
      {isExpanded && (
        <div className="border-t border-[#e8dfd4]">
          {/* Lifecycle + Mini Timeline */}
          {analytics && (
            <div className="px-4 py-3 space-y-2 bg-white">
              <div className="flex items-center gap-1">
                <LifecycleStep label="Created" count={1} done={true} />
                <LifecycleStep label="Vendors" count={views} done={views > 0} />
                <LifecycleStep label="Responses" count={responses} done={responses > 0} />
                <LifecycleStep label="Offers" count={offers} done={offers > 0} isLast />
                {analytics.bestPrice && (
                  <span className="ms-auto flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                    <TrendingUp className="h-2.5 w-2.5" /> Best: {currency.symbol}{analytics.bestPrice}
                  </span>
                )}
              </div>

              {analytics.timeline && analytics.timeline.length >= 1 && (
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={analytics.timeline} margin={{ top: 2, right: 4, left: 0, bottom: 2 }}>
                    <defs>
                      <linearGradient id={`mv-${item?.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c2703e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c2703e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8a7560" }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip content={<TimelineTooltip />} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#c2703e" strokeWidth={2} fill={`url(#mv-${item?.id})`} dot={{ r: 3, fill: "#c2703e", strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="responses" name="Responses" stroke="#a855f7" strokeWidth={1.5} fill="transparent" dot={{ r: 2, fill: "#a855f7", strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="offers" name="Offers" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" dot={{ r: 2, fill: "#f59e0b", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Products + Vendor Quotes */}
          <div className="bg-[#faf6f1] p-5 space-y-4">
          {/* ─── Products table (compact, accordion per-product) ─── */}
          <ProductsTable products={item?.products || []} rfqId={item?.id} currency={currency} t={t} />

          {/* ─── Vendor Quotes ─── */}
          {vendorsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : vendorsWithOffers.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#2d2017]">
                  {t("vendor_quotes") || "Vendor Quotes"} ({vendorsWithOffers.length})
                </h3>
                {totalUnreadMessages > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-[#c2703e]/10 px-2.5 py-0.5">
                    <MessageSquare className="h-3 w-3 text-[#c2703e]" />
                    <span className="text-[10px] font-bold text-[#c2703e]">{totalUnreadMessages} unread</span>
                  </div>
                )}
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                {vendorsWithOffers.map((vendor: any) => (
                  <Link key={vendor.id} href={`/messages?channel=c_rfq&rfqId=${item?.id}`}
                    className="group rounded-xl border border-[#e8dfd4] bg-white p-3.5 transition-all hover:shadow-md hover:border-[#c2703e]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white ring-2 ring-[#e8dfd4]">
                          <Image src={vendor.sellerIDDetail?.profilePicture || PlaceholderImage}
                            alt={vendor.sellerIDDetail?.accountName || "Vendor"} fill className="object-cover" sizes="36px" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#2d2017] group-hover:text-[#c2703e] transition-colors text-sm leading-tight">
                            {vendor.sellerIDDetail?.accountName ||
                              `${vendor.sellerIDDetail?.firstName || ""} ${vendor.sellerIDDetail?.lastName || ""}`.trim() || "Vendor"}
                          </h4>
                          {vendor.calculatedOfferPrice && vendor.calculatedOfferPrice !== "-" ? (
                            <p className="text-xs font-bold text-green-600">
                              {currency.symbol}{vendor.calculatedOfferPrice}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#a89580]">No offer yet</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {vendor.unreadMsgCount > 0 && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c2703e] text-[9px] font-bold text-white">
                            {vendor.unreadMsgCount > 9 ? "9+" : vendor.unreadMsgCount}
                          </div>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-[#a89580] group-hover:text-[#c2703e] transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <BadgeCheck className="h-8 w-8 text-[#c2703e]/30" />
              <p className="mt-2 text-xs font-medium text-[#8a7560]">
                {t("no_offers_yet") || "No vendors have submitted offers yet"}
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default RfqQuotesPage;
