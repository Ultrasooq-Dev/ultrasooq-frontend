"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useVendorOrderStats, useOrdersBySellerId } from "@/apis/queries/orders.queries";
import Link from "next/link";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import {
  Package, Clock, CheckCircle2, XCircle, DollarSign, Truck,
  ShoppingBag, BarChart3, BoxIcon, FileText, MessageCircle,
  Zap, Settings, Store, ArrowRight, TrendingUp, Eye, Star,
  AlertTriangle, PackageCheck, ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN: Editorial Dashboard — Bloomberg meets Shopify
   Bold headline numbers, pipeline flow, warm amber accents,
   asymmetric grid, magazine-style hierarchy.
   ═══════════════════════════════════════════════════════════════ */

// ─── Order Pipeline Stage ───────────────────────────────────────
function PipelineStage({
  label, count, color, bgColor, isLast, total,
}: {
  label: string; count: number; color: string; bgColor: string;
  isLast?: boolean; total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className={cn("relative rounded-xl p-4 transition-all hover:scale-[1.02]", bgColor)}>
        <p className={cn("text-3xl font-black tracking-tighter", color)}>{count}</p>
        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
        {/* Bar */}
        <div className="mt-3 h-1 rounded-full bg-black/5 dark:bg-white/5">
          <div className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))}
            style={{ width: `${pct}%` }} />
        </div>
        <span className="mt-1 block text-[9px] text-muted-foreground/60">{pct}%</span>
      </div>
      {!isLast && (
        <div className="flex justify-center py-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/30 -rotate-90 lg:rotate-0" />
        </div>
      )}
    </div>
  );
}

// ─── Recent Order Row ───────────────────────────────────────────
function OrderRow({ item, currency, idx }: { item: any; currency: { symbol: string }; idx: number }) {
  const status = item.orderProductStatus || "PLACED";
  const dot: Record<string, string> = {
    PLACED: "bg-gray-400", CONFIRMED: "bg-blue-500", SHIPPED: "bg-indigo-500",
    OFD: "bg-amber-500", DELIVERED: "bg-emerald-500", CANCELLED: "bg-red-500",
  };
  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
  const img = product.productImages?.[0]?.image;

  return (
    <Link href={`/orders/${item.id}`}
      className="group flex items-center gap-4 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
      style={{ animationDelay: `${idx * 80}ms` }}>
      {/* Rank */}
      <span className="w-5 text-center text-[10px] font-bold text-muted-foreground/40">{idx + 1}</span>
      {/* Image */}
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted/50 ring-1 ring-border/50">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-2.5 h-6 w-6 text-muted-foreground/15" />}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
          {product.productName || `#${item.id}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", dot[status] || dot.PLACED)} />
          <span className="text-[10px] text-muted-foreground">{status}</span>
          <span className="text-[10px] text-muted-foreground">· Qty {item.orderQuantity || 1}</span>
        </div>
      </div>
      {/* Price */}
      <span className="text-sm font-bold tabular-nums">
        {currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(0)}
      </span>
    </Link>
  );
}

// ─── Action Card ────────────────────────────────────────────────
function ActionCard({
  title, desc, icon: Icon, href, gradient, badge,
}: {
  title: string; desc: string; icon: React.ElementType;
  href: string; gradient: string; badge?: number;
}) {
  return (
    <Link href={href}
      className="group relative overflow-hidden rounded-2xl p-5 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]">
      {/* Gradient background */}
      <div className={cn("absolute inset-0 opacity-90", gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <Icon className="h-7 w-7 text-white/90" />
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-6 text-base font-bold text-white">{title}</h3>
        <p className="mt-0.5 text-[11px] text-white/60">{desc}</p>
        <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-white/50 group-hover:text-white/80 transition-colors">
          Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
function DashboardPage() {
  const { currency, user } = useAuth();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 6 });

  const stats = orderStats.data?.data || {};
  const recentOrders: any[] = sellerOrders.data?.data || [];
  const total = stats.totalOrders || 0;
  const userName = me.data?.data?.firstName || user?.firstName || "there";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* ═══ Header ═══ */}
        <header className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">{today}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              {greeting}, <span className="text-primary">{userName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/analytics"
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
            <Link href="/orders"
              className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:opacity-90 transition-all">
              <ShoppingBag className="h-4 w-4" /> Orders
            </Link>
          </div>
        </header>

        {/* ═══ Hero Revenue ═══ */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Revenue — takes 3 cols */}
          <Link href="/analytics" className="group lg:col-span-3">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white transition-all hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="absolute -top-20 -end-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-10 -start-10 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-white/70" />
                  <span className="text-sm font-medium text-white/70">Total Revenue</span>
                </div>
                <p className="mt-2 text-6xl font-black tracking-tighter lg:text-7xl">
                  {currency.symbol}{Number(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-4 flex items-center gap-6 text-sm text-white/60">
                  <span>{total} orders total</span>
                  <span>·</span>
                  <span>Avg {currency.symbol}{stats.averageOrderValue || 0}/order</span>
                  <span>·</span>
                  <span>{stats.thisMonthOrders || 0} this month</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Right stats — takes 2 cols */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-1">
            <Link href="/orders" className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  Needs action
                </span>
              </div>
              <p className="mt-3 text-4xl font-black tracking-tighter text-amber-600 dark:text-amber-400">
                {stats.pendingOrders || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Pending orders</p>
            </Link>
            <Link href="/orders" className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {stats.cancelledOrders > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    {stats.cancelledOrders} cancelled
                  </span>
                )}
              </div>
              <p className="mt-3 text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                {stats.completedOrders || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Completed orders</p>
            </Link>
          </div>
        </div>

        {/* ═══ Order Pipeline ═══ */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Order Pipeline</h2>
            <Link href="/orders" className="text-xs font-medium text-primary hover:underline">
              Manage all →
            </Link>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
            <PipelineStage label="Pending" count={stats.pendingOrders || 0} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-950/20" total={total} />
            <PipelineStage label="Confirmed" count={Math.max(0, (total || 0) - (stats.pendingOrders || 0) - (stats.completedOrders || 0) - (stats.cancelledOrders || 0))} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-950/20" total={total} />
            <PipelineStage label="In Transit" count={0} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-950/20" total={total} />
            <PipelineStage label="Delivered" count={stats.completedOrders || 0} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-950/20" total={total} />
            <PipelineStage label="Cancelled" count={stats.cancelledOrders || 0} color="text-red-500" bgColor="bg-red-50 dark:bg-red-950/20" total={total} isLast />
          </div>
        </div>

        {/* ═══ Bottom Grid ═══ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

          {/* Recent Orders — 3 cols */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-sm font-bold">Recent Sales</h2>
                <Link href="/orders" className="text-[11px] font-medium text-primary hover:underline">
                  View all {(sellerOrders.data as any)?.totalCount || 0} →
                </Link>
              </div>
              <div className="px-4 py-2">
                {sellerOrders.isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))
                ) : recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package className="mb-3 h-10 w-10 text-muted-foreground/10" />
                    <p className="text-sm font-medium text-muted-foreground/40">No orders yet</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/30">Orders will appear here when buyers purchase</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {recentOrders.map((item: any, i: number) => (
                      <OrderRow key={item.id} item={item} currency={currency} idx={i} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions — 2 cols */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard title="Orders" desc="Manage & ship" icon={ShoppingBag} href="/orders"
                gradient="bg-gradient-to-br from-primary to-blue-600" badge={stats.pendingOrders || 0} />
              <ActionCard title="Analytics" desc="Performance" icon={BarChart3} href="/analytics"
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600" />
              <ActionCard title="Products" desc="Catalog" icon={BoxIcon} href="/manage-products"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <ActionCard title="RFQ" desc="Quote requests" icon={FileText} href="/seller-rfq-list"
                gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
              <ActionCard title="Dropship" desc="Fulfillment" icon={Truck} href="/dropship-management"
                gradient="bg-gradient-to-br from-violet-500 to-fuchsia-600" />
              <ActionCard title="Messages" desc="Chat" icon={MessageCircle} href="/seller-rfq-request"
                gradient="bg-gradient-to-br from-cyan-500 to-blue-600" />
            </div>

            {/* Store card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{me.data?.data?.companyName || userName + "'s Store"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {me.data?.data?.tradeRole || "MEMBER"} · Since {me.data?.data?.createdAt ? new Date(me.data.data.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
                <Link href="/company-profile"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withActiveUserGuard(DashboardPage);
