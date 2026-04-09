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
  Settings, Zap, PackageCheck, XCircle, Eye, TrendingUp, Bell,
  ChevronRight, Star, Users, Layers, Tag,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN: Noon Seller Center — Dark theme, gold accents (#FEEE00),
   data-dense, donut chart, bilingual-ready, sidebar feel.
   ═══════════════════════════════════════════════════════════════ */

// ── Donut Chart (pure CSS) ──────────────────────────────────────
function DonutChart({ segments, size = 140 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const gradientParts = segments.map((seg) => {
    const start = (cumulative / total) * 360;
    cumulative += seg.value;
    const end = (cumulative / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(${gradientParts || "#333 0deg 360deg"})` }} />
        <div className="absolute inset-[20%] rounded-full bg-[#1a1a2e] flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{total}</p>
            <p className="text-[9px] text-gray-400 -mt-0.5">TOTAL</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-gray-400 w-20">{seg.label}</span>
            <span className="text-[12px] font-bold text-white">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat Box ────────────────────────────────────────────────────
function StatBox({ label, value, icon: Icon, accent, sub, href }: {
  label: string; value: string | number; icon: React.ElementType;
  accent: string; sub?: string; href?: string;
}) {
  const content = (
    <div className={cn(
      "rounded-2xl bg-[#1e1e3a] p-5 border border-white/5 transition-all",
      href && "hover:border-[#FEEE00]/30 hover:shadow-lg hover:shadow-[#FEEE00]/5 cursor-pointer group"
    )}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn("h-5 w-5", accent)} />
        {href && <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-[#FEEE00] transition-colors" />}
      </div>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={cn("mt-1 text-3xl font-black tracking-tight", accent)}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ── Order Row ───────────────────────────────────────────────────
function OrderRow({ item, currency }: { item: any; currency: { symbol: string } }) {
  const product = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
  const img = product.productImages?.[0]?.image;
  const status = item.orderProductStatus || "PLACED";
  const statusMap: Record<string, { label: string; color: string }> = {
    PLACED: { label: "New", color: "bg-gray-500" },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-500" },
    SHIPPED: { label: "Shipped", color: "bg-indigo-500" },
    OFD: { label: "Out for Delivery", color: "bg-[#FEEE00] text-black" },
    DELIVERED: { label: "Delivered", color: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", color: "bg-red-500" },
  };
  const st = statusMap[status] || statusMap.PLACED;

  return (
    <Link href={`/orders/${item.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="m-2 h-6 w-6 text-gray-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-200 truncate">{product.productName || `Order #${item.id}`}</p>
        <p className="text-[10px] text-gray-500">Qty: {item.orderQuantity || 1}</p>
      </div>
      <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-bold text-white", st.color)}>{st.label}</span>
      <span className="text-[13px] font-bold text-white tabular-nums w-16 text-end">
        {currency.symbol}{Number(item.customerPay || item.purchasePrice || 0).toFixed(0)}
      </span>
    </Link>
  );
}

// ── Nav Item ────────────────────────────────────────────────────
function NavItem({ label, icon: Icon, href, badge, active }: {
  label: string; icon: React.ElementType; href: string; badge?: number; active?: boolean;
}) {
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all",
        active ? "bg-[#FEEE00]/10 text-[#FEEE00]" : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]",
      )}>
      <Icon className="h-4.5 w-4.5" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-[#FEEE00] px-2 py-0.5 text-[9px] font-black text-black">{badge}</span>
      ) : null}
    </Link>
  );
}

// ── Main ────────────────────────────────────────────────────────
function DashboardPage() {
  const { currency, user } = useAuth();
  const me = useMe();
  const orderStats = useVendorOrderStats();
  const sellerOrders = useOrdersBySellerId({ page: 1, limit: 6 });

  const s = orderStats.data?.data || {};
  const orders: any[] = sellerOrders.data?.data || [];
  const totalCount = (sellerOrders.data as any)?.totalCount || 0;
  const name = me.data?.data?.firstName || user?.firstName || "Seller";

  const pending = s.pendingOrders || 0;
  const completed = s.completedOrders || 0;
  const cancelled = s.cancelledOrders || 0;
  const total = s.totalOrders || 0;
  const inProgress = Math.max(0, total - pending - completed - cancelled);

  return (
    <div className="min-h-screen bg-[#12122a] text-white">
      <div className="flex">

        {/* ═══ Sidebar ═══ */}
        <aside className="sticky top-0 h-screen w-56 shrink-0 border-e border-white/5 bg-[#0d0d20] flex flex-col">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEEE00]">
                <Store className="h-4 w-4 text-black" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white leading-none">{me.data?.data?.companyName || "Seller Hub"}</p>
                <p className="text-[9px] text-gray-500">{me.data?.data?.uniqueId || "Dashboard"}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavItem label="Dashboard" icon={Layers} href="/dashboard" active />
            <NavItem label="Orders" icon={ShoppingBag} href="/orders" badge={pending} />
            <NavItem label="Products" icon={BoxIcon} href="/manage-products" />
            <NavItem label="Analytics" icon={BarChart3} href="/analytics" />
            <NavItem label="RFQ" icon={FileText} href="/seller-rfq-list" />
            <NavItem label="Dropship" icon={Truck} href="/dropship-management" />
            <NavItem label="Messages" icon={MessageCircle} href="/seller-rfq-request" />
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-white/5 space-y-1">
            <NavItem label="Settings" icon={Settings} href="/company-profile" />
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEEE00]/20 text-[#FEEE00] text-[11px] font-bold">
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-300">{name}</p>
                <p className="text-[9px] text-gray-600">{me.data?.data?.email || "seller"}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ Main Content ═══ */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#12122a]/90 backdrop-blur-xl px-8 py-4">
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-[11px] text-gray-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">
                <Bell className="h-4 w-4" />
                {pending > 0 && <span className="absolute -top-1 -end-1 h-3.5 w-3.5 rounded-full bg-[#FEEE00] border-2 border-[#12122a]" />}
              </button>
              <Link href="/product?productType=P"
                className="flex items-center gap-1.5 rounded-xl bg-[#FEEE00] px-4 py-2 text-[12px] font-bold text-black hover:bg-[#e5d700] transition-colors">
                <Zap className="h-3.5 w-3.5" /> Add Product
              </Link>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">

            {/* ── Stats Row ──────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
              <StatBox label="Revenue" value={`${currency.symbol}${Number(s.totalRevenue || 0).toLocaleString()}`}
                icon={DollarSign} accent="text-[#FEEE00]" sub={`Avg ${currency.symbol}${s.averageOrderValue || 0}/order`} href="/analytics" />
              <StatBox label="Total Orders" value={total}
                icon={Package} accent="text-white" sub={`${s.thisMonthOrders || 0} this month`} href="/orders" />
              <StatBox label="Pending" value={pending}
                icon={Clock} accent="text-amber-400" sub="Needs your action" href="/orders" />
              <StatBox label="Delivered" value={completed}
                icon={PackageCheck} accent="text-emerald-400" sub={`${cancelled} cancelled`} href="/orders" />
            </div>

            {/* ── Middle Row ─────────────────────────────── */}
            <div className="grid grid-cols-5 gap-6">

              {/* Donut */}
              <div className="col-span-2 rounded-2xl bg-[#1e1e3a] border border-white/5 p-6">
                <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-5">Order Distribution</h3>
                <DonutChart segments={[
                  { label: "Pending", value: pending, color: "#fbbf24" },
                  { label: "Processing", value: inProgress, color: "#3b82f6" },
                  { label: "Delivered", value: completed, color: "#10b981" },
                  { label: "Cancelled", value: cancelled, color: "#ef4444" },
                ]} />
              </div>

              {/* Performance cards */}
              <div className="col-span-3 grid grid-cols-3 gap-4">
                {[
                  { label: "Conversion", value: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%", icon: TrendingUp, color: "text-emerald-400", desc: "Completion rate" },
                  { label: "Avg Order", value: `${currency.symbol}${s.averageOrderValue || 0}`, icon: Tag, color: "text-[#FEEE00]", desc: "Per transaction" },
                  { label: "Cancel Rate", value: total > 0 ? `${Math.round((cancelled / total) * 100)}%` : "0%", icon: XCircle, color: "text-red-400", desc: "Of all orders" },
                  { label: "This Month", value: s.thisMonthOrders || 0, icon: Star, color: "text-blue-400", desc: "New orders" },
                  { label: "Last Month", value: s.lastMonthOrders || 0, icon: BarChart3, color: "text-indigo-400", desc: "Previous period" },
                  { label: "Customers", value: totalCount, icon: Users, color: "text-cyan-400", desc: "Total buyers" },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl bg-[#1e1e3a] border border-white/5 p-4">
                    <card.icon className={cn("h-4 w-4 mb-2", card.color)} />
                    <p className={cn("text-xl font-black", card.color)}>{card.value}</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">{card.label}</p>
                    <p className="text-[9px] text-gray-600">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent Orders ───────────────────────────── */}
            <div className="rounded-2xl bg-[#1e1e3a] border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-[13px] font-bold">Recent Orders</h3>
                <Link href="/orders" className="text-[11px] font-medium text-[#FEEE00] hover:underline">
                  View all {totalCount} →
                </Link>
              </div>

              {sellerOrders.isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
                      <div className="h-2 w-16 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                ))
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="mb-3 h-10 w-10 text-gray-700" />
                  <p className="text-[13px] text-gray-500">No orders yet</p>
                  <p className="text-[11px] text-gray-600 mt-1">Orders appear here when buyers purchase your products</p>
                </div>
              ) : (
                orders.map((item: any) => (
                  <OrderRow key={item.id} item={item} currency={currency} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default withActiveUserGuard(DashboardPage);
