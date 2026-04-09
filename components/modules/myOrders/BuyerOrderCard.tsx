"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAuth } from "@/context/AuthContext";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Truck,
  PackageCheck,
  Clock,
  XCircle,
  Package,
  Download,
  Star,
  AlertTriangle,
  ReceiptText,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  X,
  MoreHorizontal,
} from "lucide-react";

type BuyerOrderCardProps = {
  id: number;
  orderProductType?: string;
  productId: number;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image: string }[];
  orderQuantity?: number;
  orderId: string;
  orderNo?: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: any;
  sellerName?: string;
};

const STATUS_DEF: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; step: number }> = {
  PLACED:    { label: "Placed",          icon: Clock,        color: "text-gray-600",    bg: "bg-gray-50 border-gray-200 dark:bg-gray-950/20",    step: 0 },
  CONFIRMED: { label: "Confirmed",       icon: CheckCircle2, color: "text-blue-600",    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20",    step: 1 },
  SHIPPED:   { label: "Shipped",         icon: Truck,        color: "text-violet-600",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/20", step: 2 },
  OFD:       { label: "Out for Delivery",icon: Truck,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20",  step: 3 },
  DELIVERED: { label: "Delivered",       icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20", step: 4 },
  CANCELLED: { label: "Cancelled",       icon: XCircle,      color: "text-red-500",     bg: "bg-red-50 border-red-200 dark:bg-red-950/20",       step: -1 },
};

const STEPS = [0, 1, 2, 3, 4]; // Placed → Confirmed → Shipped → OFD → Delivered

const BuyerOrderCard: React.FC<BuyerOrderCardProps> = ({
  id,
  orderProductType,
  productId,
  purchasePrice,
  productName,
  produtctImage,
  orderQuantity,
  orderId,
  orderNo,
  orderStatus,
  orderProductDate,
  updatedAt,
  serviceFeature,
  sellerName,
}) => {
  const { langDir, currency, selectedLocale } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [complainType, setComplainType] = useState("");
  const [complainText, setComplainText] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const status = STATUS_DEF[orderStatus] || STATUS_DEF.PLACED;
  const StatusIcon = status.icon;
  const isCancelled = orderStatus === "CANCELLED";
  const isDelivered = orderStatus === "DELIVERED";
  const currentStep = status.step;
  const imageUrl = produtctImage?.[0]?.image || null;
  const totalPrice = Number(purchasePrice || 0) * (orderQuantity ?? 1);

  const complaintTypes = [
    { key: "damaged", label: "Damaged", emoji: "💔" },
    { key: "wrong_item", label: "Wrong Item", emoji: "❌" },
    { key: "missing", label: "Missing Parts", emoji: "🧩" },
    { key: "not_described", label: "Not as Described", emoji: "📝" },
    { key: "late", label: "Late Delivery", emoji: "⏰" },
    { key: "quality", label: "Poor Quality", emoji: "👎" },
    { key: "other", label: "Other", emoji: "💬" },
  ];

  const refundReasons = [
    "Product is defective",
    "Not as described",
    "Wrong item received",
    "No longer needed",
    "Found better price",
    "Late delivery",
    "Other",
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4 p-4">
          {/* Image */}
          <Link href={`/my-orders/${id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={imageUrl || PlaceholderImage}
              alt={productName}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/my-orders/${id}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 block">
              {orderProductType === "SERVICE" ? serviceFeature?.name : productName}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-mono">#{orderNo || orderId}</span>
              <span>Qty: {orderQuantity || 1}</span>
              <span className="font-bold text-foreground text-sm">{currency.symbol}{totalPrice.toFixed(2)}</span>
            </div>
            {sellerName && <p className="mt-0.5 text-[11px] text-muted-foreground">Seller: {sellerName}</p>}
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {orderProductDate ? formattedDate(orderProductDate, selectedLocale) : ""}
            </p>
          </div>

          {/* Status + Actions toggle */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", status.bg, status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>

            {/* Action buttons row */}
            <div className="flex items-center gap-1">
              {/* Invoice */}
              <button type="button" title="Download Invoice"
                onClick={() => {
                  const api = typeof window !== "undefined" ? `http://${window.location.hostname}:3000/api/v1` : "";
                  window.open(`${api}/order/invoice?orderProductId=${id}`, "_blank");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Download className="h-3 w-3" />
              </button>

              {/* Chat */}
              <Link href={`/my-orders/${id}`} title="Chat with seller"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                <MessageCircle className="h-3 w-3" />
              </Link>

              {/* Review (delivered only) */}
              {isDelivered && (
                <Link href={`/trending/${productId}?type=reviews`} title="Write a review"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors">
                  <Star className="h-3 w-3" />
                </Link>
              )}

              {/* Complaint */}
              <button type="button" title="File a complaint"
                onClick={() => setShowComplaint(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                <AlertTriangle className="h-3 w-3" />
              </button>

              {/* Refund */}
              {!isCancelled && (
                <button type="button" title="Request refund"
                  onClick={() => setShowRefund(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <ReceiptText className="h-3 w-3" />
                </button>
              )}

              {/* Help */}
              <button type="button" title="Need help?"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                <HelpCircle className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="flex items-center gap-0 border-t border-border bg-muted/20 px-4 py-2">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className={cn("h-1.5 w-1.5 rounded-full", currentStep >= step ? "bg-emerald-500" : "bg-border")} />
                {i < STEPS.length - 1 && (
                  <div className={cn("h-[1.5px] flex-1", currentStep > step ? "bg-emerald-500" : "bg-border")} />
                )}
              </React.Fragment>
            ))}
            <Link href={`/my-orders/${id}`} className="ms-3 text-[10px] font-medium text-primary hover:underline">
              Details
            </Link>
          </div>
        )}
      </div>

      {/* ═══ Inline Complaint Modal ═══ */}
      {showComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3 z-10">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> File a Complaint
              </h3>
              <button type="button" onClick={() => { setShowComplaint(false); setComplainType(""); setComplainText(""); }}
                className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted-foreground">Order #{orderNo || orderId} — {productName}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {complaintTypes.map((t) => (
                  <button key={t.key} type="button" onClick={() => setComplainType(t.key)}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all",
                      complainType === t.key ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30" : "border-border hover:bg-muted")}>
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
              <textarea value={complainText} onChange={(e) => setComplainText(e.target.value)}
                placeholder="Describe the issue..." rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none" />
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card px-5 py-3">
              <button type="button" onClick={() => { setShowComplaint(false); setComplainType(""); setComplainText(""); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!complainType || !complainText.trim()}
                onClick={() => { setShowComplaint(false); setComplainType(""); setComplainText(""); }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Inline Refund Modal ═══ */}
      {showRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3 z-10">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <ReceiptText className="h-4 w-4 text-red-500" /> Request Refund
              </h3>
              <button type="button" onClick={() => { setShowRefund(false); setRefundReason(""); }}
                className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">{currency.symbol}{totalPrice.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5">
                {refundReasons.map((r) => (
                  <button key={r} type="button" onClick={() => setRefundReason(r)}
                    className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-start text-xs transition-all",
                      refundReason === r ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30" : "border-border hover:bg-muted")}>
                    <div className={cn("h-3 w-3 shrink-0 rounded-full border-2",
                      refundReason === r ? "border-red-500 bg-red-500" : "border-muted-foreground/30")} />
                    {r}
                  </button>
                ))}
              </div>
              <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-[10px] text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                Reviewed within 24-48h. Refund to original payment method.
              </p>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card px-5 py-3">
              <button type="button" onClick={() => { setShowRefund(false); setRefundReason(""); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!refundReason}
                onClick={() => { setShowRefund(false); setRefundReason(""); }}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                Submit Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerOrderCard;
