"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAuth } from "@/context/AuthContext";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { useSubmitComplaint, useRequestRefund } from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2, Truck, PackageCheck, Clock, XCircle, Package,
  Download, Star, AlertTriangle, ReceiptText, MessageCircle, X, Eye, Loader2,
} from "lucide-react";

type Props = {
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

const STATUS: Record<string, { label: string; color: string; bgBar: string; step: number }> = {
  PLACED:    { label: "Order Placed",       color: "text-slate-600",   bgBar: "bg-slate-400",   step: 0 },
  CONFIRMED: { label: "Confirmed",          color: "text-blue-600",    bgBar: "bg-blue-500",    step: 1 },
  SHIPPED:   { label: "Shipped",            color: "text-indigo-600",  bgBar: "bg-indigo-500",  step: 2 },
  OFD:       { label: "Out for Delivery",   color: "text-amber-600",   bgBar: "bg-amber-500",   step: 3 },
  DELIVERED: { label: "Delivered",          color: "text-emerald-600", bgBar: "bg-emerald-500", step: 4 },
  CANCELLED: { label: "Cancelled",          color: "text-red-500",     bgBar: "bg-red-500",     step: -1 },
};

export default function BuyerOrderCard({
  id, orderProductType, productId, purchasePrice, productName, produtctImage,
  orderQuantity, orderId, orderNo, orderStatus, orderProductDate, updatedAt,
  serviceFeature, sellerName,
}: Props) {
  const { currency, selectedLocale } = useAuth();
  const { toast } = useToast();
  const submitComplaint = useSubmitComplaint();
  const requestRefund = useRequestRefund();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [complainType, setComplainType] = useState("");
  const [complainText, setComplainText] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const s = STATUS[orderStatus] || STATUS.PLACED;
  const imageUrl = produtctImage?.[0]?.image || null;
  const total = Number(purchasePrice || 0) * (orderQuantity ?? 1);
  const isCancelled = orderStatus === "CANCELLED";
  const isDelivered = orderStatus === "DELIVERED";
  const progress = s.step >= 0 ? (s.step / 4) * 100 : 0;

  return (
    <>
      <div className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-border/80">
        {/* Top color accent bar */}
        <div className="h-1 bg-muted relative overflow-hidden">
          <div className={cn("h-full transition-all duration-700", s.bgBar)} style={{ width: `${progress}%` }} />
        </div>

        <div className="p-5">
          <div className="flex gap-5">
            {/* Product Image */}
            <Link href={`/my-orders/${id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border transition-all group-hover:ring-primary/20">
              <Image
                src={imageUrl || PlaceholderImage}
                alt={productName}
                fill
                className="object-cover"
              />
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Name + Price */}
              <div className="flex items-start justify-between gap-3">
                <Link href={`/my-orders/${id}`} className="text-[15px] font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
                  {orderProductType === "SERVICE" ? serviceFeature?.name : productName}
                </Link>
                <div className="shrink-0 text-end">
                  <span className="text-lg font-bold tracking-tight">{currency.symbol}{total.toFixed(2)}</span>
                  {(orderQuantity ?? 1) > 1 && (
                    <p className="text-[10px] text-muted-foreground">{currency.symbol}{Number(purchasePrice).toFixed(2)} x {orderQuantity}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Meta */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">#{orderNo || orderId}</span>
                {sellerName && <span>by <span className="font-medium text-foreground">{sellerName}</span></span>}
                <span>{orderProductDate ? formattedDate(orderProductDate, selectedLocale) : ""}</span>
              </div>

              {/* Row 3: Status */}
              <div className="mt-3 flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", s.color)}>
                  {isCancelled ? <XCircle className="h-3.5 w-3.5" /> : isDelivered ? <PackageCheck className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  {s.label}
                </span>
                {!isCancelled && (
                  <div className="flex-1 flex items-center gap-0.5 ms-2">
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div key={step} className={cn("h-[3px] flex-1 rounded-full transition-colors", s.step >= step ? s.bgBar : "bg-border")} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link href={`/my-orders/${id}`}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
              <Eye className="h-3.5 w-3.5" /> View Details
            </Link>

            <button type="button"
              onClick={() => {
                const api = typeof window !== "undefined" ? `http://${window.location.hostname}:3000/api/v1` : "";
                window.open(`${api}/order/invoice?orderProductId=${id}`, "_blank");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Download className="h-3.5 w-3.5" /> Invoice
            </button>

            <Link href={`/messages?channel=orders&orderId=${id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> Message Seller
            </Link>

            {isDelivered && (
              <Link href={`/trending/${productId}?type=reviews`}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                <Star className="h-3.5 w-3.5" /> Rate & Review
              </Link>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Complaint + Refund on the right */}
            <button type="button" onClick={() => setShowComplaint(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20">
              <AlertTriangle className="h-3.5 w-3.5" /> Complaint
            </button>

            {!isCancelled && (
              <button type="button" onClick={() => setShowRefund(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20">
                <ReceiptText className="h-3.5 w-3.5" /> Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3 z-10">
              <h3 className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-amber-500" /> File a Complaint</h3>
              <button type="button" onClick={() => { setShowComplaint(false); setComplainType(""); setComplainText(""); }}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted-foreground">#{orderNo} — {productName}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { k: "damaged", l: "Damaged", e: "💔" }, { k: "wrong", l: "Wrong Item", e: "❌" },
                  { k: "missing", l: "Missing Parts", e: "🧩" }, { k: "desc", l: "Not as Described", e: "📝" },
                  { k: "late", l: "Late Delivery", e: "⏰" }, { k: "quality", l: "Poor Quality", e: "👎" },
                  { k: "seller", l: "Seller Issue", e: "🏪" }, { k: "other", l: "Other", e: "💬" },
                ].map((t) => (
                  <button key={t.k} type="button" onClick={() => setComplainType(t.k)}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium",
                      complainType === t.k ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-border hover:bg-muted")}>
                    {t.e} {t.l}
                  </button>
                ))}
              </div>
              <textarea value={complainText} onChange={(e) => setComplainText(e.target.value)} rows={3}
                placeholder="Describe the issue..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none" />
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card px-5 py-3">
              <button type="button" onClick={() => { setShowComplaint(false); setComplainType(""); setComplainText(""); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!complainType || !complainText.trim() || submitComplaint.isPending}
                onClick={() => {
                  submitComplaint.mutate(
                    { orderProductId: id, reason: complainType, description: complainText },
                    {
                      onSuccess: (data) => {
                        if (data?.status) {
                          toast({ title: "Complaint submitted", description: "We'll review it shortly", variant: "success" });
                          setShowComplaint(false); setComplainType(""); setComplainText("");
                        } else {
                          toast({ title: "Failed", description: data?.message || "Could not submit complaint", variant: "danger" });
                        }
                      },
                      onError: () => toast({ title: "Error", description: "Failed to submit complaint", variant: "danger" }),
                    },
                  );
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                {submitComplaint.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3 z-10">
              <h3 className="flex items-center gap-2 text-sm font-bold"><ReceiptText className="h-4 w-4 text-red-500" /> Request Refund</h3>
              <button type="button" onClick={() => { setShowRefund(false); setRefundReason(""); }}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Refund amount</span>
                <span className="font-bold text-primary">{currency.symbol}{total.toFixed(2)}</span>
              </div>
              {["Defective / damaged", "Not as described", "Wrong item", "No longer needed", "Better price elsewhere", "Late delivery", "Other"].map((r) => (
                <button key={r} type="button" onClick={() => setRefundReason(r)}
                  className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-xs text-start",
                    refundReason === r ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-border hover:bg-muted")}>
                  <div className={cn("h-3 w-3 shrink-0 rounded-full border-2", refundReason === r ? "border-red-500 bg-red-500" : "border-muted-foreground/30")} />
                  {r}
                </button>
              ))}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card px-5 py-3">
              <button type="button" onClick={() => { setShowRefund(false); setRefundReason(""); }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!refundReason || requestRefund.isPending}
                onClick={() => {
                  requestRefund.mutate(
                    { orderProductId: id, reason: refundReason, amount: total },
                    {
                      onSuccess: (data) => {
                        if (data?.status) {
                          toast({ title: "Refund requested", description: "We'll review within 24-48 hours", variant: "success" });
                          setShowRefund(false); setRefundReason("");
                        } else {
                          toast({ title: "Failed", description: data?.message || "Could not submit refund", variant: "danger" });
                        }
                      },
                      onError: () => toast({ title: "Error", description: "Failed to submit refund request", variant: "danger" }),
                    },
                  );
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {requestRefund.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
