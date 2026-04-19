"use client";
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Users, Package, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Timer, TrendingUp, DollarSign,
  ShieldCheck, Zap, CalendarPlus, Ban, Eye, Search, Star,
  MoreHorizontal, Bell, Send, X, ChevronLeft, ChevronRight,
  Activity, BarChart3, ShoppingBag, Wrench, Truck, Store,
  RefreshCw, Pencil, Save, RotateCcw, Minus, Plus,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Line,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   DEAL OPS — Unified Operations for ALL Deal Types
   ادارة الصفقات

   Covers: BuyGroup, Dropship, Service, Retail
   Same UX pattern: deal cards, progress, timeline, buyers panel
   ═══════════════════════════════════════════════════════════════ */

// ─── Theme ───────────────────────────────────────────────────
const T = {
  bg: "bg-background", card: "bg-card", accent: "hsl(var(--primary))",
  accentBg: "bg-primary", accentText: "text-primary",
  accentLight: "bg-primary/10", text: "text-foreground",
  muted: "text-muted-foreground", border: "border-border",
  success: "text-emerald-600 dark:text-emerald-400", successBg: "bg-emerald-50 dark:bg-emerald-950/30",
  warning: "text-amber-600 dark:text-amber-400", warningBg: "bg-amber-50 dark:bg-amber-950/30",
  danger: "text-red-600 dark:text-red-400", dangerBg: "bg-red-50 dark:bg-red-950/30",
  infoBg: "bg-blue-50 dark:bg-blue-950/30", infoText: "text-blue-600 dark:text-blue-400",
  dangerBorder: "border-red-200 dark:border-red-800", warningBorder: "border-amber-200 dark:border-amber-800",
  infoBorder: "border-blue-200 dark:border-blue-800", successBorder: "border-emerald-200 dark:border-emerald-800",
};

// ─── Deal Type Config ────────────────────────────────────────
type DealType = "ALL" | "BUYGROUP" | "DROPSHIP" | "SERVICE" | "RETAIL";
type DealStatus = "ACTIVE" | "THRESHOLD_MET" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "COMPLETED" | "PROCESSING" | "SHIPPED";

const DEAL_TYPE_CONFIG: Record<Exclude<DealType, "ALL">, { label: string; labelAr: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  BUYGROUP: { label: "BuyGroup", labelAr: "شراء جماعي", icon: <Users className="h-4 w-4" />, color: "text-primary", bgColor: "bg-primary/10" },
  DROPSHIP: { label: "Dropship", labelAr: "دروبشيبينغ", icon: <Truck className="h-4 w-4" />, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  SERVICE: { label: "Service", labelAr: "خدمات", icon: <Wrench className="h-4 w-4" />, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  RETAIL: { label: "Retail", labelAr: "تجزئة", icon: <Store className="h-4 w-4" />, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
};

// ─── Types ───────────────────────────────────────────────────
interface DealOrder {
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

interface Deal {
  id: number;
  productId?: number;
  dealType: Exclude<DealType, "ALL">;
  productName: string;
  productImage: string | null;
  price: number;
  offerPrice: number;
  currency: string;
  // BuyGroup specific
  minCustomer?: number;
  maxCustomer?: number;
  currentCustomers: number;
  // Quantity
  stock: number;
  orderedQuantity: number;
  // Time window
  dateOpen: string;
  dateClose: string;
  endTime: string;
  // Status
  status: DealStatus;
  // Dropship specific
  commission?: number;
  resellers?: number;
  // Service specific
  serviceType?: string;
  bookings?: number;
  // Orders
  orders: DealOrder[];
}

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_DEALS: Deal[] = [
  // BuyGroup deals
  {
    id: 1, dealType: "BUYGROUP", productName: "Premium Wireless Headphones - Bulk Pack", productImage: null,
    price: 89.99, offerPrice: 59.99, currency: "$", minCustomer: 10, maxCustomer: 50, currentCustomers: 7,
    stock: 200, orderedQuantity: 42, dateOpen: "2026-04-05T00:00:00Z", dateClose: "2026-04-18T23:59:00Z", endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 1, orderId: 1001, customerName: "Ahmed Salem", customerEmail: "ahmed@store.com", customerRating: 4.8, quantity: 8, total: 479.92, status: "PLACED", createdAt: "2026-04-06T10:30:00Z" },
      { id: 2, orderId: 1002, customerName: "Sarah Chen", customerEmail: "sarah@biz.com", customerRating: 4.5, quantity: 5, total: 299.95, status: "PLACED", createdAt: "2026-04-07T14:15:00Z" },
      { id: 3, orderId: 1003, customerName: "Omar Khalid", customerEmail: "omar@trade.com", customerRating: 3.9, quantity: 10, total: 599.90, status: "PLACED", createdAt: "2026-04-08T09:00:00Z" },
      { id: 4, orderId: 1004, customerName: "Maria Garcia", customerEmail: "maria@shop.com", customerRating: 4.2, quantity: 4, total: 239.96, status: "CANCELLED", createdAt: "2026-04-08T16:45:00Z" },
      { id: 5, orderId: 1005, customerName: "David Lee", customerEmail: "david@hk.com", customerRating: 3.5, quantity: 6, total: 359.94, status: "PLACED", createdAt: "2026-04-09T08:30:00Z" },
      { id: 6, orderId: 1006, customerName: "Layla Mansour", customerEmail: "layla@uae.com", customerRating: 4.7, quantity: 9, total: 539.91, status: "PLACED", createdAt: "2026-04-10T10:00:00Z" },
    ],
  },
  {
    id: 2, dealType: "BUYGROUP", productName: "Organic Coffee Beans 1kg - Group Buy", productImage: null,
    price: 24.99, offerPrice: 17.99, currency: "$", minCustomer: 20, maxCustomer: 100, currentCustomers: 23,
    stock: 500, orderedQuantity: 340, dateOpen: "2026-04-01T00:00:00Z", dateClose: "2026-04-12T23:59:00Z", endTime: "23:59",
    status: "THRESHOLD_MET",
    orders: [
      { id: 10, orderId: 2001, customerName: "Buyer 1", customerEmail: "b1@test.com", customerRating: 4.3, quantity: 15, total: 269.85, status: "PLACED", createdAt: "2026-04-02T10:00:00Z" },
      { id: 11, orderId: 2002, customerName: "Buyer 2", customerEmail: "b2@test.com", customerRating: 4.7, quantity: 20, total: 359.80, status: "PLACED", createdAt: "2026-04-04T10:00:00Z" },
    ],
  },

  // Dropship deals
  {
    id: 10, dealType: "DROPSHIP", productName: "Smart Watch Ultra Pro — Dropship", productImage: null,
    price: 199.99, offerPrice: 149.99, currency: "$", currentCustomers: 5, commission: 15,
    stock: 500, orderedQuantity: 87, resellers: 12,
    dateOpen: "2026-03-01T00:00:00Z", dateClose: "2026-06-30T23:59:00Z", endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 20, orderId: 3001, customerName: "Reseller Alpha", customerEmail: "alpha@resell.com", customerRating: 4.6, quantity: 20, total: 2999.80, status: "CONFIRMED", createdAt: "2026-03-10T08:00:00Z" },
      { id: 21, orderId: 3002, customerName: "Reseller Beta", customerEmail: "beta@resell.com", customerRating: 4.2, quantity: 15, total: 2249.85, status: "SHIPPED", createdAt: "2026-03-15T12:00:00Z" },
      { id: 22, orderId: 3003, customerName: "Reseller Gamma", customerEmail: "gamma@resell.com", customerRating: 3.8, quantity: 30, total: 4499.70, status: "CONFIRMED", createdAt: "2026-03-22T09:30:00Z" },
      { id: 23, orderId: 3004, customerName: "Reseller Delta", customerEmail: "delta@sell.io", customerRating: 4.9, quantity: 22, total: 3299.78, status: "PLACED", createdAt: "2026-04-05T14:00:00Z" },
    ],
  },
  {
    id: 11, dealType: "DROPSHIP", productName: "Wireless Earbuds Pro — Wholesale", productImage: null,
    price: 49.99, offerPrice: 34.99, currency: "$", currentCustomers: 8, commission: 12,
    stock: 1000, orderedQuantity: 420, resellers: 8,
    dateOpen: "2026-02-15T00:00:00Z", dateClose: "2026-05-15T23:59:00Z", endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 30, orderId: 4001, customerName: "Shop Express", customerEmail: "shop@express.com", customerRating: 4.4, quantity: 100, total: 3499.00, status: "DELIVERED", createdAt: "2026-02-20T10:00:00Z" },
      { id: 31, orderId: 4002, customerName: "MegaStore", customerEmail: "mega@store.com", customerRating: 4.8, quantity: 200, total: 6998.00, status: "SHIPPED", createdAt: "2026-03-10T10:00:00Z" },
    ],
  },

  // Service deals
  {
    id: 20, dealType: "SERVICE", productName: "Professional Photography — Wedding Package", productImage: null,
    price: 500, offerPrice: 399, currency: "$", currentCustomers: 3, serviceType: "BOOKING",
    stock: 20, orderedQuantity: 3, bookings: 3,
    dateOpen: "2026-04-01T00:00:00Z", dateClose: "2026-12-31T23:59:00Z", endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 40, orderId: 5001, customerName: "Nora Al-Sayed", customerEmail: "nora@mail.com", customerRating: 5.0, quantity: 1, total: 399, status: "CONFIRMED", createdAt: "2026-04-05T10:00:00Z" },
      { id: 41, orderId: 5002, customerName: "Liam Park", customerEmail: "liam@mail.com", customerRating: 4.3, quantity: 1, total: 399, status: "PLACED", createdAt: "2026-04-08T14:30:00Z" },
      { id: 42, orderId: 5003, customerName: "Zara Khan", customerEmail: "zara@mail.com", customerRating: 4.7, quantity: 1, total: 399, status: "PLACED", createdAt: "2026-04-10T09:00:00Z" },
    ],
  },

  // Retail deals
  {
    id: 30, dealType: "RETAIL", productName: "Bamboo Desk Organizer Set", productImage: null,
    price: 35, offerPrice: 28, currency: "$", currentCustomers: 18,
    stock: 100, orderedQuantity: 45,
    dateOpen: "2026-04-01T00:00:00Z", dateClose: "2026-04-30T23:59:00Z", endTime: "23:59",
    status: "ACTIVE",
    orders: [
      { id: 50, orderId: 6001, customerName: "Customer A", customerEmail: "a@test.com", customerRating: 4.1, quantity: 2, total: 56, status: "DELIVERED", createdAt: "2026-04-02T10:00:00Z" },
      { id: 51, orderId: 6002, customerName: "Customer B", customerEmail: "b@test.com", customerRating: 4.5, quantity: 3, total: 84, status: "SHIPPED", createdAt: "2026-04-05T10:00:00Z" },
      { id: 52, orderId: 6003, customerName: "Customer C", customerEmail: "c@test.com", customerRating: 3.9, quantity: 1, total: 28, status: "PLACED", createdAt: "2026-04-08T10:00:00Z" },
      { id: 53, orderId: 6004, customerName: "Customer D", customerEmail: "d@test.com", customerRating: 4.8, quantity: 5, total: 140, status: "CONFIRMED", createdAt: "2026-04-09T10:00:00Z" },
    ],
  },
  {
    id: 31, dealType: "RETAIL", productName: "Stainless Steel Water Bottle x6", productImage: null,
    price: 12.50, offerPrice: 8.99, currency: "$", currentCustomers: 42,
    stock: 300, orderedQuantity: 300,
    dateOpen: "2026-03-15T00:00:00Z", dateClose: "2026-04-05T23:59:00Z", endTime: "23:59",
    status: "COMPLETED",
    orders: [],
  },
];

// ─── Helpers ─────────────────────────────────────────────────

function maskName(name: string, show: boolean): string {
  if (show) return name;
  return name.split(" ").map((p) => (p.length <= 2 ? p : p.slice(0, 2) + "****")).join(" ");
}

function maskEmail(email: string, show: boolean): string {
  if (show) return email;
  const [local, domain] = email.split("@");
  if (!domain) return "****@****.***";
  return (local.length <= 2 ? local : local.slice(0, 2) + "****") + "@" + domain.slice(0, 1) + "****.***";
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3 w-3", i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </span>
  );
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full overflow-hidden h-2.5">
      <div className={cn("rounded-full transition-all duration-500 h-2.5", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: T.infoBg, text: T.infoText, label: t("active") },
    THRESHOLD_MET: { bg: T.successBg, text: T.success, label: t("threshold_met") },
    CONFIRMED: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", label: t("confirmed") },
    PROCESSING: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", label: t("processing") },
    SHIPPED: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", label: t("shipped") },
    EXPIRED: { bg: T.warningBg, text: T.warning, label: t("expired") },
    CANCELLED: { bg: T.dangerBg, text: T.danger, label: t("cancelled") },
    COMPLETED: { bg: T.successBg, text: "text-emerald-700 dark:text-emerald-300", label: t("completed") },
    PLACED: { bg: T.infoBg, text: T.infoText, label: t("placed") },
    DELIVERED: { bg: T.successBg, text: T.success, label: t("delivered") },
    REFUNDED: { bg: T.dangerBg, text: T.danger, label: t("refunded") },
  };
  const c = config[status] || config.ACTIVE;
  return <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>{c.label}</span>;
}

function DealTypeBadge({ type }: { type: Exclude<DealType, "ALL"> }) {
  const c = DEAL_TYPE_CONFIG[type];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", c.bgColor, c.color)}>
      {c.icon} {c.label}
    </span>
  );
}

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

function generateDealTimeline(deal: Deal) {
  const sorted = [...deal.orders].filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let cumCustomers = 0, cumQty = 0;
  return sorted.map((order) => {
    cumCustomers++;
    cumQty += order.quantity;
    const d = new Date(order.createdAt);
    return {
      label: `#${order.orderId}`,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      customers: cumCustomers,
      quantity: cumQty,
      target: deal.minCustomer || 0,
    };
  });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(T.card, "rounded-xl p-3 shadow-lg border text-xs", T.border)}>
      <p className={cn("font-semibold mb-1", T.text)}>{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className={T.muted}>{e.name}:</span>
          <span className={cn("font-semibold", T.text)}>{e.value}</span>
        </div>
      ))}
    </div>
  );
}

function CountdownTimer({ dateClose, endTime }: { dateClose: string; endTime: string }) {
  const t = useTranslations();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
  const end = new Date(dateClose);
  if (endTime) { const [h, m] = endTime.split(":").map(Number); end.setHours(h || 23, m || 59); }
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return <span className={T.danger}>{t("expired")}</span>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return <span className={cn(days <= 1 ? T.warning : T.muted)}>{days}d {hours}h</span>;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return <span className={cn(hours <= 2 ? T.danger : T.warning)}>{hours}h {minutes}m</span>;
}

// ─── Deal Card ───────────────────────────────────────────────

function DealCard({ deal, langDir }: { deal: Deal; langDir: string }) {
  const t = useTranslations();
  const [showPanel, setShowPanel] = useState(false);
  const [panelSearch, setPanelSearch] = useState("");
  const [panelPage, setPanelPage] = useState(1);
  const PAGE_SIZE = 8;

  // Quick edit state
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [editStock, setEditStock] = useState(deal.stock);
  const [editPrice, setEditPrice] = useState(deal.offerPrice);
  const [editDeliveryAfter, setEditDeliveryAfter] = useState(0);
  const [editCondition, setEditCondition] = useState("New");
  const [editConsumerType, setEditConsumerType] = useState("Consumer");
  const [editSellType, setEditSellType] = useState(deal.dealType === "BUYGROUP" ? "Buy Group" : deal.dealType === "DROPSHIP" ? "Wholesale" : "Normal Sell");
  const [editConsumerDiscount, setEditConsumerDiscount] = useState(0);
  const [editDiscountType, setEditDiscountType] = useState("PERCENTAGE");
  const [editManageStock, setEditManageStock] = useState(true);
  const [editManagePrice, setEditManagePrice] = useState(true);
  const [editTimeOpen, setEditTimeOpen] = useState(0);
  const [editTimeClose, setEditTimeClose] = useState(0);

  const resetEdit = () => {
    setEditStock(deal.stock);
    setEditPrice(deal.offerPrice);
    setEditDeliveryAfter(0);
    setEditCondition("New");
    setEditConsumerDiscount(0);
    setEditTimeOpen(0);
    setEditTimeClose(0);
  };

  const activeOrders = deal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const cancelledOrders = deal.orders.filter((o) => ["CANCELLED", "REFUNDED"].includes(o.status));
  const revenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const isDealDone = ["COMPLETED", "CANCELLED"].includes(deal.status);
  const dealFinished = ["COMPLETED", "CONFIRMED"].includes(deal.status);
  const isBuyGroup = deal.dealType === "BUYGROUP";
  const customerPct = isBuyGroup && deal.minCustomer ? Math.round((deal.currentCustomers / deal.minCustomer) * 100) : 0;
  const quantityPct = deal.stock > 0 ? Math.round((deal.orderedQuantity / deal.stock) * 100) : 0;
  const typeConfig = DEAL_TYPE_CONFIG[deal.dealType];

  const tl = deal.orders.length > 0 ? generateDealTimeline(deal) : [];

  return (
    <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden transition-shadow hover:shadow-md")}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn("w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center", typeConfig.bgColor)}>
              {deal.productImage ? (
                <img src={deal.productImage} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className={typeConfig.color}>{React.cloneElement(typeConfig.icon as React.ReactElement<any>, { className: "h-7 w-7" })}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`/product-view/${deal.productId || deal.id}`} className={cn("text-lg font-semibold truncate hover:underline", T.accentText)}>{deal.productName}</a>
                <DealTypeBadge type={deal.dealType} />
                <StatusBadge status={deal.status} />
              </div>
              <div className={cn("flex items-center gap-4 mt-1.5 text-sm flex-wrap", T.muted)}>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="line-through">{deal.currency}{deal.price}</span>
                  <span className={cn("font-semibold", T.accentText)}>{deal.currency}{deal.offerPrice}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {deal.currentCustomers} {isBuyGroup && deal.minCustomer ? `/ ${deal.minCustomer} ${t("min").toLowerCase()}` : t("customers").toLowerCase()}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {deal.orderedQuantity}/{deal.stock} {t("units")}
                </span>
                {deal.dealType === "DROPSHIP" && deal.commission && (
                  <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{deal.commission}% {t("commission").toLowerCase()}</span>
                )}
                {deal.dealType === "DROPSHIP" && deal.resellers && (
                  <span className="flex items-center gap-1"><Store className="h-3.5 w-3.5" />{deal.resellers} {t("resellers")}</span>
                )}
                {deal.dealType === "SERVICE" && deal.serviceType && (
                  <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" />{deal.serviceType}</span>
                )}
                {!isDealDone && (
                  <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /><CountdownTimer dateClose={deal.dateClose} endTime={deal.endTime} /></span>
                )}
              </div>
            </div>
          </div>
          {/* Accept button for threshold-met buygroups */}
          {deal.status === "THRESHOLD_MET" && (
            <button className={cn("px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground", T.accentBg, "hover:opacity-90")}>
              <CheckCircle2 className="h-4 w-4 inline-block me-1.5" /> {t("accept_deal")}
            </button>
          )}
        </div>

        {/* Progress Bars */}
        <div className={cn("grid gap-6 mt-5", isBuyGroup ? "grid-cols-2" : "grid-cols-1")}>
          {isBuyGroup && deal.minCustomer && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={T.muted}>{t("customers")} ({deal.currentCustomers}/{deal.minCustomer} {t("min").toLowerCase()})</span>
                <span className={cn("font-semibold", customerPct >= 100 ? T.success : T.accentText)}>{customerPct}%</span>
              </div>
              <ProgressBar value={deal.currentCustomers} max={deal.minCustomer} color={customerPct >= 100 ? "bg-emerald-500" : "bg-primary"} />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={T.muted}>{deal.dealType === "SERVICE" ? t("bookings") : t("quantity")} ({deal.orderedQuantity}/{deal.stock})</span>
              <span className={cn("font-semibold", quantityPct >= 100 ? T.success : T.infoText)}>{quantityPct}%</span>
            </div>
            <ProgressBar value={deal.orderedQuantity} max={deal.stock} color={quantityPct >= 100 ? "bg-emerald-500" : "bg-blue-500"} />
          </div>
        </div>

        {/* Mini Timeline */}
        {tl.length > 1 && (
          <div className={cn("mt-4 pt-4 border-t", T.border)}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn("text-xs font-medium", T.muted)}>{t("order_timeline")}</span>
              <span className={cn("text-xs", T.muted)}>{t("revenue")}: <span className={cn("font-semibold", T.text)}>{deal.currency}{revenue.toFixed(2)}</span></span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={tl} margin={{ top: 2, right: 4, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id={`mg-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="customers" name={t("customers")} stroke={T.accent} strokeWidth={2} fill={`url(#mg-${deal.id})`} dot={{ r: 2, fill: T.accent, strokeWidth: 0 }} />
                {isBuyGroup && <Line type="monotone" dataKey="target" name={t("min_target")} stroke="#f87171" strokeWidth={1} strokeDasharray="4 3" dot={false} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Action Buttons */}
        <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t", T.border)}>
          <button onClick={() => { setShowPanel(true); setPanelPage(1); setPanelSearch(""); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-colors", T.border, T.accentText, "hover:bg-primary/5")}>
            <Users className="h-4 w-4" /> {t("view")} {deal.dealType === "DROPSHIP" ? t("resellers") : deal.dealType === "SERVICE" ? t("bookings") : t("buyers")} ({deal.orders.length})
          </button>
          <a href={`/manage-products/deal-analysis?id=${deal.id}`}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm text-primary-foreground transition-colors", T.accentBg, "hover:opacity-90")}>
            <BarChart3 className="h-4 w-4" /> {t("full_analysis")}
          </a>
          <button onClick={() => { setShowQuickEdit(!showQuickEdit); if (!showQuickEdit) resetEdit(); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-colors",
              showQuickEdit ? cn(T.accentBg, "text-primary-foreground border-transparent") : cn(T.border, T.muted, "hover:bg-muted"))}>
            <Pencil className="h-4 w-4" /> {showQuickEdit ? t("close_edit") : t("edit_product")}
          </button>
          {isDealDone && (
            <a href="/orders"
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-colors ms-auto", T.border, T.success, "hover:bg-emerald-50 dark:hover:bg-emerald-950/30")}>
              <ShoppingBag className="h-4 w-4" /> {t("view_in_orders")}
            </a>
          )}
        </div>
      </div>

      {/* ── Quick Edit Panel (inline, below card) ── */}
      {showQuickEdit && (
        <div className={cn("border-t px-6 py-5", T.border, "bg-muted/50")}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">

            {/* Stock */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("stock")}</label>
              <div className="flex items-center gap-0">
                <label className="flex items-center gap-1.5 mb-1.5">
                  <input type="checkbox" checked={editManageStock} onChange={(e) => setEditManageStock(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-[10px] text-muted-foreground">{t("manage_stock")}</span>
                </label>
              </div>
              <div className="flex items-center">
                <button onClick={() => setEditStock(Math.max(0, editStock - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editStock} onChange={(e) => setEditStock(Number(e.target.value))}
                  className={cn("w-16 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditStock(editStock + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("price")}</label>
              <div className="flex items-center gap-0">
                <label className="flex items-center gap-1.5 mb-1.5">
                  <input type="checkbox" checked={editManagePrice} onChange={(e) => setEditManagePrice(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-[10px] text-muted-foreground">{t("manage_price")}</span>
                </label>
              </div>
              <div className="flex items-center">
                <button onClick={() => setEditPrice(Math.max(0, editPrice - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))}
                  className={cn("w-16 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditPrice(editPrice + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Product Condition */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("product_condition")}</label>
              <select value={editCondition} onChange={(e) => setEditCondition(e.target.value)}
                className={cn("w-full h-9 px-2 rounded-lg border text-sm mt-[22px]", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}>
                <option value="New">{t("new")}</option>
                <option value="Used">{t("used")}</option>
                <option value="Refurbished">{t("refurbished")}</option>
              </select>
            </div>

            {/* Deliver After */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("deliver_after")}</label>
              <div className="flex items-center mt-[22px]">
                <button onClick={() => setEditDeliveryAfter(Math.max(0, editDeliveryAfter - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editDeliveryAfter} onChange={(e) => setEditDeliveryAfter(Number(e.target.value))}
                  className={cn("w-14 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditDeliveryAfter(editDeliveryAfter + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Time Open */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("time_open")}</label>
              <div className="flex items-center mt-[22px]">
                <button onClick={() => setEditTimeOpen(Math.max(0, editTimeOpen - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editTimeOpen} onChange={(e) => setEditTimeOpen(Number(e.target.value))}
                  className={cn("w-14 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditTimeOpen(editTimeOpen + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Time Close */}
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("time_close")}</label>
              <div className="flex items-center mt-[22px]">
                <button onClick={() => setEditTimeClose(Math.max(0, editTimeClose - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editTimeClose} onChange={(e) => setEditTimeClose(Number(e.target.value))}
                  className={cn("w-14 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditTimeClose(editTimeClose + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Consumer Type, Sell Type, Discount */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("consumer_type")}</label>
              <select value={editConsumerType} onChange={(e) => setEditConsumerType(e.target.value)}
                className={cn("w-full h-9 px-2 rounded-lg border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}>
                <option value="Consumer">{t("consumer")}</option>
                <option value="Vendor">{t("vendor")}</option>
                <option value="Everyone">{t("everyone")}</option>
              </select>
            </div>
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("sell_type")}</label>
              <select value={editSellType} onChange={(e) => setEditSellType(e.target.value)}
                className={cn("w-full h-9 px-2 rounded-lg border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}>
                <option value="Normal Sell">{t("normal_sell")}</option>
                <option value="Buy Group">{t("buy_group")}</option>
                <option value="Wholesale">{t("wholesale")}</option>
              </select>
            </div>
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("consumer_discount")}</label>
              <div className="flex items-center">
                <button onClick={() => setEditConsumerDiscount(Math.max(0, editConsumerDiscount - 1))}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-s-lg text-sm", T.border, "hover:bg-muted")}>
                  <Minus className="h-3 w-3" />
                </button>
                <input type="number" value={editConsumerDiscount} onChange={(e) => setEditConsumerDiscount(Number(e.target.value))}
                  className={cn("w-14 h-9 text-center border-y text-sm font-medium", T.border, "focus:outline-none")} />
                <button onClick={() => setEditConsumerDiscount(editConsumerDiscount + 1)}
                  className={cn("w-8 h-9 flex items-center justify-center border rounded-e-lg text-sm", T.border, "hover:bg-muted")}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", T.text)}>{t("discount_type")}</label>
              <select value={editDiscountType} onChange={(e) => setEditDiscountType(e.target.value)}
                className={cn("w-full h-9 px-2 rounded-lg border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}>
                <option value="PERCENTAGE">{t("percentage")}</option>
                <option value="FIXED">{t("fixed")}</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
              <Pencil className="h-4 w-4" /> {t("edit")}
            </button>
            <button className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 transition-colors">
              <Save className="h-4 w-4" /> {t("update")}
            </button>
            <button onClick={resetEdit}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600 transition-colors">
              <RotateCcw className="h-4 w-4" /> {t("reset")}
            </button>
          </div>
        </div>
      )}

      {/* ── Buyers Slide-Over Panel ── */}
      {showPanel && (() => {
        const filtered = deal.orders.filter((o) => {
          if (!panelSearch) return true;
          const term = panelSearch.toLowerCase();
          const name = dealFinished ? o.customerName.toLowerCase() : maskName(o.customerName, false).toLowerCase();
          return name.includes(term) || String(o.orderId).includes(term);
        });
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        const paged = filtered.slice((panelPage - 1) * PAGE_SIZE, panelPage * PAGE_SIZE);

        return (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowPanel(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className={cn(T.card, "relative w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200")} onClick={(e) => e.stopPropagation()}>
              <div className={cn("p-5 border-b flex items-start justify-between", T.border)}>
                <div>
                  <h3 className={cn("text-lg font-semibold", T.text)}>{deal.dealType === "DROPSHIP" ? t("resellers") : deal.dealType === "SERVICE" ? t("bookings") : t("buyers")}</h3>
                  <p className={cn("text-xs mt-0.5", T.muted)}>{deal.productName}</p>
                  {!dealFinished && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full mt-1 inline-block", T.warningBg, T.warning)}>
                      <Eye className="h-3 w-3 inline me-1" /> {t("info_masked_until_finalized")}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5 text-muted-foreground cursor-pointer" /></button>
              </div>
              <div className={cn("px-5 py-3 border-b", T.border)}>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder={t("search") + "..."} value={panelSearch}
                    onChange={(e) => { setPanelSearch(e.target.value); setPanelPage(1); }}
                    className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {paged.length === 0 ? (
                  <div className="p-8 text-center"><Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" /><p className={T.muted}>{t("no_results")}</p></div>
                ) : (
                  <div className="divide-y divide-border">
                    {paged.map((order) => (
                      <a key={order.id} href={`/orders/${order.orderId}`}
                        className={cn("block px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer", order.status === "CANCELLED" && "opacity-50")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary-foreground", T.accentBg)}>
                              {maskName(order.customerName, dealFinished).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-semibold truncate", T.text)}>{maskName(order.customerName, dealFinished)}</span>
                                <StatusBadge status={order.status} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{maskEmail(order.customerEmail, dealFinished)}</div>
                              <RatingStars rating={order.customerRating} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-end">
                              <div className={cn("text-sm font-semibold", T.text)}>{deal.currency}{order.total.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">x{order.quantity}</div>
                              <div className={cn("text-xs font-medium", T.accentText)}>#{order.orderId}</div>
                            </div>
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors", T.accentLight, T.accentText, "hover:bg-primary/20")}>
                              <Eye className="h-3.5 w-3.5" />
                              {t("view_order")}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {totalPages > 1 && (
                <div className={cn("px-5 py-3 border-t flex items-center justify-between", T.border)}>
                  <span className={cn("text-xs", T.muted)}>{(panelPage - 1) * PAGE_SIZE + 1}–{Math.min(panelPage * PAGE_SIZE, filtered.length)} {t("of")} {filtered.length}</span>
                  <div className="flex items-center gap-1">
                    <button disabled={panelPage <= 1} onClick={() => setPanelPage((p) => p - 1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPanelPage(p)}
                        className={cn("w-7 h-7 rounded-lg text-xs font-medium", panelPage === p ? cn(T.accentBg, "text-primary-foreground") : "hover:bg-muted text-muted-foreground")}>{p}</button>
                    ))}
                    <button disabled={panelPage >= totalPages} onClick={() => setPanelPage((p) => p + 1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED TAB COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DealOpsTab({ langDir, t: _tProp }: { langDir: string; t?: any }) {
  const t = useTranslations();
  const [dealTypeFilter, setDealTypeFilter] = useState<DealType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | DealStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "revenue" | "customers" | "ending-soon">("newest");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "quarter">("all");

  const deals = MOCK_DEALS; // Replace with API call

  const filteredDeals = useMemo(() => {
    let result = deals;

    // Type filter
    if (dealTypeFilter !== "ALL") result = result.filter((d) => d.dealType === dealTypeFilter);

    // Status filter
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((d) => d.productName.toLowerCase().includes(term));
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === "today") cutoff.setDate(now.getDate() - 1);
      else if (dateRange === "week") cutoff.setDate(now.getDate() - 7);
      else if (dateRange === "month") cutoff.setMonth(now.getMonth() - 1);
      else if (dateRange === "quarter") cutoff.setMonth(now.getMonth() - 3);
      result = result.filter((d) => new Date(d.dateOpen) >= cutoff);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.dateOpen).getTime() - new Date(b.dateOpen).getTime();
      if (sortBy === "revenue") {
        const ra = a.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s, o) => s + o.total, 0);
        const rb = b.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s, o) => s + o.total, 0);
        return rb - ra;
      }
      if (sortBy === "customers") return b.currentCustomers - a.currentCustomers;
      if (sortBy === "ending-soon") return new Date(a.dateClose).getTime() - new Date(b.dateClose).getTime();
      return new Date(b.dateOpen).getTime() - new Date(a.dateOpen).getTime(); // newest
    });

    return result;
  }, [deals, dealTypeFilter, statusFilter, searchTerm, sortBy, dateRange]);

  // Stats per type
  const countByType = (type: DealType) => type === "ALL" ? deals.length : deals.filter((d) => d.dealType === type).length;
  const activeCount = deals.filter((d) => ["ACTIVE", "THRESHOLD_MET"].includes(d.status)).length;
  const totalRevenue = deals.reduce((s, d) => s + d.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s2, o) => s2 + o.total, 0), 0);

  const hasActiveFilters = dealTypeFilter !== "ALL" || statusFilter !== "all" || searchTerm || dateRange !== "all" || sortBy !== "newest";

  const clearAllFilters = () => {
    setDealTypeFilter("ALL");
    setStatusFilter("all");
    setSearchTerm("");
    setSortBy("newest");
    setDateRange("all");
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <StatCard icon={<Activity className="h-5 w-5 text-primary" />} label={t("total_deals")} value={deals.length} sub={`${activeCount} ${t("active").toLowerCase()}`} color={T.accentLight} />
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label={t("buygroup")} value={countByType("BUYGROUP")} color={T.accentLight} />
        <StatCard icon={<Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />} label={t("dropship")} value={countByType("DROPSHIP")} sub={`${deals.filter((d) => d.dealType === "DROPSHIP").reduce((s, d) => s + (d.resellers || 0), 0)} ${t("resellers")}`} color={T.infoBg} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />} label={t("total_revenue")} value={`$${totalRevenue.toFixed(0)}`} color={T.successBg} />
      </div>

      {/* ── Top Bar: Type tabs + Filters + Sort ── */}
      <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden mb-6")}>

        {/* Row 1: Deal type tabs */}
        <div className={cn("px-4 pt-4 pb-3 flex items-center gap-2 flex-wrap border-b", T.border)}>
          {(["ALL", "BUYGROUP", "DROPSHIP", "SERVICE", "RETAIL"] as DealType[]).map((type) => {
            const isAll = type === "ALL";
            const config = isAll ? null : DEAL_TYPE_CONFIG[type];
            const count = countByType(type);
            return (
              <button key={type} onClick={() => setDealTypeFilter(type)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                  dealTypeFilter === type
                    ? cn(T.accentBg, "text-primary-foreground border-transparent")
                    : cn(T.border, T.muted, "hover:bg-muted"),
                )}>
                {isAll ? <BarChart3 className="h-4 w-4" /> : config!.icon}
                {isAll ? t("all") : t(type.toLowerCase() as any)}
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full",
                  dealTypeFilter === type ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Search + Status + Date Range + Sort */}
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder={t("search_deals")} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")} />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(["all", "ACTIVE", "THRESHOLD_MET", "COMPLETED", "EXPIRED", "CANCELLED"] as const).map((s) => {
              const labelMap: Record<typeof s, string> = {
                all: t("all"),
                ACTIVE: t("active"),
                THRESHOLD_MET: t("ready"),
                COMPLETED: t("completed"),
                EXPIRED: t("expired"),
                CANCELLED: t("cancelled"),
              };
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    statusFilter === s ? cn(T.accentBg, "text-primary-foreground") : cn(T.muted, "hover:bg-card"))}>
                  {labelMap[s]}
                </button>
              );
            })}
          </div>

          {/* Date range dropdown */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className={cn("px-3 py-2 rounded-xl border text-sm", T.border, dateRange !== "all" && "border-primary bg-primary/5", "focus:outline-none focus:ring-2 focus:ring-primary/20")}
          >
            <option value="all">{t("all_time")}</option>
            <option value="today">{t("today")}</option>
            <option value="week">{t("this_week")}</option>
            <option value="month">{t("this_month")}</option>
            <option value="quarter">{t("this_quarter")}</option>
          </select>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={cn("px-3 py-2 rounded-xl border text-sm", T.border, sortBy !== "newest" && "border-primary bg-primary/5", "focus:outline-none focus:ring-2 focus:ring-primary/20")}
          >
            <option value="newest">{t("newest_first")}</option>
            <option value="oldest">{t("oldest_first")}</option>
            <option value="revenue">{t("highest_revenue")}</option>
            <option value="customers">{t("most_customers")}</option>
            <option value="ending-soon">{t("ending_soon")}</option>
          </select>

          {/* Clear all */}
          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className={cn("inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors", T.danger, "hover:bg-red-50 dark:hover:bg-red-950/30")}>
              <XCircle className="h-3.5 w-3.5" />
              {t("clear")}
            </button>
          )}
        </div>

        {/* Row 3: Results count bar */}
        <div className={cn("px-4 py-2 bg-muted/50 flex items-center justify-between text-xs", T.muted)}>
          <span>
            {t("showing")} <span className={cn("font-semibold", T.text)}>{filteredDeals.length}</span> {t("of")} {deals.length} {t("deals").toLowerCase()}
            {dealTypeFilter !== "ALL" && <span> {t("in")} <span className="font-medium">{t(dealTypeFilter.toLowerCase() as any)}</span></span>}
          </span>
          {hasActiveFilters && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t("filters_active")}
            </span>
          )}
        </div>
      </div>

      {/* Deal List */}
      <div className="space-y-5">
        {filteredDeals.length === 0 ? (
          <div className={cn(T.card, T.border, "border rounded-2xl p-12 text-center")}>
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className={cn("text-lg font-medium", T.muted)}>{t("no_deals_found")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("try_adjusting_filters")}</p>
          </div>
        ) : (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} langDir={langDir} />)
        )}
      </div>
    </div>
  );
}
