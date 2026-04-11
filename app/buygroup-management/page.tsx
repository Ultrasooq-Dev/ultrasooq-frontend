"use client";
import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import {
  Users, Package, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Timer, TrendingUp, ArrowRight,
  ShieldCheck, Zap, CalendarPlus, Ban, MessageCircle,
  BarChart3, Eye, RefreshCw, Bell, Search, Filter,
  ArrowUpDown, MoreHorizontal, Send, DollarSign,
  Star, X, ChevronLeft, ChevronRight, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend, ComposedChart, Line,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   BUYGROUP OPERATIONS CENTER — Vendor Deal Management

   This is a UI-only page. All data is mock/placeholder.
   Backend endpoints will be wired in Phase 2.

   Covers:
   1. Deal lifecycle management (accept, bypass min, extend, cancel)
   2. Progress visualization (customers, quantity, time)
   3. Individual order management within deals
   4. Notifications to buyers
   5. Deal history & analytics
   6. Auto-expiry handling
   ═══════════════════════════════════════════════════════════════ */

// ─── Theme: Consistent with vendor-dashboard ─────────────────
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
  successBorder: "border-emerald-200",
  warning: "text-amber-600",
  warningBg: "bg-amber-50",
  warningBorder: "border-amber-200",
  danger: "text-red-600",
  dangerBg: "bg-red-50",
  dangerBorder: "border-red-200",
  infoBg: "bg-blue-50",
  infoText: "text-blue-600",
  infoBorder: "border-blue-200",
};

// ─── Types ───────────────────────────────────────────────────
type DealStatus = "ACTIVE" | "THRESHOLD_MET" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "COMPLETED";

interface BuyGroupDeal {
  id: number;
  productName: string;
  productImage: string | null;
  productPriceId: number;
  price: number;
  offerPrice: number;
  currency: string;
  // Thresholds
  minCustomer: number;
  maxCustomer: number;
  currentCustomers: number;
  // Quantity
  stock: number;
  orderedQuantity: number;
  minQuantityPerCustomer: number;
  maxQuantityPerCustomer: number;
  // Time window
  dateOpen: string;
  dateClose: string;
  startTime: string;
  endTime: string;
  // Status
  status: DealStatus;
  // Orders within this deal
  orders: BuyGroupOrder[];
}

interface BuyGroupOrder {
  id: number;
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerRating: number; // 0-5 stars
  quantity: number;
  total: number;
  status: "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
}

// ─── Privacy: mask customer info before deal is finalized ────
function maskName(name: string, dealDone: boolean): string {
  if (dealDone) return name;
  const parts = name.split(" ");
  return parts.map((p) => (p.length <= 2 ? p : p.slice(0, 2) + "****")).join(" ");
}

function maskEmail(email: string, dealDone: boolean): string {
  if (dealDone) return email;
  const [local, domain] = email.split("@");
  if (!domain) return "****@****.***";
  return (local.length <= 2 ? local : local.slice(0, 2) + "****") + "@" + domain.slice(0, 1) + "****.***";
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3 w-3", i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
        />
      ))}
      <span className="text-xs text-muted-foreground ms-1">({rating.toFixed(1)})</span>
    </span>
  );
}

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_DEALS: BuyGroupDeal[] = [
  {
    id: 1,
    productName: "Premium Wireless Headphones - Bulk Pack",
    productImage: null,
    productPriceId: 101,
    price: 89.99,
    offerPrice: 59.99,
    currency: "$",
    minCustomer: 10,
    maxCustomer: 50,
    currentCustomers: 7,
    stock: 200,
    orderedQuantity: 42,
    minQuantityPerCustomer: 2,
    maxQuantityPerCustomer: 20,
    dateOpen: "2026-04-05T00:00:00Z",
    dateClose: "2026-04-18T23:59:00Z",
    startTime: "00:00",
    endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 1, orderId: 1001, customerName: "Ahmed Salem", customerEmail: "ahmed@store.com", customerRating: 4.8, quantity: 8, total: 479.92, status: "PLACED", createdAt: "2026-04-06T10:30:00Z" },
      { id: 2, orderId: 1002, customerName: "Sarah Chen", customerEmail: "sarah@biz.com", customerRating: 4.5, quantity: 5, total: 299.95, status: "PLACED", createdAt: "2026-04-06T14:15:00Z" },
      { id: 3, orderId: 1003, customerName: "Omar Khalid", customerEmail: "omar@trade.com", customerRating: 3.9, quantity: 10, total: 599.90, status: "PLACED", createdAt: "2026-04-07T09:00:00Z" },
      { id: 4, orderId: 1004, customerName: "Maria Garcia", customerEmail: "maria@shop.com", customerRating: 4.2, quantity: 4, total: 239.96, status: "PLACED", createdAt: "2026-04-07T16:45:00Z" },
      { id: 5, orderId: 1005, customerName: "James Wilson", customerEmail: "james@co.uk", customerRating: 5.0, quantity: 3, total: 179.97, status: "PLACED", createdAt: "2026-04-08T11:20:00Z" },
      { id: 6, orderId: 1006, customerName: "Fatima Al-Rashid", customerEmail: "fatima@biz.sa", customerRating: 4.0, quantity: 6, total: 359.94, status: "CANCELLED", createdAt: "2026-04-08T13:00:00Z" },
      { id: 7, orderId: 1007, customerName: "David Lee", customerEmail: "david@hk.com", customerRating: 3.5, quantity: 6, total: 359.94, status: "PLACED", createdAt: "2026-04-09T08:30:00Z" },
      { id: 8, orderId: 1008, customerName: "Layla Mansour", customerEmail: "layla@uae.com", customerRating: 4.7, quantity: 2, total: 119.98, status: "PLACED", createdAt: "2026-04-09T10:00:00Z" },
      { id: 9, orderId: 1009, customerName: "Yuki Tanaka", customerEmail: "yuki@jp.co", customerRating: 4.9, quantity: 3, total: 179.97, status: "PLACED", createdAt: "2026-04-09T14:30:00Z" },
      { id: 10, orderId: 1010, customerName: "Priya Sharma", customerEmail: "priya@in.co", customerRating: 4.1, quantity: 5, total: 299.95, status: "PLACED", createdAt: "2026-04-10T09:15:00Z" },
      { id: 11, orderId: 1011, customerName: "Mohammed Al-Farsi", customerEmail: "moh@om.net", customerRating: 3.8, quantity: 7, total: 419.93, status: "PLACED", createdAt: "2026-04-10T11:00:00Z" },
      { id: 12, orderId: 1012, customerName: "Elena Volkov", customerEmail: "elena@ru.biz", customerRating: 4.6, quantity: 4, total: 239.96, status: "PLACED", createdAt: "2026-04-10T15:45:00Z" },
    ],
  },
  {
    id: 2,
    productName: "Organic Coffee Beans 1kg - Group Buy",
    productImage: null,
    productPriceId: 102,
    price: 24.99,
    offerPrice: 17.99,
    currency: "$",
    minCustomer: 20,
    maxCustomer: 100,
    currentCustomers: 23,
    stock: 500,
    orderedQuantity: 340,
    minQuantityPerCustomer: 1,
    maxQuantityPerCustomer: 50,
    dateOpen: "2026-04-01T00:00:00Z",
    dateClose: "2026-04-12T23:59:00Z",
    startTime: "00:00",
    endTime: "23:59",
    status: "THRESHOLD_MET",
    orders: [
      { id: 10, orderId: 2001, customerName: "Buyer 1", customerEmail: "b1@test.com", customerRating: 4.3, quantity: 15, total: 269.85, status: "PLACED", createdAt: "2026-04-02T10:00:00Z" },
      { id: 11, orderId: 2002, customerName: "Buyer 2", customerEmail: "b2@test.com", customerRating: 4.7, quantity: 20, total: 359.80, status: "PLACED", createdAt: "2026-04-03T10:00:00Z" },
    ],
  },
  {
    id: 3,
    productName: "LED Smart Bulb Set x12",
    productImage: null,
    productPriceId: 103,
    price: 45.00,
    offerPrice: 32.00,
    currency: "$",
    minCustomer: 15,
    maxCustomer: 40,
    currentCustomers: 8,
    stock: 120,
    orderedQuantity: 30,
    minQuantityPerCustomer: 1,
    maxQuantityPerCustomer: 10,
    dateOpen: "2026-03-20T00:00:00Z",
    dateClose: "2026-04-10T23:59:00Z",
    startTime: "00:00",
    endTime: "23:59",
    status: "EXPIRED",
    orders: [
      { id: 20, orderId: 3001, customerName: "Buyer A", customerEmail: "a@test.com", customerRating: 3.5, quantity: 4, total: 128.00, status: "PLACED", createdAt: "2026-03-22T10:00:00Z" },
    ],
  },
  {
    id: 4,
    productName: "Stainless Steel Water Bottles x24",
    productImage: null,
    productPriceId: 104,
    price: 12.50,
    offerPrice: 8.99,
    currency: "$",
    minCustomer: 5,
    maxCustomer: 30,
    currentCustomers: 12,
    stock: 300,
    orderedQuantity: 300,
    minQuantityPerCustomer: 5,
    maxQuantityPerCustomer: 50,
    dateOpen: "2026-03-15T00:00:00Z",
    dateClose: "2026-04-05T23:59:00Z",
    startTime: "00:00",
    endTime: "23:59",
    status: "COMPLETED",
    orders: [],
  },
];

// ─── Helper Components ───────────────────────────────────────

function ProgressBar({ value, max, color = "bg-[#c2703e]", height = "h-2" }: { value: number; max: number; color?: string; height?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", height)}>
      <div
        className={cn("rounded-full transition-all duration-500", color, height)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CountdownTimer({ dateClose, endTime }: { dateClose: string; endTime: string }) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const end = new Date(dateClose);
  if (endTime) {
    const [h, m] = endTime.split(":").map(Number);
    end.setHours(h || 23, m || 59, 0, 0);
  }

  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return <span className={T.danger}>Expired</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (days > 0) {
    return <span className={cn(days <= 1 ? T.warning : T.muted)}>{days}d {hours}h {minutes}m</span>;
  }
  return <span className={cn(hours <= 2 ? T.danger : T.warning)}>{hours}h {minutes}m {seconds}s</span>;
}

function StatusBadge({ status }: { status: DealStatus | string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    ACTIVE: { bg: T.infoBg, text: T.infoText, icon: <Clock className="h-3.5 w-3.5" />, label: "Active" },
    THRESHOLD_MET: { bg: T.successBg, text: T.success, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Threshold Met" },
    CONFIRMED: { bg: "bg-indigo-50", text: "text-indigo-600", icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Confirmed" },
    EXPIRED: { bg: T.warningBg, text: T.warning, icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Expired" },
    CANCELLED: { bg: T.dangerBg, text: T.danger, icon: <XCircle className="h-3.5 w-3.5" />, label: "Cancelled" },
    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Completed" },
    PLACED: { bg: T.infoBg, text: T.infoText, icon: <Clock className="h-3.5 w-3.5" />, label: "Placed" },
    SHIPPED: { bg: "bg-indigo-50", text: "text-indigo-600", icon: <Package className="h-3.5 w-3.5" />, label: "Shipped" },
    DELIVERED: { bg: T.successBg, text: T.success, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Delivered" },
    REFUNDED: { bg: T.dangerBg, text: T.danger, icon: <RefreshCw className="h-3.5 w-3.5" />, label: "Refunded" },
  };

  const c = config[status] || config.ACTIVE;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>
      {c.icon} {c.label}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={cn(T.card, T.border, "border rounded-2xl p-5 flex items-start gap-4")}>
      <div className={cn("p-3 rounded-xl", color)}>{icon}</div>
      <div>
        <div className={cn("text-2xl font-bold", T.text)}>{value}</div>
        <div className={cn("text-sm", T.muted)}>{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Deal Card ───────────────────────────────────────────────

function DealCard({ deal, langDir, t }: { deal: BuyGroupDeal; langDir: string; t: any }) {
  const [showPanel, setShowPanel] = useState(false);
  const [panelSearch, setPanelSearch] = useState("");
  const [panelPage, setPanelPage] = useState(1);
  const PANEL_PAGE_SIZE = 8;
  const [showActions, setShowActions] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [extendDays, setExtendDays] = useState(1);
  const [extendInput, setExtendInput] = useState("");

  const activeOrders = deal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const cancelledOrders = deal.orders.filter((o) => ["CANCELLED", "REFUNDED"].includes(o.status));
  const customerPct = deal.minCustomer > 0 ? (deal.currentCustomers / deal.minCustomer) * 100 : 100;
  const quantityPct = deal.stock > 0 ? (deal.orderedQuantity / deal.stock) * 100 : 0;
  const isExpired = deal.status === "EXPIRED";
  const isActive = deal.status === "ACTIVE";
  const isThresholdMet = deal.status === "THRESHOLD_MET";
  const isDealDone = ["COMPLETED", "CANCELLED"].includes(deal.status);
  const revenue = activeOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden transition-shadow hover:shadow-md")}>
      {/* ── Deal Header ── */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Product Image */}
            <div className={cn("w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center", T.accentLight)}>
              {deal.productImage ? (
                <img src={deal.productImage} alt={deal.productName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Package className={cn("h-8 w-8", T.accentText)} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={cn("text-lg font-semibold truncate", T.text)}>{deal.productName}</h3>
                <StatusBadge status={deal.status} />
              </div>

              <div className={cn("flex items-center gap-4 mt-1.5 text-sm", T.muted)}>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="line-through">{deal.currency}{deal.price}</span>
                  <span className={cn("font-semibold", T.accentText)}>{deal.currency}{deal.offerPrice}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {deal.currentCustomers}/{deal.minCustomer} min
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {deal.orderedQuantity}/{deal.stock} units
                </span>
                {!isDealDone && (
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <CountdownTimer dateClose={deal.dateClose} endTime={deal.endTime} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!isDealDone && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isThresholdMet && (
                <button className={cn("px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors", T.accentBg, "hover:opacity-90")}>
                  <CheckCircle2 className="h-4 w-4 inline-block me-1.5" />
                  Accept Deal
                </button>
              )}
              <button
                onClick={() => setShowActions(!showActions)}
                className={cn("p-2 rounded-xl transition-colors hover:bg-gray-100", T.muted)}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Progress Bars ── */}
        <div className="grid grid-cols-2 gap-6 mt-5">
          {/* Customers progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={T.muted}>Customers ({deal.currentCustomers}/{deal.minCustomer} min)</span>
              <span className={cn("font-semibold", customerPct >= 100 ? T.success : T.accentText)}>
                {Math.round(customerPct)}%
              </span>
            </div>
            <ProgressBar
              value={deal.currentCustomers}
              max={deal.minCustomer}
              color={customerPct >= 100 ? "bg-emerald-500" : "bg-[#c2703e]"}
              height="h-2.5"
            />
          </div>

          {/* Quantity progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={T.muted}>Quantity ({deal.orderedQuantity}/{deal.stock} stock)</span>
              <span className={cn("font-semibold", quantityPct >= 100 ? T.success : T.infoText)}>
                {Math.round(quantityPct)}%
              </span>
            </div>
            <ProgressBar
              value={deal.orderedQuantity}
              max={deal.stock}
              color={quantityPct >= 100 ? "bg-emerald-500" : "bg-blue-500"}
              height="h-2.5"
            />
          </div>
        </div>

        {/* ── Action Dropdown ── */}
        {showActions && !isDealDone && (
          <div className={cn("mt-4 p-4 rounded-xl border flex flex-wrap gap-2", T.border, "bg-[#faf6f1]")}>
            {isActive && (
              <button className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.successBg, T.successBorder, T.success, "hover:bg-emerald-100")}>
                <Zap className="h-4 w-4" />
                Bypass Minimum
              </button>
            )}
            <button
              onClick={() => setShowExtendModal(true)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.infoBg, T.infoBorder, T.infoText, "hover:bg-blue-100")}
            >
              <CalendarPlus className="h-4 w-4" />
              Extend Time
            </button>
            <button
              onClick={() => setShowNotifyModal(true)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100")}
            >
              <Bell className="h-4 w-4" />
              Notify All Buyers
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.dangerBg, T.dangerBorder, T.danger, "hover:bg-red-100")}
            >
              <Ban className="h-4 w-4" />
              Cancel & Refund All
            </button>
          </div>
        )}

        {/* ── Expired Deal Actions ── */}
        {isExpired && (
          <div className={cn("mt-4 p-4 rounded-xl border", T.warningBorder, T.warningBg)}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn("h-5 w-5 flex-shrink-0 mt-0.5", T.warning)} />
              <div className="flex-1">
                <p className={cn("text-sm font-medium", T.warning)}>
                  Deal expired without meeting minimum ({deal.currentCustomers}/{deal.minCustomer} customers)
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  Choose to extend the deal, bypass the minimum to proceed, or cancel and refund all orders.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className={cn("px-3 py-1.5 rounded-lg text-xs font-medium text-white", T.accentBg)}>
                    <Zap className="h-3.5 w-3.5 inline me-1" />
                    Bypass & Accept
                  </button>
                  <button
                    onClick={() => {
                      const origDays = Math.max(1, Math.round((new Date(deal.dateClose).getTime() - new Date(deal.dateOpen).getTime()) / 86400000));
                      const maxExt = Math.max(1, Math.floor(origDays / 2));
                      setExtendDays(Math.min(maxExt, 7));
                      setExtendInput(String(Math.min(maxExt, 7)));
                      setShowExtendModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 inline me-1" />
                    Extend Time
                  </button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white">
                    <Ban className="h-3.5 w-3.5 inline me-1" />
                    Cancel & Refund All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Per-Deal Mini Timeline ── */}
        {deal.orders.length > 0 && (() => {
          const tl = generateDealTimeline(deal);
          return (
            <div className={cn("mt-4 pt-4 border-t", T.border)}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium", T.muted)}>Order Timeline</span>
                <div className={cn("flex items-center gap-4 text-xs", T.muted)}>
                  <span>Revenue: <span className={cn("font-semibold", T.text)}>{deal.currency}{revenue.toFixed(2)}</span></span>
                  <span>Active: <span className="font-semibold">{activeOrders.length}</span></span>
                  {cancelledOrders.length > 0 && (
                    <span className={T.danger}>Cancelled: {cancelledOrders.length}</span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={tl} margin={{ top: 2, right: 4, left: 0, bottom: 2 }}>
                  <defs>
                    <linearGradient id={`miniGrad-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c2703e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c2703e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8a7560" }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="customers" name="Customers" stroke="#c2703e" strokeWidth={2} fill={`url(#miniGrad-${deal.id})`} dot={{ r: 2, fill: "#c2703e", strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="target" name="Min Target" stroke="#f87171" strokeWidth={1} strokeDasharray="4 3" dot={false} activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Action Buttons Row */}
        <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t", T.border)}>
          <button
            onClick={() => { setShowPanel(true); setPanelPage(1); setPanelSearch(""); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-colors", T.border, T.accentText, "hover:bg-[#c2703e]/5")}
          >
            <Users className="h-4 w-4" />
            View Buyers ({deal.orders.length})
          </button>
          <a
            href={`/manage-products/deal-analysis?id=${deal.id}`}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm text-white transition-colors", T.accentBg, "hover:opacity-90")}
          >
            <BarChart3 className="h-4 w-4" />
            Full Analysis
          </a>
        </div>
      </div>

      {/* ── Buyers Slide-Over Panel ── */}
      {showPanel && (() => {
        const dealFinished = ["COMPLETED", "CONFIRMED"].includes(deal.status);
        const filtered = deal.orders.filter((o) => {
          if (!panelSearch) return true;
          const term = panelSearch.toLowerCase();
          const name = dealFinished ? o.customerName.toLowerCase() : maskName(o.customerName, false).toLowerCase();
          return name.includes(term) || String(o.orderId).includes(term);
        });
        const totalPages = Math.ceil(filtered.length / PANEL_PAGE_SIZE);
        const paged = filtered.slice((panelPage - 1) * PANEL_PAGE_SIZE, panelPage * PANEL_PAGE_SIZE);
        const avgRating = deal.orders.length > 0 ? deal.orders.reduce((s, o) => s + o.customerRating, 0) / deal.orders.length : 0;

        return (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowPanel(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 transition-opacity" />

            {/* Panel */}
            <div
              className={cn(T.card, "relative w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200")}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div className={cn("p-5 border-b flex items-start justify-between", T.border)}>
                <div>
                  <h3 className={cn("text-lg font-semibold", T.text)}>Buyers — {deal.productName}</h3>
                  <div className={cn("flex items-center gap-4 mt-1.5 text-sm", T.muted)}>
                    <span>{deal.orders.length} total buyers</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} avg</span>
                    {!dealFinished && (
                      <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", T.warningBg, T.warning)}>
                        <Eye className="h-3 w-3" /> Info masked until deal finalized
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Search */}
              <div className={cn("px-5 py-3 border-b", T.border)}>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or order #..."
                    value={panelSearch}
                    onChange={(e) => { setPanelSearch(e.target.value); setPanelPage(1); }}
                    className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-[#c2703e]/20")}
                  />
                </div>
              </div>

              {/* Buyers List */}
              <div className="flex-1 overflow-y-auto">
                {paged.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className={T.muted}>No buyers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {paged.map((order) => (
                      <div key={order.id} className={cn("px-5 py-4 hover:bg-[#faf6f1]/50 transition-colors", order.status === "CANCELLED" && "opacity-50")}>
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: buyer info */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Avatar circle */}
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white", T.accentBg)}>
                              {maskName(order.customerName, dealFinished).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-semibold truncate", T.text)}>
                                  {maskName(order.customerName, dealFinished)}
                                </span>
                                <OrderStatusBadge status={order.status} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {maskEmail(order.customerEmail, dealFinished)}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <RatingStars rating={order.customerRating} />
                              </div>
                            </div>
                          </div>

                          {/* Right: order details */}
                          <div className="text-end flex-shrink-0">
                            <div className={cn("text-sm font-semibold", T.text)}>{deal.currency}{order.total.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">x{order.quantity} units</div>
                            <div className="text-xs text-muted-foreground mt-0.5">#{order.orderId}</div>
                          </div>
                        </div>

                        {/* Actions row */}
                        {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
                          <div className="flex items-center gap-1.5 mt-3 ms-13">
                            <button className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50", T.border, T.muted)}>
                              <MessageCircle className="h-3.5 w-3.5" /> Message
                            </button>
                            <button className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors", T.dangerBorder, T.danger, "hover:bg-red-50")}>
                              <XCircle className="h-3.5 w-3.5" /> Cancel & Refund
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className={cn("px-5 py-3 border-t flex items-center justify-between", T.border)}>
                  <span className={cn("text-xs", T.muted)}>
                    {(panelPage - 1) * PANEL_PAGE_SIZE + 1}–{Math.min(panelPage * PANEL_PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={panelPage <= 1}
                      onClick={() => setPanelPage((p) => p - 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPanelPage(p)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                          panelPage === p ? cn(T.accentBg, "text-white") : "hover:bg-gray-100 text-muted-foreground",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={panelPage >= totalPages}
                      onClick={() => setPanelPage((p) => p + 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Extend Time Modal (max = 1/2 of original duration) ── */}
      {showExtendModal && (() => {
        const openDate = new Date(deal.dateOpen);
        const closeDate = new Date(deal.dateClose);
        const originalDurationMs = closeDate.getTime() - openDate.getTime();
        const originalDays = Math.max(1, Math.round(originalDurationMs / 86400000));
        const maxExtendDays = Math.max(1, Math.floor(originalDays / 2));

        const safeDays = Math.min(extendDays, maxExtendDays);
        const pct = maxExtendDays > 0 ? (safeDays / maxExtendDays) * 100 : 0;
        const isNearMax = pct >= 80;

        const newDeadline = new Date(closeDate);
        newDeadline.setDate(newDeadline.getDate() + safeDays);

        // Quick-pick options (only show values within max)
        const quickPicks = [1, 3, 5, 7, 14].filter((d) => d <= maxExtendDays);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowExtendModal(false)}>
            <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn("p-2.5 rounded-xl", T.infoBg)}>
                  <CalendarPlus className={cn("h-5 w-5", T.infoText)} />
                </div>
                <div>
                  <h3 className={cn("text-lg font-semibold", T.text)}>Extend Deal Time</h3>
                  <p className={cn("text-xs", T.muted)}>Max extension: <strong>{maxExtendDays} days</strong> (half of {originalDays}-day deal)</p>
                </div>
              </div>

              {/* Timeline visualization */}
              <div className={cn("p-4 rounded-xl border mb-5", T.border, "bg-[#faf6f1]")}>
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <div className={T.muted}>Started</div>
                    <div className={cn("font-medium", T.text)}>{openDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="text-center">
                    <div className={T.muted}>Current deadline</div>
                    <div className={cn("font-medium", T.text)}>{closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="text-end">
                    <div className={cn("font-medium", T.infoText)}>New deadline</div>
                    <div className={cn("font-semibold", T.infoText)}>{newDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 start-0 bg-gray-400 rounded-full" style={{ width: "66.6%" }} />
                  <div className="absolute inset-y-0 bg-blue-500 rounded-full transition-all duration-300" style={{ left: "66.6%", width: `${(pct / 100) * 33.4}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1 text-muted-foreground">
                  <span>{originalDays} days (original)</span>
                  <span>+{safeDays} days extension</span>
                </div>
              </div>

              {/* Quick picks */}
              {quickPicks.length > 0 && (
                <div className="mb-4">
                  <label className={cn("text-xs font-medium mb-2 block", T.muted)}>Quick select</label>
                  <div className="flex items-center gap-2">
                    {quickPicks.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setExtendDays(d); setExtendInput(String(d)); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                          safeDays === d ? cn(T.accentBg, "text-white border-transparent") : cn(T.border, T.muted, "hover:bg-gray-50"),
                        )}
                      >
                        {d} {d === 1 ? "day" : "days"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom input + slider */}
              <div className="mb-5">
                <label className={cn("text-xs font-medium mb-2 block", T.muted)}>Or enter custom days</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={maxExtendDays}
                    value={extendInput || safeDays}
                    onChange={(e) => {
                      const v = e.target.value;
                      setExtendInput(v);
                      const num = parseInt(v, 10);
                      if (!isNaN(num) && num >= 1) {
                        setExtendDays(Math.min(num, maxExtendDays));
                      }
                    }}
                    className={cn(
                      "w-20 px-3 py-2 rounded-xl border text-sm text-center font-semibold",
                      T.border,
                      isNearMax ? "border-amber-300 bg-amber-50" : "",
                      "focus:outline-none focus:ring-2 focus:ring-[#c2703e]/20",
                    )}
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={maxExtendDays}
                      value={safeDays}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setExtendDays(v);
                        setExtendInput(String(v));
                      }}
                      className="w-full accent-[#c2703e] h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>1 day</span>
                      <span>{maxExtendDays} days (max)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning if near max */}
              {isNearMax && (
                <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.warningBorder, T.warningBg)}>
                  <AlertTriangle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.warning)} />
                  <p className={cn("text-xs", T.warning)}>
                    {safeDays === maxExtendDays
                      ? "You are using the maximum allowed extension. No further extensions will be possible."
                      : "Approaching the maximum extension limit."}
                  </p>
                </div>
              )}

              {/* Over max error */}
              {extendInput && parseInt(extendInput, 10) > maxExtendDays && (
                <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.dangerBorder, T.dangerBg)}>
                  <XCircle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.danger)} />
                  <p className={cn("text-xs", T.danger)}>
                    Cannot extend more than {maxExtendDays} days (half of the original {originalDays}-day deal duration).
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowExtendModal(false)} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>
                  Cancel
                </button>
                <button
                  disabled={safeDays < 1}
                  className={cn("px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40", T.accentBg, "hover:opacity-90")}
                >
                  <CalendarPlus className="h-4 w-4 inline me-1.5" />
                  Extend by {safeDays} {safeDays === 1 ? "day" : "days"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Cancel All Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCancelModal(false)}>
          <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-xl", T.dangerBg)}><AlertTriangle className={cn("h-5 w-5", T.danger)} /></div>
              <h3 className={cn("text-lg font-semibold", T.text)}>Cancel & Refund All Orders</h3>
            </div>
            <p className={cn("text-sm mb-2", T.muted)}>
              This will cancel <strong>{activeOrders.length} active orders</strong> and initiate refunds totaling <strong>{deal.currency}{revenue.toFixed(2)}</strong>.
            </p>
            <div className={cn("p-3 rounded-xl border mb-4", T.dangerBorder, T.dangerBg)}>
              <p className={cn("text-xs", T.danger)}>This action cannot be undone. All buyers will be notified automatically.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelModal(false)} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>Keep Deal</button>
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                <Ban className="h-4 w-4 inline me-1" />
                Cancel & Refund All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notify Buyers Modal ── */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNotifyModal(false)}>
          <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <h3 className={cn("text-lg font-semibold mb-4", T.text)}>Notify All Buyers</h3>
            <p className={cn("text-sm mb-3", T.muted)}>
              Send a message to all <strong>{activeOrders.length}</strong> active buyers in this deal.
            </p>
            <textarea
              className={cn("w-full p-3 rounded-xl border text-sm resize-none h-24", T.border)}
              placeholder="Type your message to all buyers..."
            />
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              Buyers will receive this as a notification and email.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNotifyModal(false)} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>Cancel</button>
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                <Send className="h-4 w-4 inline me-1" />
                Send to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEAL ANALYTICS — Timeline charts for open deals
// ═══════════════════════════════════════════════════════════════

// Generate timeline data from deal orders (mock: spreads orders across the deal window)
function generateDealTimeline(deal: BuyGroupDeal) {
  const open = new Date(deal.dateOpen).getTime();
  const close = new Date(deal.dateClose).getTime();
  const totalDays = Math.max(1, Math.round((close - open) / 86400000));
  const step = totalDays <= 14 ? 1 : totalDays <= 60 ? 3 : 7;

  const points: { date: string; customers: number; quantity: number; revenue: number; target: number }[] = [];
  let cumCustomers = 0;
  let cumQuantity = 0;
  let cumRevenue = 0;

  for (let d = 0; d <= totalDays; d += step) {
    const dayDate = new Date(open + d * 86400000);
    const dayStr = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Count orders placed on or before this day
    const ordersUpToDay = deal.orders.filter((o) => {
      const orderDate = new Date(o.createdAt).getTime();
      return orderDate <= dayDate.getTime() && !["CANCELLED", "REFUNDED"].includes(o.status);
    });

    cumCustomers = ordersUpToDay.length;
    cumQuantity = ordersUpToDay.reduce((s, o) => s + o.quantity, 0);
    cumRevenue = ordersUpToDay.reduce((s, o) => s + o.total, 0);

    points.push({
      date: dayStr,
      customers: cumCustomers,
      quantity: cumQuantity,
      revenue: Math.round(cumRevenue),
      target: deal.minCustomer,
    });
  }

  return points;
}

// Custom tooltip for charts
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

function DealAnalyticsPanel({ deals, langDir }: { deals: BuyGroupDeal[]; langDir: string }) {
  const [selectedDealId, setSelectedDealId] = useState<number | "all">("all");
  const [chartView, setChartView] = useState<"customers" | "quantity" | "revenue">("customers");

  const openDeals = deals.filter((d) => ["ACTIVE", "THRESHOLD_MET", "EXPIRED"].includes(d.status));

  // All-deals combined timeline (aggregate by date)
  const allDealsTimeline = useMemo(() => {
    if (openDeals.length === 0) return [];
    // Find the widest date range
    const allDates = openDeals.flatMap((d) => [new Date(d.dateOpen).getTime(), new Date(d.dateClose).getTime()]);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const totalDays = Math.max(1, Math.round((maxDate - minDate) / 86400000));
    const step = totalDays <= 14 ? 1 : totalDays <= 60 ? 3 : 7;

    const points: { date: string; customers: number; quantity: number; revenue: number; deals: number }[] = [];

    for (let d = 0; d <= totalDays; d += step) {
      const dayDate = new Date(minDate + d * 86400000);
      const dayStr = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      let totalCustomers = 0;
      let totalQuantity = 0;
      let totalRevenue = 0;
      let activeDealsCount = 0;

      for (const deal of openDeals) {
        const dealOpen = new Date(deal.dateOpen).getTime();
        const dealClose = new Date(deal.dateClose).getTime();
        if (dayDate.getTime() >= dealOpen && dayDate.getTime() <= dealClose) {
          activeDealsCount++;
        }
        const ordersUpToDay = deal.orders.filter((o) => {
          const orderDate = new Date(o.createdAt).getTime();
          return orderDate <= dayDate.getTime() && !["CANCELLED", "REFUNDED"].includes(o.status);
        });
        totalCustomers += ordersUpToDay.length;
        totalQuantity += ordersUpToDay.reduce((s, o) => s + o.quantity, 0);
        totalRevenue += ordersUpToDay.reduce((s, o) => s + o.total, 0);
      }

      points.push({ date: dayStr, customers: totalCustomers, quantity: totalQuantity, revenue: Math.round(totalRevenue), deals: activeDealsCount });
    }
    return points;
  }, [openDeals]);

  const selectedDeal = selectedDealId === "all" ? null : openDeals.find((d) => d.id === selectedDealId) || null;
  const timeline = selectedDeal ? generateDealTimeline(selectedDeal) : allDealsTimeline;

  const chartConfig = {
    customers: { color: "#c2703e", gradientId: "custGrad", label: "Customers" },
    quantity: { color: "#3b82f6", gradientId: "qtyGrad", label: "Units Ordered" },
    revenue: { color: "#10b981", gradientId: "revGrad", label: "Revenue" },
  };
  const cc = chartConfig[chartView];

  if (openDeals.length === 0) return null;

  return (
    <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden mb-8")}>
      {/* Header */}
      <div className={cn("px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3", T.border)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", T.accentLight)}>
            <Activity className={cn("h-5 w-5", T.accentText)} />
          </div>
          <div>
            <h3 className={cn("text-base font-semibold", T.text)}>Deal Analytics</h3>
            <p className={cn("text-xs", T.muted)}>Timeline view of open deals performance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Deal selector */}
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className={cn("px-3 py-1.5 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-[#c2703e]/20")}
          >
            <option value="all">All Open Deals ({openDeals.length})</option>
            {openDeals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.productName.length > 30 ? d.productName.slice(0, 30) + "..." : d.productName}
              </option>
            ))}
          </select>

          {/* Metric toggle */}
          <div className="flex items-center gap-1 bg-[#faf6f1] rounded-xl p-1">
            {(["customers", "quantity", "revenue"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  chartView === v ? cn(T.accentBg, "text-white") : cn(T.muted, "hover:bg-white"),
                )}
              >
                {v === "customers" ? "Customers" : v === "quantity" ? "Quantity" : "Revenue"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {/* Single deal: show target line */}
        {selectedDeal && (
          <div className={cn("flex flex-wrap items-center gap-4 mb-4 text-xs", T.muted)}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: cc.color }} />
              {cc.label}
            </span>
            {chartView === "customers" && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-red-400" />
                Min Target ({selectedDeal.minCustomer})
              </span>
            )}
            <span className="ms-auto">
              Deal: {new Date(selectedDeal.dateOpen).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(selectedDeal.dateClose).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={cc.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cc.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={cc.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#8a7560" }}
              tickLine={false}
              axisLine={{ stroke: "#e8dfd4" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8a7560" }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v) => chartView === "revenue" ? `$${v}` : String(v)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey={chartView}
              name={cc.label}
              stroke={cc.color}
              strokeWidth={2.5}
              fill={`url(#${cc.gradientId})`}
              dot={{ r: 3, fill: cc.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: cc.color, strokeWidth: 2, stroke: "#fff" }}
            />
            {/* Target line for single deal customer view */}
            {selectedDeal && chartView === "customers" && (
              <Line
                type="monotone"
                dataKey="target"
                name="Min Target"
                stroke="#f87171"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            )}
            {/* Active deals count for "all" view */}
            {!selectedDeal && (
              <Bar
                dataKey="deals"
                name="Active Deals"
                fill="#c2703e"
                opacity={0.12}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Summary row below chart */}
        {selectedDeal && (
          <div className={cn("flex items-center gap-6 mt-4 pt-4 border-t text-sm", T.border)}>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.infoBg)}>
                <Users className={cn("h-4 w-4", T.infoText)} />
              </div>
              <div>
                <div className={cn("text-xs", T.muted)}>Customers</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.currentCustomers}
                  <span className={cn("text-xs font-normal ms-1", selectedDeal.currentCustomers >= selectedDeal.minCustomer ? T.success : T.warning)}>
                    / {selectedDeal.minCustomer} min
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", "bg-blue-50")}>
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className={cn("text-xs", T.muted)}>Quantity</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.orderedQuantity}
                  <span className="text-xs font-normal text-muted-foreground ms-1">/ {selectedDeal.stock} stock</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.successBg)}>
                <DollarSign className={cn("h-4 w-4", T.success)} />
              </div>
              <div>
                <div className={cn("text-xs", T.muted)}>Revenue</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.currency}{selectedDeal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s, o) => s + o.total, 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ms-auto">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.accentLight)}>
                <Timer className={cn("h-4 w-4", T.accentText)} />
              </div>
              <div>
                <div className={cn("text-xs", T.muted)}>Time Left</div>
                <div className="font-semibold">
                  <CountdownTimer dateClose={selectedDeal.dateClose} endTime={selectedDeal.endTime} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// EXPORTED TAB COMPONENT (used inside manage-products page)
// ═══════════════════════════════════════════════════════════════

export function BuyGroupOpsTab({ langDir, t }: { langDir: string; t: any }) {
  const [statusFilter, setStatusFilter] = useState<"all" | DealStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const deals = MOCK_DEALS; // Replace with API call

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((d) => d.productName.toLowerCase().includes(term));
    }
    return result;
  }, [deals, statusFilter, searchTerm]);

  // Stats
  const activeDeals = deals.filter((d) => d.status === "ACTIVE").length;
  const thresholdMetDeals = deals.filter((d) => d.status === "THRESHOLD_MET").length;
  const expiredDeals = deals.filter((d) => d.status === "EXPIRED").length;
  const totalRevenue = deals.reduce((sum, d) => {
    const activeOrders = d.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
    return sum + activeOrders.reduce((s, o) => s + o.total, 0);
  }, 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          label="Active Deals"
          value={activeDeals}
          sub="Waiting for threshold"
          color={T.infoBg}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Ready to Accept"
          value={thresholdMetDeals}
          sub="Minimum met — action needed"
          color={T.successBg}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="Expired"
          value={expiredDeals}
          sub="Needs decision"
          color={T.warningBg}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-[#c2703e]" />}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          sub="Across all active deals"
          color={T.accentLight}
        />
      </div>

      {/* ── Filters ── */}
      <div className={cn(T.card, T.border, "border rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3")}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-[#c2703e]/20 focus:border-[#c2703e]")}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#faf6f1] rounded-xl p-1">
          {(["all", "ACTIVE", "THRESHOLD_MET", "EXPIRED", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s
                  ? cn(T.accentBg, "text-white")
                  : cn(T.muted, "hover:bg-white"),
              )}
            >
              {s === "all" ? "All" : s === "THRESHOLD_MET" ? "Ready" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Deal List ── */}
      <div className="space-y-5">
        {filteredDeals.length === 0 ? (
          <div className={cn(T.card, T.border, "border rounded-2xl p-12 text-center")}>
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className={cn("text-lg font-medium", T.muted)}>No deals found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} langDir={langDir} t={t} />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE PAGE (kept as redirect for backwards compatibility)
// ═══════════════════════════════════════════════════════════════

function BuyGroupManagementPage() {
  const router = React.useMemo(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/manage-products?tab=buygroup-ops";
    }
    return null;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Redirecting to Manage Products...</p>
    </div>
  );
}

export default withActiveUserGuard(BuyGroupManagementPage);
