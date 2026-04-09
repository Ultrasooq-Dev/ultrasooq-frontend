"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import {
  useVendorOrderStats,
  useVendorRecentOrders,
  useOrdersBySellerId,
} from "@/apis/queries/orders.queries";
import Link from "next/link";
import Image from "next/image";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Truck,
  ShoppingBag,
  BarChart3,
  BoxIcon,
  Users,
  AlertTriangle,
  ReceiptText,
  ArrowRight,
  ArrowUpRight,
  Eye,
  Star,
  FileText,
  MessageCircle,
  Zap,
  Settings,
  PackageCheck,
  Store,
} from "lucide-react";

// ─── KPI Card ───────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendLabel,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
  href?: string;
}) {
  const content = (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-5 transition-all",
      href && "hover:shadow-lg hover:border-border/80 cursor-pointer group",
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn("mt-2 flex items-center gap-1 text-[11px] font-medium",
              trend >= 0 ? "text-emerald-600" : "text-red-500")}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? "+" : ""}{trend}% {trendLabel || "vs last month"}
            </div>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      {href && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View details <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Quick Link Card ────────────────────────────────────────────
function QuickLink({
  title,
  description,
  icon: Icon,
  href,
  color,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: number;
}) {
  return (
    <Link href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-border/80">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

// ─── Mini Order Row ─────────────────────────────────────────────
function OrderRow({ item, currency }: { item: any; currency: { symbol: string } }) {
  const status = item.orderProductStatus || "PLACED";
  const statusColors: Record<string, string> = {
    PLACED: "text-gray-600 bg-gray-50", CONFIRMED: "text-blue-600 bg-blue-50",
    SHIPPED: "text-indigo-600 bg-indigo-50", OFD: "text-amber-600 bg-amber-50",
    DELIVERED: "text-emerald-600 bg-emerald-50", CANCELLED: "text-red-500 bg-red-50",
  };
  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
  const buyer = item.orderProduct_order?.order_user;
  const img = product.productImages?.[0]?.image;

  return (
    <Link href={`/orders/${item.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-2 h-6 w-6 text-muted-foreground/20" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{product.productName || `Order #${item.id}`}</p>
        <p className="text-[10px] text-muted-foreground">
          {buyer ? `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() : "Customer"} · {item.orderQuantity || 1} item{(item.orderQuantity || 1) > 1 ? "s" : ""}
        </p>
      </div>
      <div className="shrink-0 text-end">
        <span className="text-xs font-bold">{currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(2)}</span>
        <span className={cn("mt-0.5 block rounded-full px-2 py-0.5 text-[9px] font-semibold", statusColors[status] || statusColors.PLACED)}>
          {status}
        </span>
      </div>
    </Link>
  );
}

// ─── Status Distribution Bar ────────────────────────────────────
function StatusBar({ stats }: { stats: any }) {
  const total = (stats?.totalOrders || 1);
  const segments = [
    { label: "Pending", count: stats?.pendingOrders || 0, color: "bg-amber-400" },
    { label: "Completed", count: stats?.completedOrders || 0, color: "bg-emerald-500" },
    { label: "Cancelled", count: stats?.cancelledOrders || 0, color: "bg-red-400" },
  ];

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <div key={s.label} className={cn("transition-all", s.color)}
            style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full", s.color)} />
            <span className="text-[10px] text-muted-foreground">{s.label} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
function VendorDashboardPage() {
  const t = useTranslations();
  const { langDir, currency, user } = useAuth();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 5 });

  const stats = orderStats.data?.data || {};
  const recentOrders: any[] = sellerOrders.data?.data || [];
  const sellerOrderTotal = (sellerOrders.data as any)?.totalCount || 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const userName = me.data?.data?.firstName || user?.firstName || "Seller";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

        {/* ── Header ─────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}, {userName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with your store today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/analytics"
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </Link>
              <Link href="/orders"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors">
                <ShoppingBag className="h-3.5 w-3.5" /> Manage Orders
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            subtitle={`${stats.thisMonthOrders || 0} this month`}
            icon={Package}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            trend={stats.lastMonthOrders > 0 ? Math.round(((stats.thisMonthOrders || 0) / stats.lastMonthOrders - 1) * 100) : 0}
            trendLabel="vs last month"
            href="/orders"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders || 0}
            subtitle="Need attention"
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-100 dark:bg-amber-950/30"
            href="/orders"
          />
          <StatCard
            title="Completed"
            value={stats.completedOrders || 0}
            subtitle={`${stats.cancelledOrders || 0} cancelled`}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100 dark:bg-emerald-950/30"
            href="/orders"
          />
          <StatCard
            title="Revenue"
            value={`${currency.symbol}${Number(stats.totalRevenue || 0).toLocaleString()}`}
            subtitle={`Avg ${currency.symbol}${stats.averageOrderValue || 0}/order`}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-100 dark:bg-green-950/30"
            href="/analytics"
          />
        </div>

        {/* ── Main Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left: Recent Orders + Status */}
          <div className="space-y-6 lg:col-span-2">

            {/* Order Status Distribution */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold">Order Status</h2>
                <Link href="/orders" className="text-[11px] font-medium text-primary hover:underline">
                  View all →
                </Link>
              </div>
              <StatusBar stats={stats} />
            </div>

            {/* Recent Orders */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-bold">Recent Orders</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{sellerOrderTotal} total</span>
                  <Link href="/orders" className="text-[11px] font-medium text-primary hover:underline">
                    View all →
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {sellerOrders.isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3">
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))
                ) : recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="mb-2 h-8 w-8 text-muted-foreground/15" />
                    <p className="text-xs text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  recentOrders.map((item: any) => (
                    <OrderRow key={item.id} item={item} currency={currency} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Links + Alerts */}
          <div className="space-y-6">

            {/* Quick Links */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold">Quick Links</h2>
              <div className="space-y-2">
                <QuickLink
                  title="Orders"
                  description="Manage buyer & seller orders"
                  icon={ShoppingBag}
                  href="/orders"
                  color="bg-primary"
                  badge={stats.pendingOrders || 0}
                />
                <QuickLink
                  title="Analytics"
                  description="Views, revenue, conversion"
                  icon={BarChart3}
                  href="/analytics"
                  color="bg-indigo-500"
                />
                <QuickLink
                  title="Products"
                  description="Manage your product catalog"
                  icon={BoxIcon}
                  href="/manage-products"
                  color="bg-emerald-500"
                />
                <QuickLink
                  title="RFQ Requests"
                  description="Buyer quote requests"
                  icon={FileText}
                  href="/seller-rfq-list"
                  color="bg-amber-500"
                />
                <QuickLink
                  title="Dropshipping"
                  description="Manage dropship products"
                  icon={Truck}
                  href="/dropship-management"
                  color="bg-violet-500"
                />
                <QuickLink
                  title="Messages"
                  description="Chat with buyers"
                  icon={MessageCircle}
                  href="/seller-rfq-request"
                  color="bg-cyan-500"
                />
              </div>
            </div>

            {/* Store Info */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-bold">Your Store</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{me.data?.data?.companyName || userName + "'s Store"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      ID: {me.data?.data?.uniqueId || "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">
                      {me.data?.data?.createdAt
                        ? new Date(me.data.data.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Trade role</span>
                    <span className="font-medium">{me.data?.data?.tradeRole || "MEMBER"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/company-profile"
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <Settings className="h-3 w-3" /> Edit Profile
                  </Link>
                  <Link href="/manage-products"
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 py-2 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
                    <Zap className="h-3 w-3" /> Add Product
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withActiveUserGuard(VendorDashboardPage);
