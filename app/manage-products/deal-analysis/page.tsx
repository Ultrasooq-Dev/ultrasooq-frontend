"use client";
import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import {
  Users, Package, Clock, CheckCircle2, XCircle, AlertTriangle,
  ArrowLeft, Timer, TrendingUp, DollarSign, BarChart3,
  ShieldCheck, Star, Activity, CalendarDays, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Minus, Eye,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Line, ComposedChart, Bar, PieChart, Pie, Cell,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   DEAL ANALYSIS PAGE
   Full analysis view for a single BuyGroup deal.
   Shows: order-by-order timeline, participation curve,
   revenue breakdown, customer rating distribution,
   order status funnel, and individual order cards.
   ═══════════════════════════════════════════════════════════════ */

// ─── Theme ───────────────────────────────────────────────────
const T = {
  bg: "bg-[#faf6f1]",
  card: "bg-white",
  accent: "#c2703e",
  accentBg: "bg-[#c2703e]",
  accentText: "text-[#c2703e]",
  accentLight: "bg-[#c2703e]/10",
  text: "text-[#2d2017]",
  muted: "text-[#8a7560]",
  border: "border-[#e8dfd4]",
  success: "text-emerald-600",
  successBg: "bg-emerald-50",
  warning: "text-amber-600",
  warningBg: "bg-amber-50",
  danger: "text-red-600",
  dangerBg: "bg-red-50",
  infoBg: "bg-blue-50",
  infoText: "text-blue-600",
};

const PIE_COLORS = ["#c2703e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

// ─── Types (shared with buygroup-management) ─────────────────
interface BuyGroupOrder {
  id: number;
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerRating: number;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
}

interface DealData {
  id: number;
  productName: string;
  productImage: string | null;
  price: number;
  offerPrice: number;
  currency: string;
  minCustomer: number;
  maxCustomer: number;
  currentCustomers: number;
  stock: number;
  orderedQuantity: number;
  dateOpen: string;
  dateClose: string;
  startTime: string;
  endTime: string;
  status: string;
  orders: BuyGroupOrder[];
}

// ─── Mock: same as buygroup-management (replace with API) ────
const MOCK_DEAL: DealData = {
  id: 1,
  productName: "Premium Wireless Headphones - Bulk Pack",
  productImage: null,
  price: 89.99,
  offerPrice: 59.99,
  currency: "$",
  minCustomer: 10,
  maxCustomer: 50,
  currentCustomers: 11,
  stock: 200,
  orderedQuantity: 68,
  dateOpen: "2026-04-05T00:00:00Z",
  dateClose: "2026-04-18T23:59:00Z",
  startTime: "00:00",
  endTime: "23:59",
  status: "ACTIVE",
  orders: [
    { id: 1, orderId: 1001, customerName: "Ahmed Salem", customerEmail: "ahmed@store.com", customerRating: 4.8, quantity: 8, total: 479.92, status: "PLACED", createdAt: "2026-04-06T10:30:00Z" },
    { id: 2, orderId: 1002, customerName: "Sarah Chen", customerEmail: "sarah@biz.com", customerRating: 4.5, quantity: 5, total: 299.95, status: "CONFIRMED", createdAt: "2026-04-06T14:15:00Z" },
    { id: 3, orderId: 1003, customerName: "Omar Khalid", customerEmail: "omar@trade.com", customerRating: 3.9, quantity: 10, total: 599.90, status: "PLACED", createdAt: "2026-04-07T09:00:00Z" },
    { id: 4, orderId: 1004, customerName: "Maria Garcia", customerEmail: "maria@shop.com", customerRating: 4.2, quantity: 4, total: 239.96, status: "SHIPPED", createdAt: "2026-04-07T16:45:00Z" },
    { id: 5, orderId: 1005, customerName: "James Wilson", customerEmail: "james@co.uk", customerRating: 5.0, quantity: 3, total: 179.97, status: "PLACED", createdAt: "2026-04-08T11:20:00Z" },
    { id: 6, orderId: 1006, customerName: "Fatima Al-Rashid", customerEmail: "fatima@biz.sa", customerRating: 4.0, quantity: 6, total: 359.94, status: "CANCELLED", createdAt: "2026-04-08T13:00:00Z" },
    { id: 7, orderId: 1007, customerName: "David Lee", customerEmail: "david@hk.com", customerRating: 3.5, quantity: 6, total: 359.94, status: "PLACED", createdAt: "2026-04-09T08:30:00Z" },
    { id: 8, orderId: 1008, customerName: "Layla Mansour", customerEmail: "layla@uae.com", customerRating: 4.7, quantity: 2, total: 119.98, status: "PLACED", createdAt: "2026-04-09T10:00:00Z" },
    { id: 9, orderId: 1009, customerName: "Yuki Tanaka", customerEmail: "yuki@jp.co", customerRating: 4.9, quantity: 3, total: 179.97, status: "DELIVERED", createdAt: "2026-04-09T14:30:00Z" },
    { id: 10, orderId: 1010, customerName: "Priya Sharma", customerEmail: "priya@in.co", customerRating: 4.1, quantity: 5, total: 299.95, status: "PLACED", createdAt: "2026-04-10T09:15:00Z" },
    { id: 11, orderId: 1011, customerName: "Mohammed Al-Farsi", customerEmail: "moh@om.net", customerRating: 3.8, quantity: 7, total: 419.93, status: "PLACED", createdAt: "2026-04-10T11:00:00Z" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────

function maskName(name: string, show: boolean): string {
  if (show) return name;
  return name.split(" ").map((p) => (p.length <= 2 ? p : p.slice(0, 2) + "****")).join(" ");
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PLACED: "bg-blue-400",
    CONFIRMED: "bg-indigo-500",
    SHIPPED: "bg-purple-500",
    DELIVERED: "bg-emerald-500",
    CANCELLED: "bg-red-400",
    REFUNDED: "bg-red-400",
  };
  return <span className={cn("w-2.5 h-2.5 rounded-full inline-block", colors[status] || "bg-gray-300")} />;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(T.card, "rounded-xl p-3 shadow-lg border text-xs", T.border)}>
      <p className={cn("font-semibold mb-1.5", T.text)}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className={T.muted}>{entry.name}:</span>
          <span className={cn("font-semibold", T.text)}>
            {entry.name === "Revenue" ? `$${entry.value}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

function DealAnalysisPage() {
  const { langDir } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams?.get("id");

  // In production: fetch deal by ID from API
  const deal = MOCK_DEAL;

  const activeOrders = deal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const cancelledOrders = deal.orders.filter((o) => ["CANCELLED", "REFUNDED"].includes(o.status));
  const revenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const avgRating = activeOrders.length > 0 ? activeOrders.reduce((s, o) => s + o.customerRating, 0) / activeOrders.length : 0;
  const avgOrderValue = activeOrders.length > 0 ? revenue / activeOrders.length : 0;
  const dealFinished = ["COMPLETED", "CONFIRMED"].includes(deal.status);

  const openDate = new Date(deal.dateOpen);
  const closeDate = new Date(deal.dateClose);
  const totalDealDays = Math.max(1, Math.round((closeDate.getTime() - openDate.getTime()) / 86400000));
  const elapsedDays = Math.max(0, Math.round((Date.now() - openDate.getTime()) / 86400000));
  const customerPct = deal.minCustomer > 0 ? Math.round((deal.currentCustomers / deal.minCustomer) * 100) : 100;

  // ── Build order-by-order timeline ──
  const orderTimeline = useMemo(() => {
    const sorted = [...deal.orders]
      .filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let cumCustomers = 0;
    let cumQty = 0;
    let cumRevenue = 0;

    return sorted.map((order) => {
      cumCustomers++;
      cumQty += order.quantity;
      cumRevenue += order.total;
      const d = new Date(order.createdAt);
      return {
        label: `#${order.orderId}`,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        customers: cumCustomers,
        quantity: cumQty,
        revenue: Math.round(cumRevenue),
        target: deal.minCustomer,
        orderQty: order.quantity,
        orderTotal: order.total,
        name: maskName(order.customerName, dealFinished),
        rating: order.customerRating,
      };
    });
  }, [deal.orders, deal.minCustomer, dealFinished]);

  // ── Status distribution for pie chart ──
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    deal.orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [deal.orders]);

  // ── Rating distribution ──
  const ratingDist = useMemo(() => {
    const buckets = [
      { range: "4.5-5.0", min: 4.5, max: 5.01, count: 0 },
      { range: "4.0-4.4", min: 4.0, max: 4.5, count: 0 },
      { range: "3.5-3.9", min: 3.5, max: 4.0, count: 0 },
      { range: "3.0-3.4", min: 3.0, max: 3.5, count: 0 },
      { range: "< 3.0", min: 0, max: 3.0, count: 0 },
    ];
    activeOrders.forEach((o) => {
      const b = buckets.find((b) => o.customerRating >= b.min && o.customerRating < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [activeOrders]);

  // ── Daily join rate ──
  const dailyJoinRate = useMemo(() => {
    const map: Record<string, { date: string; joins: number; quantity: number; revenue: number }> = {};
    activeOrders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!map[d]) map[d] = { date: d, joins: 0, quantity: 0, revenue: 0 };
      map[d].joins++;
      map[d].quantity += o.quantity;
      map[d].revenue += o.total;
    });
    return Object.values(map);
  }, [activeOrders]);

  return (
    <>
      <title dir={langDir} translate="no">{`Deal Analysis | Ultrasooq`}</title>
      <div className={cn("min-h-screen", T.bg)}>
        <div className="w-full px-6 lg:px-12 py-8">

          {/* ── Back + Header ── */}
          <button onClick={() => router.back()} className={cn("flex items-center gap-1.5 text-sm mb-4", T.accentText, "hover:underline")}>
            <ArrowLeft className="h-4 w-4" /> Back to BuyGroup Ops
          </button>

          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0", T.accentLight)}>
                <Package className={cn("h-7 w-7", T.accentText)} />
              </div>
              <div>
                <h1 className={cn("text-2xl font-bold", T.text)}>{deal.productName}</h1>
                <div className={cn("flex items-center gap-4 mt-1 text-sm", T.muted)}>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {openDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Day {elapsedDays} of {totalDealDays}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                    deal.status === "ACTIVE" ? "bg-blue-50 text-blue-600" :
                    deal.status === "THRESHOLD_MET" ? "bg-emerald-50 text-emerald-600" :
                    deal.status === "EXPIRED" ? "bg-amber-50 text-amber-600" :
                    "bg-gray-100 text-gray-600"
                  )}>{deal.status}</span>
                </div>
              </div>
            </div>
            <div className="text-end">
              <div className={cn("text-3xl font-bold", T.accentText)}>{deal.currency}{revenue.toFixed(2)}</div>
              <div className={cn("text-xs", T.muted)}>Total revenue</div>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Customers", value: `${deal.currentCustomers}/${deal.minCustomer}`, icon: <Users className="h-4 w-4 text-blue-600" />, bg: T.infoBg, extra: `${customerPct}% of min` },
              { label: "Units Ordered", value: deal.orderedQuantity, icon: <ShoppingBag className="h-4 w-4 text-purple-600" />, bg: "bg-purple-50", extra: `${deal.stock} stock` },
              { label: "Avg Order Value", value: `${deal.currency}${avgOrderValue.toFixed(2)}`, icon: <DollarSign className="h-4 w-4 text-emerald-600" />, bg: T.successBg },
              { label: "Avg Rating", value: avgRating.toFixed(1), icon: <Star className="h-4 w-4 text-amber-500" />, bg: "bg-amber-50", extra: `${activeOrders.length} buyers` },
              { label: "Cancel Rate", value: `${deal.orders.length > 0 ? Math.round((cancelledOrders.length / deal.orders.length) * 100) : 0}%`, icon: <XCircle className="h-4 w-4 text-red-500" />, bg: T.dangerBg, extra: `${cancelledOrders.length} cancelled` },
              { label: "Fill Rate", value: `${deal.stock > 0 ? Math.round((deal.orderedQuantity / deal.stock) * 100) : 0}%`, icon: <TrendingUp className={cn("h-4 w-4", T.accentText)} />, bg: T.accentLight },
            ].map((kpi) => (
              <div key={kpi.label} className={cn(T.card, T.border, "border rounded-2xl p-4")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", kpi.bg)}>{kpi.icon}</div>
                <div className={cn("text-xl font-bold", T.text)}>{kpi.value}</div>
                <div className={cn("text-xs", T.muted)}>{kpi.label}</div>
                {kpi.extra && <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.extra}</div>}
              </div>
            ))}
          </div>

          {/* ── Charts Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Order-by-Order Participation Curve (2/3 width) */}
            <div className={cn(T.card, T.border, "border rounded-2xl p-5 lg:col-span-2")}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className={cn("h-5 w-5", T.accentText)} />
                <h3 className={cn("text-sm font-semibold", T.text)}>Order-by-Order Participation</h3>
                <span className={cn("text-xs ms-auto", T.muted)}>Each point = 1 order joining the deal</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={orderTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="participationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c2703e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#c2703e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a7560" }} tickLine={false} axisLine={{ stroke: "#e8dfd4" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8a7560" }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="customers" name="Customers" stroke="#c2703e" strokeWidth={2.5} fill="url(#participationGrad)" dot={{ r: 4, fill: "#c2703e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="target" name="Min Target" stroke="#f87171" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                  <Bar dataKey="orderQty" name="Units" fill="#3b82f6" opacity={0.15} radius={[3, 3, 0, 0]} barSize={16} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Pie (1/3 width) */}
            <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
              <h3 className={cn("text-sm font-semibold mb-4", T.text)}>Order Status</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                {statusDist.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Second Row: Daily Join Rate + Rating Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Daily Join Rate */}
            <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
              <h3 className={cn("text-sm font-semibold mb-4", T.text)}>Daily Join Rate</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={dailyJoinRate} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a7560" }} tickLine={false} axisLine={{ stroke: "#e8dfd4" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8a7560" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="joins" name="New Buyers" fill="#c2703e" radius={[4, 4, 0, 0]} barSize={24} />
                  <Line type="monotone" dataKey="quantity" name="Units" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Rating Distribution */}
            <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
              <h3 className={cn("text-sm font-semibold mb-4", T.text)}>Buyer Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDist.map((b) => (
                  <div key={b.range} className="flex items-center gap-3">
                    <span className={cn("text-xs w-16 text-end font-medium", T.muted)}>{b.range}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500 flex items-center justify-end pe-2"
                        style={{ width: `${activeOrders.length > 0 ? (b.count / activeOrders.length) * 100 : 0}%`, minWidth: b.count > 0 ? "24px" : "0" }}
                      >
                        {b.count > 0 && <span className="text-[10px] font-bold text-white">{b.count}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 w-12">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-2.5 w-2.5", s <= Math.ceil(b.min) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={cn("mt-4 pt-3 border-t text-center", T.border)}>
                <span className={cn("text-2xl font-bold", T.text)}>{avgRating.toFixed(1)}</span>
                <span className={cn("text-sm ms-1", T.muted)}>avg rating</span>
              </div>
            </div>
          </div>

          {/* ── Individual Order Cards (Timeline Feed) ── */}
          <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden")}>
            <div className={cn("px-6 py-4 border-b flex items-center justify-between", T.border)}>
              <h3 className={cn("text-sm font-semibold", T.text)}>Order Timeline ({deal.orders.length} orders)</h3>
              {!dealFinished && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full", T.warningBg, T.warning)}>
                  <Eye className="h-3 w-3 inline me-1" /> Customer info masked
                </span>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {[...deal.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order, idx) => {
                const d = new Date(order.createdAt);
                const isCancelled = ["CANCELLED", "REFUNDED"].includes(order.status);
                const trend = idx < deal.orders.length - 1 ? "up" : "neutral";

                return (
                  <div key={order.id} className={cn("px-6 py-4 flex items-center gap-4", isCancelled && "opacity-50")}>
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 w-6 flex-shrink-0">
                      <StatusDot status={order.status} />
                      {idx < deal.orders.length - 1 && <div className="w-px h-6 bg-gray-200" />}
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", T.text)}>#{order.orderId}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                          order.status === "PLACED" ? "bg-blue-50 text-blue-600" :
                          order.status === "CONFIRMED" ? "bg-indigo-50 text-indigo-600" :
                          order.status === "SHIPPED" ? "bg-purple-50 text-purple-600" :
                          order.status === "DELIVERED" ? "bg-emerald-50 text-emerald-600" :
                          "bg-red-50 text-red-600"
                        )}>{order.status}</span>
                        <span className={cn("text-xs", T.muted)}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                      <div className={cn("text-sm mt-0.5", T.muted)}>
                        {maskName(order.customerName, dealFinished)}
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("h-2.5 w-2.5", s <= order.customerRating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}
                          <span className="text-xs ms-0.5">({order.customerRating})</span>
                        </span>
                      </div>
                    </div>

                    {/* Quantity + amount */}
                    <div className="text-end flex-shrink-0">
                      <div className={cn("text-sm font-semibold", T.text)}>{deal.currency}{order.total.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">x{order.quantity} units</div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default withActiveUserGuard(DealAnalysisPage);
