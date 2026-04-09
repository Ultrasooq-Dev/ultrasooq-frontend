"use client";
import React, { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Download,
  HelpCircle,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  ArrowLeft,
  FileText,
  RotateCcw,
  Copy,
  PackageCheck,
  MessageCircle,
  Send,
  Zap,
  ChevronDown,
  Star,
  ExternalLink,
} from "lucide-react";
import { useOrderById, useConfirmReceipt, usePickupCode } from "@/apis/queries/orders.queries";
import { useParams, useRouter } from "next/navigation";
import ConfirmReceiptButton from "@/components/modules/delivery/ConfirmReceiptButton";
import PickupCodeDisplay from "@/components/modules/delivery/PickupCodeDisplay";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { convertDate, convertTime } from "@/utils/helper";
import { cn } from "@/lib/utils";
import { formattedDate } from "@/utils/constants";

/* ═══════════════════════════════════════════════════════════════════
   ORDER DETAIL PAGE — Inspired by reference design:
   ┌─────────────────────────────────────────────────┐
   │ Breadcrumb                                       │
   │ ┌──Delivery──┐ ┌──Billing──┐ ┌──Actions──┐      │
   │ │ address    │ │ address   │ │ invoice   │      │
   │ └────────────┘ └───────────┘ └───────────┘      │
   │ ┌─ Product ──────── Timeline ─── Date ──┐       │
   │ │ [img] Name    ●──●──●──●──●   Apr 9   │       │
   │ │       Seller  Placed Confirmed...      │       │
   │ │       $130                   Need Help │       │
   │ └───────────────────────────────────────┘       │
   │ ┌─ Chat with Seller ───────────────────┐       │
   │ │  [messages]                           │       │
   │ │  [auto text] [stage] [confirm]        │       │
   │ │  [input] [send]                       │       │
   │ └──────────────────────────────────────┘       │
   └─────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════════ */

// ─── Status config ──────────────────────────────────────────────
const STEPS = [
  { key: "PLACED", label: "Order Received" },
  { key: "CONFIRMED", label: "Order Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OFD", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

function stepIndex(status: string): number {
  if (status === "CANCELLED") return -1;
  const map: Record<string, number> = { PLACED: 0, CONFIRMED: 1, SHIPPED: 2, OFD: 3, DELIVERED: 4 };
  return map[status] ?? 0;
}

// ─── Horizontal Timeline ────────────────────────────────────────
function OrderTimeline({
  status,
  dates,
}: {
  status: string;
  dates: Record<string, string>;
}) {
  const activeIdx = stepIndex(status);
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const isActive = activeIdx >= i;
        const isCurrent = activeIdx === i;
        const dateKey = step.key.toLowerCase();
        const dateStr = dates[dateKey] || dates[step.key] || "";

        return (
          <div key={step.key} className="flex items-start" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
            {/* Step */}
            <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  isActive
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-card text-muted-foreground",
                  isCurrent && "ring-4 ring-emerald-500/20",
                )}
              >
                {isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[9px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-center text-[10px] font-medium leading-tight",
                  isActive ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {dateStr && (
                <span className="mt-0.5 text-[9px] text-muted-foreground">
                  {new Date(dateStr).toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="mt-3 flex-1 px-1">
                <div
                  className={cn(
                    "h-[2px] w-full rounded-full transition-colors",
                    activeIdx > i ? "bg-emerald-500" : "bg-border",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Address Card ───────────────────────────────────────────────
function AddressCard({
  title,
  icon: Icon,
  iconColor,
  name,
  address,
  phone,
  pin,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  name: string;
  address: string;
  phone: string;
  pin?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className={cn("h-4 w-4", iconColor)} />
        {title}
      </h3>
      <div className="space-y-1.5 text-sm">
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground leading-relaxed">{address}</p>
        {pin && <p className="text-muted-foreground">Pin: {pin}</p>}
        {phone && (
          <p className="flex items-center gap-1.5 pt-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {phone}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Chat + Order Actions ───────────────────────────────────────
function ChatSection({
  sellerName,
  langDir,
  status,
  orderId,
}: {
  sellerName: string;
  langDir: string;
  status: string;
  orderId: string;
}) {
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showConfirmMenu, setShowConfirmMenu] = useState(false);

  // Saved message templates (vendor-pinned)
  const templates = [
    "Your order has been shipped. Tracking will be updated shortly.",
    "Your package is out for delivery today.",
    "Thank you for your order! We're preparing it now.",
    "Your item has been handed to the courier.",
    "Please confirm receipt once you've received the product.",
  ];

  const stages = [
    { key: "CONFIRMED", label: "Mark as Confirmed", icon: CheckCircle2, color: "text-blue-600" },
    { key: "SHIPPED", label: "Mark as Shipped", icon: Truck, color: "text-violet-600" },
    { key: "OFD", label: "Out for Delivery", icon: Truck, color: "text-amber-600" },
    { key: "DELIVERED", label: "Mark as Delivered", icon: PackageCheck, color: "text-emerald-600" },
  ];

  const confirmActions = [
    { key: "freelancer", label: "Connect Freelancer for Delivery", icon: User, desc: "Assign a freelancer to deliver this order" },
    { key: "customer_pickup", label: "Customer Pickup Confirmed", icon: PackageCheck, desc: "Customer will collect the product" },
    { key: "delivery_partner", label: "Assign Delivery Partner", icon: Truck, desc: "Connect with delivery company API" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Chat with {sellerName}</span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Order #{orderId}
        </span>
      </div>

      {/* Messages area */}
      <div className="h-64 overflow-y-auto bg-muted/10 p-4">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/15" />
          <p className="text-sm text-muted-foreground/50">
            Start a conversation with the seller
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/30">
            Messages, delivery updates, and attachments will appear here
          </p>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="relative flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2.5">
        {/* Auto Text — pinned templates */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowTemplates(!showTemplates); setShowStageMenu(false); setShowConfirmMenu(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              showTemplates
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50",
            )}
          >
            <Zap className="h-3 w-3" />
            Auto Text
          </button>
          {showTemplates && (
            <div className="absolute bottom-full start-0 mb-2 w-72 rounded-lg border border-border bg-card shadow-xl z-20">
              <div className="border-b border-border px-3 py-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Saved Templates</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setMessage(tpl); setShowTemplates(false); }}
                    className="w-full rounded-md px-3 py-2 text-start text-xs hover:bg-muted transition-colors"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2">
                <button type="button" className="text-[11px] font-medium text-primary hover:underline">
                  + Add new template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attachment — submit to delivery partner */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <FileText className="h-3 w-3" />
          Attachment
        </button>

        {/* Stage — update delivery step */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowStageMenu(!showStageMenu); setShowTemplates(false); setShowConfirmMenu(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              showStageMenu
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
            )}
          >
            <Package className="h-3 w-3" />
            Stage
          </button>
          {showStageMenu && (
            <div className="absolute bottom-full start-0 mb-2 w-56 rounded-lg border border-border bg-card shadow-xl z-20">
              <div className="border-b border-border px-3 py-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Update Delivery Stage</span>
              </div>
              <div className="p-1">
                {stages.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-muted",
                      status === s.key && "bg-muted",
                    )}
                  >
                    <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                    {s.label}
                    {status === s.key && (
                      <span className="ms-auto rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2">
                <button type="button" className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline">
                  <Truck className="h-3 w-3" />
                  Connect Delivery API
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm — connect freelancer/customer */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowConfirmMenu(!showConfirmMenu); setShowTemplates(false); setShowStageMenu(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              showConfirmMenu
                ? "bg-violet-500 text-white"
                : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            Confirm
          </button>
          {showConfirmMenu && (
            <div className="absolute bottom-full start-0 mb-2 w-72 rounded-lg border border-border bg-card shadow-xl z-20">
              <div className="border-b border-border px-3 py-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Confirm & Assign</span>
              </div>
              <div className="p-1">
                {confirmActions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-start transition-colors hover:bg-muted"
                  >
                    <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <div>
                      <span className="text-xs font-semibold">{a.label}</span>
                      <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && message.trim()) { /* send */ setMessage(""); } }}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          dir={langDir}
        />
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Copy helper ────────────────────────────────────────────────
async function copyText(text: string) {
  try {
    if (navigator?.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  } catch {}
}

// ─── Main Page ──────────────────────────────────────────────────
export default function MyOrderDetailsPage() {
  const t = useTranslations();
  const { langDir, currency, selectedLocale } = useAuth();
  const params = useParams();
  const router = useRouter();

  const orderQuery = useOrderById(
    { orderProductId: params?.id ? (params.id as string) : "" },
    !!params?.id,
  );

  const order = orderQuery.data?.data;
  const orderInfo = order?.orderProduct_order;
  const shipping = orderInfo?.order_orderAddress?.find((a: any) => a?.addressType === "SHIPPING");
  const billing = orderInfo?.order_orderAddress?.find((a: any) => a?.addressType === "BILLING");
  const otherItems = orderQuery.data?.otherData?.[0]?.order_orderProducts;
  const shippingDetail = order?.orderShippingDetail;
  const tracking = (order?.breakdown?.tracking || (order as any)?.tracking) as any;

  const shippingType = shippingDetail?.orderShippingType;
  const confirmMutation = useConfirmReceipt();
  const pickupQuery = usePickupCode(
    Number(params?.id) || 0,
    shippingType === "PICKUP" && ["CONFIRMED", "SHIPPED", "OFD", "DELIVERED"].includes(order?.orderProductStatus || ""),
  );

  const product =
    order?.orderProduct_productPrice?.productPrice_product ||
    order?.orderProduct_product ||
    {};
  const ppd = order?.orderProduct_productPrice || {};
  const status = order?.orderProductStatus || "CONFIRMED";
  const isService = order?.orderProductType === "SERVICE";
  const sellerName = ppd.adminDetail
    ? `${ppd.adminDetail.firstName} ${ppd.adminDetail.lastName || ""}`.trim()
    : "Seller";

  const productImage =
    product.productImages?.[0]?.image ||
    order?.orderProduct_product?.productImages?.[0]?.image ||
    null;

  const totalPrice = isService
    ? Number(order?.purchasePrice || 0) * (order?.orderQuantity ?? 0)
    : ppd.offerPrice
      ? Number(ppd.offerPrice) * (order?.orderQuantity ?? 0)
      : Number(order?.purchasePrice || order?.salePrice || 0) * (order?.orderQuantity ?? 0);

  const orderDate =
    order?.orderProductDate ||
    orderInfo?.orderDate ||
    orderInfo?.createdAt ||
    order?.createdAt;

  // Build timeline dates
  const timelineDates: Record<string, string> = {};
  if (orderDate) timelineDates.placed = orderDate;
  if (order?.confirmedAt || orderDate) timelineDates.confirmed = order?.confirmedAt || orderDate;
  if (order?.shippedAt) timelineDates.shipped = order.shippedAt;
  if (order?.ofdAt) timelineDates.ofd = order.ofdAt;
  if (order?.deliveredAt) timelineDates.delivered = order.deliveredAt;

  const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString(selectedLocale || "en", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ── Loading skeleton ──────────────────────────────────────────
  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-6 h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* ── Breadcrumb ──────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/home" className="hover:text-foreground transition-colors">
            {t("home")}
          </Link>
          <span>/</span>
          <Link href="/my-orders" className="hover:text-foreground transition-colors">
            {t("my_orders")}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{orderInfo?.orderNo || `#${params?.id}`}</span>
        </nav>

        {/* ── Row 1: Address + Actions ────────────────── */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AddressCard
            title={t("delivery_address")}
            icon={MapPin}
            iconColor="text-red-500"
            name={`${shipping?.firstName || ""} ${shipping?.lastName || ""}`.trim() || "—"}
            address={shipping?.address || "—"}
            phone={shipping?.phone || "—"}
            pin={shipping?.postCode}
          />
          <AddressCard
            title={t("billing_address")}
            icon={CreditCard}
            iconColor="text-blue-500"
            name={`${billing?.firstName || ""} ${billing?.lastName || ""}`.trim() || "—"}
            address={billing?.address || "—"}
            phone={billing?.phone || "—"}
            pin={billing?.postCode}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <FileText className="h-4 w-4 text-violet-500" />
              More actions
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const api = typeof window !== "undefined" ? `http://${window.location.hostname}:3000/api/v1` : "";
                  window.open(`${api}/order/invoice?orderProductId=${params?.id}`, "_blank");
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <Download className="h-4 w-4" />
                {t("download_invoice")}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4" />
                {t("need_help")}
              </button>
              {status === "DELIVERED" && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Star className="h-4 w-4" />
                  Write a Review
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: Product + Timeline ───────────────── */}
        <div className="mb-6 rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start">
            {/* Product */}
            <Link
              href={`/trending/${product.id || order?.orderProduct_product?.id}`}
              className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted transition-opacity hover:opacity-80"
            >
              <Image
                src={productImage || PlaceholderImage}
                alt={product.productName || "Product"}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold leading-snug line-clamp-2">
                    {isService
                      ? order?.serviceFeatures?.[0]?.serviceFeature?.name
                      : product.productName || t("unknown_product")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seller: <span className="font-medium text-foreground">{sellerName}</span>
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      {currency.symbol}{totalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Quantity x {order?.orderQuantity || 1}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  {orderDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Placed on {formatDateShort(orderDate)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {t("need_help")}
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-5 rounded-lg border border-border/50 bg-muted/20 p-4">
                <OrderTimeline status={status} dates={timelineDates} />
              </div>
            </div>
          </div>

          {/* Tracking details if shipped */}
          {tracking && ["SHIPPED", "OFD", "DELIVERED"].includes(status) && (
            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {tracking.trackingNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-mono font-medium">{tracking.trackingNumber}</span>
                    <button type="button" onClick={() => copyText(tracking.trackingNumber)}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {tracking.carrier && (
                  <div>
                    <span className="text-muted-foreground">Carrier:</span>{" "}
                    <span className="font-medium">{tracking.carrier}</span>
                  </div>
                )}
                {(shippingDetail as any)?.carrierTrackingUrl && (
                  <a
                    href={(shippingDetail as any).carrierTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Track Package <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Pickup code / Confirm receipt */}
          {shippingType === "PICKUP" && pickupQuery.data?.data && (
            <div className="border-t border-border px-5 py-4">
              <PickupCodeDisplay code={pickupQuery.data.data.code} />
            </div>
          )}
          {["OFD", "DELIVERED"].includes(status) && status !== "RECEIVED" && (
            <div className="border-t border-border px-5 py-4">
              <ConfirmReceiptButton
                orderProductId={Number(params?.id)}
                mutation={confirmMutation}
                currentStatus={status}
              />
            </div>
          )}
        </div>

        {/* ── Row 3: Order Summary ────────────────────── */}
        {orderInfo && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold">{t("order_summary")}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">{t("order_number")}</span>
                <p className="font-semibold">{orderInfo.orderNo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("order_status")}</span>
                <p className="font-semibold">{orderInfo.orderStatus}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <p className="font-semibold">{currency.symbol}{orderInfo.totalPrice || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("total_amount")}</span>
                <p className="text-lg font-bold text-primary">{currency.symbol}{orderInfo.totalCustomerPay || 0}</p>
              </div>
              {orderInfo.paymentType !== "DIRECT" && (orderInfo.dueAmount ?? 0) > 0 && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t("advance_paid")}</span>
                    <p className="font-semibold">{currency.symbol}{orderInfo.advanceAmount || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("remaining_due")}</span>
                    <p className="font-semibold text-amber-600">{currency.symbol}{orderInfo.dueAmount || 0}</p>
                  </div>
                </>
              )}
              {shippingDetail && !isService && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t("shipping_mode")}</span>
                    <p className="font-semibold">{shippingDetail.orderShippingType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("delivery_charge")}</span>
                    <p className="font-semibold">{currency.symbol}{shippingDetail.shippingCharge || 0}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Row 4: Chat with Seller ─────────────────── */}
        <div className="mb-6">
          <ChatSection sellerName={sellerName} langDir={langDir} status={status} orderId={orderInfo?.orderNo || String(params?.id)} />
        </div>

        {/* ── Other items in same order ───────────────── */}
        {otherItems && otherItems.length > 1 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold">Other items in this order</h3>
            <div className="space-y-3">
              {otherItems
                .filter((item: any) => item.id !== Number(params?.id))
                .map((item: any) => {
                  const p = item.orderProduct_productPrice?.productPrice_product || item.orderProduct_product || {};
                  const img = p.productImages?.[0]?.image;
                  return (
                    <Link
                      key={item.id}
                      href={`/my-orders/${item.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={img || PlaceholderImage}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.productName || `Item #${item.id}`}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.orderQuantity || 1}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {currency.symbol}{Number(item.totalCustomerPay || 0).toFixed(2)}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Back button ─────────────────────────────── */}
        <div className="pb-8">
          <button
            type="button"
            onClick={() => router.push("/my-orders")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Orders
          </button>
        </div>
      </div>
    </div>
  );
}
