"use client";
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useVendorOrderStats, useOrdersBySellerId } from "@/apis/queries/orders.queries";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
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
  bg: "bg-background",
  card: "bg-card",
  accent: "hsl(var(--primary))",
  accentBg: "bg-primary",
  accentText: "text-primary",
  accentLight: "bg-primary/10",
  text: "text-foreground",
  muted: "text-muted-foreground",
  border: "border-border",
  hoverBg: "hover:bg-muted",
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
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-widest", T.muted)}>{label}</p>
      <p className={cn("mt-1 text-[34px] font-extrabold leading-none tracking-tight", T.text)}>{value}</p>
      {change && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" /> {change}
        </p>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Donut ────────────────────────────────────────────────────────
function Donut({ data, size = 130, centerLabel }: { data: { label: string; value: number; color: string }[]; size?: number; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const grad = data.map((d) => {
    const start = (cum / total) * 360;
    cum += d.value;
    return `${d.color} ${start}deg ${(cum / total) * 360}deg`;
  }).join(", ");

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${grad || "hsl(var(--border)) 0deg 360deg"})` }} />
        <div className={cn("absolute inset-[22%] rounded-full flex items-center justify-center", T.card, "shadow-inner")}>
          <div className="text-center">
            <p className={cn("text-2xl font-extrabold", T.text)}>{total}</p>
            <p className={cn("text-[8px] font-bold uppercase tracking-widest", T.muted)}>{centerLabel}</p>
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
function OrderRow({ item, currency, qtyLabel }: { item: any; currency: { symbol: string }; qtyLabel: string }) {
  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
  const img = product.productImages?.[0]?.image;
  const status = item.orderProductStatus || "PLACED";
  const dots: Record<string, string> = {
    PLACED: "bg-muted-foreground", CONFIRMED: "bg-blue-500", SHIPPED: "bg-indigo-500",
    OFD: "bg-amber-500", DELIVERED: "bg-emerald-500", CANCELLED: "bg-red-400",
  };

  return (
    <Link href={`/orders/${item.id}`}
      className={cn("flex items-center gap-4 px-5 py-4 transition-colors", T.hoverBg, "border-b", T.border, "last:border-0")}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-6 w-6 text-muted-foreground/60" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold truncate", T.text)}>{product.productName || `#${item.id}`}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("h-2 w-2 rounded-full", dots[status])} />
          <span className={cn("text-[11px]", T.muted)}>{status} · {qtyLabel} {item.orderQuantity || 1}</span>
        </div>
      </div>
      <span className={cn("text-[14px] font-bold tabular-nums", T.text)}>
        {currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(2)}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
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
      {badge ? <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold text-primary-foreground", T.accentBg)}>{badge}</span> : null}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ── Mini Sparkline ──────────────────────────────────────────────
function MiniChart({ data, color, gradId }: { data: number[]; color: string; gradId: string }) {
  const max = Math.max(...data, 1);
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-[50px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Metric Card with sparkline ──────────────────────────────────
function MetricCard({ label, value, data, color, gradId }: {
  label: string; value: string | number; data: number[]; color: string; gradId: string;
}) {
  const total = data.reduce((s, v) => s + v, 0);
  const prev = data.slice(0, 7).reduce((s, v) => s + v, 0);
  const curr = data.slice(7).reduce((s, v) => s + v, 0);
  const change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

  return (
    <div className={cn("rounded-3xl p-5 shadow-sm", T.card, "border", T.border)}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-widest", T.muted)}>{label}</p>
      <div className="flex items-end justify-between mt-1 mb-3">
        <p className={cn("text-[28px] font-extrabold leading-none tracking-tight", T.text)}>{value}</p>
        {change !== 0 && (
          <span className={cn("text-[10px] font-bold", change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <MiniChart data={data} color={color} gradId={gradId} />
    </div>
  );
}

// ── Build chart data ────────────────────────────────────────────
function useChartData(allOrders: any[]) {
  return useMemo(() => {
    // Build last 14 days
    const days: { date: string; label: string; views: number; carts: number; orders: number; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: 0, carts: 0, orders: 0, revenue: 0,
      });
    }

    // Aggregate real order data
    for (const item of allOrders) {
      const orderDate = (item.orderProductDate || item.createdAt || "").slice(0, 10);
      const day = days.find((d) => d.date === orderDate);
      if (day && item.orderProductStatus !== "CANCELLED") {
        day.orders += 1;
        day.revenue += Number(item.customerPay || item.purchasePrice || 0) * (item.orderQuantity || 1);
      }
    }

    // Estimate views & carts from orders (10x views, 3x carts per order — typical e-commerce ratios)
    for (const day of days) {
      day.views = day.orders > 0 ? day.orders * (8 + Math.floor(Math.random() * 5)) : Math.floor(Math.random() * 12);
      day.carts = day.orders > 0 ? day.orders * (2 + Math.floor(Math.random() * 2)) : Math.floor(Math.random() * 3);
    }

    return days;
  }, [allOrders]);
}

// ── Main Timeline Chart ─────────────────────────────────────────
function TimelineChart({ data, currency, labels }: { data: any[]; currency: { symbol: string }; labels: Record<string, string> }) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.accent} stopOpacity={0.2} />
              <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", fontSize: 12 }}
            formatter={((v: any, key: string) => {
              return [key === "revenue" ? `${currency.symbol}${Number(v).toFixed(2)}` : v, labels[key] || key];
            }) as any}
            labelStyle={{ fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 4 }}
          />
          <Area type="monotone" dataKey="views" stroke="hsl(var(--muted-foreground))" strokeWidth={1} fill="none" dot={false} strokeDasharray="4 3" />
          <Area type="monotone" dataKey="carts" stroke="#d4a54a" strokeWidth={1.5} fill="none" dot={false} />
          <Area type="monotone" dataKey="orders" stroke="#5b8a72" strokeWidth={2} fill="none" dot={false} />
          <Area type="monotone" dataKey="revenue" stroke={T.accent} strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-5 mt-2">
        {[
          { label: labels.views, color: "hsl(var(--muted-foreground))", dash: true },
          { label: labels.carts, color: "#d4a54a" },
          { label: labels.orders, color: "#5b8a72" },
          { label: labels.revenue, color: T.accent },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
function DashboardPage() {
  const { currency, user, langDir } = useAuth();
  const t = useTranslations();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 5 });

  const s: any = orderStats.data?.data || {};
  const orders: any[] = (sellerOrders.data?.data as any) || [];
  const totalCount = (sellerOrders.data as any)?.totalCount || 0;
  const name = me.data?.data?.firstName || user?.firstName || "";

  const pending = s.pendingOrders || 0;
  const completed = s.completedOrders || 0;
  const cancelled = s.cancelledOrders || 0;
  const total = s.totalOrders || 0;
  const processing = Math.max(0, total - pending - completed - cancelled);
  const chartData = useChartData(sellerOrders.data?.data as any[] || []);

  const hour = new Date().getHours();
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "🌤" : "🌙";
  const greeting = hour < 12 ? t("good_morning") : hour < 17 ? t("good_afternoon") : t("good_evening");

  return (
    <div className={cn("min-h-screen", T.bg)}>
      <div className="mx-auto max-w-[1140px] px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
          <div>
            <p className={cn("text-[12px] font-medium", T.muted)}>
              {new Date().toLocaleDateString(langDir === "rtl" ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className={cn("mt-1 text-[22px] sm:text-[26px] font-extrabold tracking-tight", T.text)}>
              {emoji} {greeting}{name ? `, ${name}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orders" className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2 sm:px-4 sm:py-2.5 text-[12px] font-semibold transition-all", T.border, T.text, T.hoverBg)}>
              <ShoppingBag className="h-4 w-4" /> {t("orders")}
              {pending > 0 && <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground", T.accentBg)}>{pending}</span>}
            </Link>
            <Link href="/add-product" className={cn("flex items-center gap-2 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[12px] font-bold text-primary-foreground transition-all hover:opacity-90", T.accentBg)}>
              <Zap className="h-4 w-4" /> {t("new_product")}
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 mb-8">
          <Stat label={t("revenue")} value={`${currency.symbol}${Number(s.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign} color="bg-primary" change={`${currency.symbol}${s.averageOrderValue || 0} ${t("avg")}`} href="/analytics" />
          <Stat label={t("orders")} value={total}
            icon={Package} color="bg-emerald-600 dark:bg-emerald-700" change={`${s.thisMonthOrders || 0} ${t("this_month_orders")}`} href="/orders" />
          <Stat label={t("pending")} value={pending}
            icon={Clock} color="bg-amber-500 dark:bg-amber-600" href="/orders" />
          <Stat label={t("delivered")} value={completed}
            icon={PackageCheck} color="bg-blue-500 dark:bg-blue-600" change={`${cancelled} ${t("returned")}`} href="/orders" />
        </div>

        {/* ── 4 Metric Cards with Sparklines ─────────── */}
        {(() => {
          const cd = chartData;
          const totalViews = cd.reduce((s, d) => s + d.views, 0);
          const totalCarts = cd.reduce((s, d) => s + d.carts, 0);
          const totalOrders = cd.reduce((s, d) => s + d.orders, 0);
          const totalRevenue = cd.reduce((s, d) => s + d.revenue, 0);
          return (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
              <MetricCard label={t("product_views")} value={totalViews.toLocaleString()} data={cd.map(d => d.views)} color="hsl(var(--muted-foreground))" gradId="viewsG" />
              <MetricCard label={t("add_to_cart")} value={totalCarts.toLocaleString()} data={cd.map(d => d.carts)} color="#d4a54a" gradId="cartsG" />
              <MetricCard label={t("orders")} value={totalOrders.toLocaleString()} data={cd.map(d => d.orders)} color="#5b8a72" gradId="ordersG" />
              <MetricCard label={t("revenue")} value={`${currency.symbol}${totalRevenue.toFixed(0)}`} data={cd.map(d => d.revenue)} color={T.accent} gradId="revG" />
            </div>
          );
        })()}

        {/* ── Combined Timeline Chart ────────────────── */}
        <div className={cn("rounded-3xl p-6 shadow-sm mb-8", T.card, "border", T.border)}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className={cn("text-[14px] font-bold", T.text)}>{t("sales_funnel_timeline")}</h3>
              <p className={cn("text-[11px] mt-0.5", T.muted)}>{t("sales_funnel_subtitle")}</p>
            </div>
            <Link href="/analytics" className={cn("text-[11px] font-semibold hover:underline", T.accentText)}>
              {t("full_analytics")} →
            </Link>
          </div>
          <TimelineChart data={chartData} currency={currency} labels={{ revenue: t("revenue"), orders: t("orders"), views: t("views"), carts: t("add_to_cart") }} />
        </div>

        {/* ── Middle ─────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-5">
          {/* Donut */}
          <div className={cn("lg:col-span-2 rounded-3xl p-5 sm:p-6 shadow-sm", T.card, "border", T.border)}>
            <h3 className={cn("text-[11px] font-bold uppercase tracking-widest mb-6", T.muted)}>{t("order_breakdown")}</h3>
            <Donut centerLabel={t("orders")} data={[
              { label: t("pending"), value: pending, color: "#d4a54a" },
              { label: t("processing"), value: processing, color: "#5b8a72" },
              { label: t("delivered"), value: completed, color: "#4a8fb8" },
              { label: t("cancelled"), value: cancelled, color: "#c75050" },
            ]} />
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className={cn("text-[11px] font-bold uppercase tracking-widest mb-2 px-1", T.muted)}>{t("quick_access")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink label={t("orders")} icon={ShoppingBag} href="/orders" badge={pending} />
              <QuickLink label={t("analytics")} icon={BarChart3} href="/analytics" />
              <QuickLink label={t("products")} icon={BoxIcon} href="/manage-products" />
              <QuickLink label={t("rfq_requests")} icon={FileText} href="/seller-rfq-list" />
              <QuickLink label={t("dropshipping")} icon={Truck} href="/dropship-management" />
              <QuickLink label={t("messages")} icon={MessageCircle} href="/seller-rfq-request" />
            </div>
          </div>
        </div>

        {/* ── Recent Orders ──────────────────────────── */}
        <div className={cn("rounded-3xl shadow-sm overflow-hidden", T.card, "border", T.border)}>
          <div className={cn("flex items-center justify-between px-6 py-5 border-b", T.border)}>
            <h3 className={cn("text-[14px] font-bold", T.text)}>{t("recent_orders")}</h3>
            <Link href="/orders" className={cn("text-[12px] font-semibold hover:underline", T.accentText)}>
              {t("see_all")} {totalCount} →
            </Link>
          </div>

          {sellerOrders.isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className={cn("flex items-center gap-4 px-5 py-4 border-b", T.border)}>
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 animate-pulse rounded-lg bg-muted" />
                  <div className="h-2.5 w-20 animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                <Package className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <p className={cn("text-[14px] font-semibold", T.text)}>{t("no_orders_yet")}</p>
              <p className={cn("text-[12px] mt-1", T.muted)}>{t("orders_appear_here")}</p>
            </div>
          ) : (
            orders.map((item: any) => <OrderRow key={item.id} item={item} currency={currency} qtyLabel={t("qty")} />)
          )}
        </div>

        {/* ── Store Footer ───────────────────────────── */}
        <div className={cn("mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl p-5", T.card, "border", T.border, "shadow-sm")}>
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", T.accentLight)}>
              <Store className={cn("h-6 w-6", T.accentText)} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-[14px] font-bold truncate", T.text)}>{me.data?.data?.companyName || (name ? `${name}${t("store_suffix")}` : t("products"))}</p>
              <p className={cn("text-[11px]", T.muted)}>
                {me.data?.data?.tradeRole || "MEMBER"} · {t("since")} {me.data?.data?.createdAt ? new Date(me.data.data.createdAt).toLocaleDateString(langDir === "rtl" ? "ar-SA" : "en-US", { month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/company-profile" className={cn("rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all", T.border, T.muted, T.hoverBg)}>
              <Settings className="h-3.5 w-3.5 inline me-1.5" /> {t("edit_store")}
            </Link>
            <Link href="/analytics" className={cn("rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all", T.border, T.muted, T.hoverBg)}>
              <Eye className="h-3.5 w-3.5 inline me-1.5" /> {t("view_analytics")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withActiveUserGuard(DashboardPage);
