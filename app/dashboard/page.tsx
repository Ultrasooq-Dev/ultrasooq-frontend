"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useVendorOrderStats, useOrdersBySellerId } from "@/apis/queries/orders.queries";
import Link from "next/link";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import {
  Package, Clock, CheckCircle2, DollarSign, Truck, ShoppingBag,
  BarChart3, BoxIcon, FileText, MessageCircle, Store, ArrowRight,
  TrendingUp, Settings, Zap, PackageCheck, XCircle, Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN: Clean Operational — inspired by Stripe/Linear dashboards.
   No gradients, no noise. Pure information density with breathing room.
   Monochrome base + single accent color. Data-first.
   ═══════════════════════════════════════════════════════════════ */

function DashboardPage() {
  const { currency, user } = useAuth();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 8 });

  const s = orderStats.data?.data || {};
  const orders: any[] = sellerOrders.data?.data || [];
  const totalCount = (sellerOrders.data as any)?.totalCount || 0;
  const name = me.data?.data?.firstName || user?.firstName || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  // Status counts for the mini bar
  const pending = s.pendingOrders || 0;
  const completed = s.completedOrders || 0;
  const cancelled = s.cancelledOrders || 0;
  const total = s.totalOrders || 0;
  const inProgress = Math.max(0, total - pending - completed - cancelled);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1200px] px-6 py-8">

        {/* ── Top Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight leading-none">
              {greeting}, {name}
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { label: "Orders", href: "/orders", icon: ShoppingBag, badge: pending },
              { label: "Analytics", href: "/analytics", icon: BarChart3 },
              { label: "Products", href: "/manage-products", icon: BoxIcon },
            ].map((n) => (
              <Link key={n.href} href={n.href}
                className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <n.icon className="h-4 w-4" /> {n.label}
                {n.badge ? (
                  <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white px-1">
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Numbers Row ──────────────────────────────── */}
        <div className="grid grid-cols-4 gap-px rounded-2xl bg-border overflow-hidden mb-8">
          {[
            { label: "Revenue", value: `${currency.symbol}${Number(s.totalRevenue || 0).toLocaleString()}`, sub: `${currency.symbol}${s.averageOrderValue || 0} avg`, icon: DollarSign, accent: "text-foreground" },
            { label: "Total Orders", value: total, sub: `${s.thisMonthOrders || 0} this month`, icon: Package, accent: "text-foreground" },
            { label: "Pending", value: pending, sub: "Awaiting action", icon: Clock, accent: "text-amber-600" },
            { label: "Completed", value: completed, sub: `${cancelled} cancelled`, icon: CheckCircle2, accent: "text-emerald-600" },
          ].map((card) => (
            <div key={card.label} className="bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
                <card.icon className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className={cn("text-[32px] font-semibold tracking-tight leading-none", card.accent)}>{card.value}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Status Flow ──────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[13px] font-semibold">Order Flow</h2>
            <Link href="/orders" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
              All orders →
            </Link>
          </div>
          {/* Segmented bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-4">
            {total > 0 && (
              <>
                <div className="bg-amber-400 transition-all" style={{ width: `${(pending / total) * 100}%` }} />
                <div className="bg-blue-400 transition-all" style={{ width: `${(inProgress / total) * 100}%` }} />
                <div className="bg-emerald-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
                <div className="bg-red-400 transition-all" style={{ width: `${(cancelled / total) * 100}%` }} />
              </>
            )}
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            {[
              { label: "Pending", count: pending, color: "bg-amber-400" },
              { label: "Processing", count: inProgress, color: "bg-blue-400" },
              { label: "Completed", count: completed, color: "bg-emerald-500" },
              { label: "Cancelled", count: cancelled, color: "bg-red-400" },
            ].map((seg) => (
              <span key={seg.label} className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", seg.color)} />
                {seg.label} <span className="font-semibold text-foreground">{seg.count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Main Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Recent Orders — 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold">Recent Orders</h2>
              <Link href="/orders" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                {totalCount} total →
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2 text-end">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {sellerOrders.isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-border/30">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="col-span-2"><div className="h-3 w-14 animate-pulse rounded bg-muted" /></div>
                    <div className="col-span-2"><div className="h-3 w-8 animate-pulse rounded bg-muted" /></div>
                    <div className="col-span-2"><div className="h-3 w-12 animate-pulse rounded bg-muted ms-auto" /></div>
                    <div className="col-span-1" />
                  </div>
                ))
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Package className="mb-3 h-8 w-8 text-muted-foreground/10" />
                  <p className="text-[13px] text-muted-foreground/40">No orders yet</p>
                </div>
              ) : (
                orders.map((item: any) => {
                  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
                  const img = product.productImages?.[0]?.image;
                  const status = item.orderProductStatus || "PLACED";
                  const statusStyle: Record<string, string> = {
                    PLACED: "text-gray-600 bg-gray-100 dark:bg-gray-800", CONFIRMED: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
                    SHIPPED: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30", OFD: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
                    DELIVERED: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30", CANCELLED: "text-red-500 bg-red-50 dark:bg-red-950/30",
                  };
                  return (
                    <Link key={item.id} href={`/orders/${item.id}`}
                      className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-1.5 h-6 w-6 text-muted-foreground/15" />}
                        </div>
                        <span className="text-[13px] font-medium truncate">{product.productName || `#${item.id}`}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", statusStyle[status] || statusStyle.PLACED)}>
                          {status}
                        </span>
                      </div>
                      <div className="col-span-2 text-[13px] text-muted-foreground">{item.orderQuantity || 1}</div>
                      <div className="col-span-2 text-end text-[13px] font-semibold tabular-nums">
                        {currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-6">
            {/* Navigate */}
            <div>
              <h2 className="text-[13px] font-semibold mb-4">Navigate</h2>
              <div className="space-y-1.5">
                {[
                  { label: "Manage Orders", desc: "View, ship, track", icon: ShoppingBag, href: "/orders", badge: pending },
                  { label: "Analytics", desc: "Revenue, views, funnel", icon: BarChart3, href: "/analytics" },
                  { label: "Products", desc: "Catalog & inventory", icon: BoxIcon, href: "/manage-products" },
                  { label: "RFQ Requests", desc: "Buyer quotes", icon: FileText, href: "/seller-rfq-list" },
                  { label: "Dropshipping", desc: "Partner fulfillment", icon: Truck, href: "/dropship-management" },
                  { label: "Messages", desc: "Buyer conversations", icon: MessageCircle, href: "/seller-rfq-request" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{item.badge}</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Store */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border">
                  <Store className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{me.data?.data?.companyName || name + "'s Store"}</p>
                  <p className="text-[10px] text-muted-foreground">ID: {me.data?.data?.uniqueId || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Since", value: me.data?.data?.createdAt ? new Date(me.data.data.createdAt).getFullYear() : "—" },
                  { label: "Role", value: me.data?.data?.tradeRole || "MEMBER" },
                  { label: "Status", value: "Active" },
                ].map((d) => (
                  <div key={d.label} className="text-center">
                    <p className="text-[10px] text-muted-foreground">{d.label}</p>
                    <p className="text-[12px] font-semibold">{d.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Link href="/company-profile" className="flex-1 text-center rounded-lg border border-border py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Edit Store
                </Link>
                <Link href="/product?productType=P" className="flex-1 text-center rounded-lg bg-foreground py-2 text-[11px] font-medium text-background hover:opacity-90 transition-colors">
                  New Product
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
