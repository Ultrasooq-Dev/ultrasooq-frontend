"use client";
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useVendorOrderStats, useOrdersBySellerId } from "@/apis/queries/orders.queries";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import {
  Package, Clock, CheckCircle2, DollarSign, Truck, ShoppingBag,
  BarChart3, BoxIcon, FileText, MessageCircle, Store, ArrowRight,
  Settings, Zap, PackageCheck, XCircle, TrendingUp, Bell,
  ChevronRight, Star, Users, Tag, Layers, Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   THEME: Warm Sand — Desert-inspired, soft cream/terracotta.
   bg: #faf6f1 (warm cream), cards: white, accent: #c2703e
   (burnt sienna/terracotta), text: #2d2017 (dark espresso).
   Organic rounded corners, soft shadows, breathing room.
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

// ── Stat Card ───────────────────────────────────────────────────
function Stat({ label, value, change, icon: Icon, color, href }: {
  label: string; value: string | number; change?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className={cn("rounded-3xl p-6 shadow-sm transition-all", T.card, T.border, "border",
      href && "hover:shadow-md cursor-pointer group")}>
      <div className={cn("inline-flex items-center justify-center h-10 w-10 rounded-2xl mb-4", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-widest", T.muted)}>{label}</p>
      <p className={cn("mt-1 text-[34px] font-extrabold leading-none tracking-tight", T.text)}>{value}</p>
      {change && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
          <TrendingUp className="h-3 w-3" /> {change}
        </p>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Donut ────────────────────────────────────────────────────────
function Donut({ data, size = 130 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const grad = data.map((d) => {
    const start = (cum / total) * 360;
    cum += d.value;
    return `${d.color} ${start}deg ${(cum / total) * 360}deg`;
  }).join(", ");

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${grad || "#e8ddd0 0deg 360deg"})` }} />
        <div className={cn("absolute inset-[22%] rounded-full flex items-center justify-center", T.card, "shadow-inner")}>
          <div className="text-center">
            <p className={cn("text-2xl font-extrabold", T.text)}>{total}</p>
            <p className={cn("text-[8px] font-bold uppercase tracking-widest", T.muted)}>Orders</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className={cn("text-[12px] w-24", T.muted)}>{d.label}</span>
            <span className={cn("text-[13px] font-bold", T.text)}>{d.value}</span>
            <span className={cn("text-[10px]", T.muted)}>{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Order Row ───────────────────────────────────────────────────
function OrderRow({ item, currency }: { item: any; currency: { symbol: string } }) {
  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
  const img = product.productImages?.[0]?.image;
  const status = item.orderProductStatus || "PLACED";
  const dots: Record<string, string> = {
    PLACED: "bg-gray-400", CONFIRMED: "bg-blue-500", SHIPPED: "bg-indigo-500",
    OFD: "bg-amber-500", DELIVERED: "bg-emerald-500", CANCELLED: "bg-red-400",
  };

  return (
    <Link href={`/orders/${item.id}`}
      className={cn("flex items-center gap-4 px-5 py-4 transition-colors", T.hoverBg, "border-b", T.border, "last:border-0")}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#f3ece3]">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-6 w-6 text-[#c9b9a8]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold truncate", T.text)}>{product.productName || `#${item.id}`}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("h-2 w-2 rounded-full", dots[status])} />
          <span className={cn("text-[11px]", T.muted)}>{status} · Qty {item.orderQuantity || 1}</span>
        </div>
      </div>
      <span className={cn("text-[14px] font-bold tabular-nums", T.text)}>
        {currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(2)}
      </span>
      <ChevronRight className="h-4 w-4 text-[#c9b9a8]" />
    </Link>
  );
}

// ── Quick Link ──────────────────────────────────────────────────
function QuickLink({ label, icon: Icon, href, badge }: {
  label: string; icon: React.ElementType; href: string; badge?: number;
}) {
  return (
    <Link href={href}
      className={cn("flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all", T.card, "border", T.border, "hover:shadow-md group")}>
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", T.accentLight)}>
        <Icon className={cn("h-4 w-4", T.accentText)} />
      </div>
      <span className={cn("flex-1 text-[13px] font-semibold", T.text)}>{label}</span>
      {badge ? <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold text-white", T.accentBg)}>{badge}</span> : null}
      <ArrowRight className="h-3.5 w-3.5 text-[#c9b9a8] group-hover:text-[#c2703e] transition-colors group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ── Sales Chart ─────────────────────────────────────────────────
function SalesChart({ orders, allOrders, currency }: { orders: any[]; allOrders: any[]; currency: { symbol: string } }) {
  const chartData = useMemo(() => {
    // Build last 14 days
    const days: { date: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ date: key, label, revenue: 0, orders: 0 });
    }

    // Aggregate orders by day
    for (const item of allOrders) {
      const orderDate = (item.orderProductDate || item.createdAt || "").slice(0, 10);
      const day = days.find((d) => d.date === orderDate);
      if (day && item.orderProductStatus !== "CANCELLED") {
        day.orders += 1;
        day.revenue += Number(item.customerPay || item.purchasePrice || 0) * (item.orderQuantity || 1);
      }
    }

    return days;
  }, [allOrders]);

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2703e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#c2703e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b8a72" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#5b8a72" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd0" strokeOpacity={0.5} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8c7b6b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8c7b6b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8ddd0",
              borderRadius: 16,
              padding: "10px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
            formatter={(value: any, dataKey: string) => [
              dataKey === "revenue" ? `${currency.symbol}${Number(value).toFixed(2)}` : value,
              dataKey === "revenue" ? "Revenue" : "Orders",
            ]}
            labelStyle={{ fontWeight: 700, color: "#2d2017", marginBottom: 4 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#c2703e" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
          <Area type="monotone" dataKey="orders" stroke="#5b8a72" strokeWidth={1.5} fill="url(#ordersGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-[#8c7b6b]">
          <span className="h-2 w-2 rounded-full bg-[#c2703e]" /> Revenue
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8c7b6b]">
          <span className="h-2 w-2 rounded-full bg-[#5b8a72]" /> Orders
        </span>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
function DashboardPage() {
  const { currency, user } = useAuth();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 5 });

  const s = orderStats.data?.data || {};
  const orders: any[] = sellerOrders.data?.data || [];
  const totalCount = (sellerOrders.data as any)?.totalCount || 0;
  const name = me.data?.data?.firstName || user?.firstName || "there";

  const pending = s.pendingOrders || 0;
  const completed = s.completedOrders || 0;
  const cancelled = s.cancelledOrders || 0;
  const total = s.totalOrders || 0;
  const processing = Math.max(0, total - pending - completed - cancelled);

  const hour = new Date().getHours();
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "🌤" : "🌙";
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className={cn("min-h-screen", T.bg)}>
      <div className="mx-auto max-w-[1140px] px-6 py-8">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className={cn("text-[12px] font-medium", T.muted)}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className={cn("mt-1 text-[26px] font-extrabold tracking-tight", T.text)}>
              {emoji} {greeting}, {name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orders" className={cn("flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-semibold transition-all", T.border, T.text, T.hoverBg)}>
              <ShoppingBag className="h-4 w-4" /> Orders
              {pending > 0 && <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white", T.accentBg)}>{pending}</span>}
            </Link>
            <Link href="/product?productType=P" className={cn("flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-bold text-white transition-all hover:opacity-90", T.accentBg)}>
              <Zap className="h-4 w-4" /> New Product
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <Stat label="Revenue" value={`${currency.symbol}${Number(s.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign} color="bg-[#c2703e]" change={`${currency.symbol}${s.averageOrderValue || 0} avg`} href="/analytics" />
          <Stat label="Orders" value={total}
            icon={Package} color="bg-[#5b8a72]" change={`${s.thisMonthOrders || 0} this month`} href="/orders" />
          <Stat label="Pending" value={pending}
            icon={Clock} color="bg-[#d4a54a]" href="/orders" />
          <Stat label="Delivered" value={completed}
            icon={PackageCheck} color="bg-[#4a8fb8]" change={`${cancelled} returned`} href="/orders" />
        </div>

        {/* ── Sales Timeline Chart ────────────────────── */}
        <div className={cn("rounded-3xl p-6 shadow-sm mb-8", T.card, "border", T.border)}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className={cn("text-[14px] font-bold", T.text)}>Sales Timeline</h3>
              <p className={cn("text-[11px] mt-0.5", T.muted)}>Revenue & orders over the last 14 days</p>
            </div>
            <Link href="/analytics" className={cn("text-[11px] font-semibold hover:underline", T.accentText)}>
              Full analytics →
            </Link>
          </div>
          <SalesChart orders={orders} allOrders={sellerOrders.data?.data || []} currency={currency} />
        </div>

        {/* ── Middle ─────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Donut */}
          <div className={cn("col-span-2 rounded-3xl p-6 shadow-sm", T.card, "border", T.border)}>
            <h3 className={cn("text-[11px] font-bold uppercase tracking-widest mb-6", T.muted)}>Order Breakdown</h3>
            <Donut data={[
              { label: "Pending", value: pending, color: "#d4a54a" },
              { label: "Processing", value: processing, color: "#5b8a72" },
              { label: "Delivered", value: completed, color: "#4a8fb8" },
              { label: "Cancelled", value: cancelled, color: "#c75050" },
            ]} />
          </div>

          {/* Quick Links */}
          <div className="col-span-3 space-y-3">
            <h3 className={cn("text-[11px] font-bold uppercase tracking-widest mb-2 px-1", T.muted)}>Quick Access</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink label="Orders" icon={ShoppingBag} href="/orders" badge={pending} />
              <QuickLink label="Analytics" icon={BarChart3} href="/analytics" />
              <QuickLink label="Products" icon={BoxIcon} href="/manage-products" />
              <QuickLink label="RFQ Requests" icon={FileText} href="/seller-rfq-list" />
              <QuickLink label="Dropshipping" icon={Truck} href="/dropship-management" />
              <QuickLink label="Messages" icon={MessageCircle} href="/seller-rfq-request" />
            </div>
          </div>
        </div>

        {/* ── Recent Orders ──────────────────────────── */}
        <div className={cn("rounded-3xl shadow-sm overflow-hidden", T.card, "border", T.border)}>
          <div className={cn("flex items-center justify-between px-6 py-5 border-b", T.border)}>
            <h3 className={cn("text-[14px] font-bold", T.text)}>Recent Orders</h3>
            <Link href="/orders" className={cn("text-[12px] font-semibold hover:underline", T.accentText)}>
              See all {totalCount} →
            </Link>
          </div>

          {sellerOrders.isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className={cn("flex items-center gap-4 px-5 py-4 border-b", T.border)}>
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#f3ece3]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 animate-pulse rounded-lg bg-[#f3ece3]" />
                  <div className="h-2.5 w-20 animate-pulse rounded-lg bg-[#f3ece3]" />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-3xl bg-[#f3ece3] flex items-center justify-center mb-4">
                <Package className="h-7 w-7 text-[#c9b9a8]" />
              </div>
              <p className={cn("text-[14px] font-semibold", T.text)}>No orders yet</p>
              <p className={cn("text-[12px] mt-1", T.muted)}>When buyers purchase your products, they'll appear here</p>
            </div>
          ) : (
            orders.map((item: any) => <OrderRow key={item.id} item={item} currency={currency} />)
          )}
        </div>

        {/* ── Store Footer ───────────────────────────── */}
        <div className={cn("mt-8 flex items-center justify-between rounded-3xl p-5", T.card, "border", T.border, "shadow-sm")}>
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", T.accentLight)}>
              <Store className={cn("h-6 w-6", T.accentText)} />
            </div>
            <div>
              <p className={cn("text-[14px] font-bold", T.text)}>{me.data?.data?.companyName || `${name}'s Store`}</p>
              <p className={cn("text-[11px]", T.muted)}>
                {me.data?.data?.tradeRole || "MEMBER"} · Since {me.data?.data?.createdAt ? new Date(me.data.data.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/company-profile" className={cn("rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all", T.border, T.muted, T.hoverBg)}>
              <Settings className="h-3.5 w-3.5 inline mr-1.5" /> Edit Store
            </Link>
            <Link href="/analytics" className={cn("rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all", T.border, T.muted, T.hoverBg)}>
              <Eye className="h-3.5 w-3.5 inline mr-1.5" /> View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withActiveUserGuard(DashboardPage);
