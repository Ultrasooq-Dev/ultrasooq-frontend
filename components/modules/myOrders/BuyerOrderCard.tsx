"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  Truck, PackageCheck, XCircle, Download, Star,
  AlertTriangle, ReceiptText, MessageCircle, Eye,
} from "lucide-react";
import { ORDER_STATUS } from "@/components/modules/orders/constants";
import ComplaintModal from "@/components/modules/orders/ComplaintModal";
import RefundModal from "@/components/modules/orders/RefundModal";
import type { BuyerOrderCardProps } from "@/components/modules/orders/types";

export default function BuyerOrderCard({
  id, orderProductType, productId, purchasePrice, productName, produtctImage,
  orderQuantity, orderId, orderNo, orderStatus, orderProductDate, updatedAt,
  serviceFeature, sellerName,
}: BuyerOrderCardProps) {
  const t = useTranslations();
  const { currency, selectedLocale } = useAuth();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const s = ORDER_STATUS[orderStatus] || ORDER_STATUS.PLACED;
  const imageUrl = produtctImage?.[0]?.image || null;
  const total = Number(purchasePrice || 0) * (orderQuantity ?? 1);
  const isCancelled = orderStatus === "CANCELLED";
  const isDelivered = orderStatus === "DELIVERED";
  const progress = s.step >= 0 ? (s.step / 4) * 100 : 0;

  return (
    <>
      <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-border/80 hover:shadow-lg">
        {/* Top color accent bar */}
        <div className="relative h-1 overflow-hidden bg-muted">
          <div
            className={cn("h-full transition-all duration-700", s.bgBar)}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex gap-5">
            {/* Product Image */}
            <Link
              href={`/orders/${id}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border transition-all group-hover:ring-primary/20"
            >
              <Image
                src={imageUrl || PlaceholderImage}
                alt={productName}
                fill
                className="object-cover"
              />
            </Link>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Row 1: Name + Price */}
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/orders/${id}`}
                  className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors hover:text-primary"
                >
                  {orderProductType === "SERVICE"
                    ? serviceFeature?.name
                    : productName}
                </Link>
                <div className="shrink-0 text-end">
                  <span className="text-lg font-bold tracking-tight">
                    {currency.symbol}{total.toFixed(2)}
                  </span>
                  {(orderQuantity ?? 1) > 1 && (
                    <p className="text-[10px] text-muted-foreground">
                      {currency.symbol}{Number(purchasePrice).toFixed(2)} x{" "}
                      {orderQuantity}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Meta */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono" translate="no">
                  #{orderNo || orderId}
                </span>
                {sellerName && (
                  <span>
                    by{" "}
                    <span className="font-medium text-foreground">
                      {sellerName}
                    </span>
                  </span>
                )}
                <span>
                  {orderProductDate
                    ? formattedDate(orderProductDate, selectedLocale)
                    : ""}
                </span>
              </div>

              {/* Row 3: Status */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold",
                    s.color,
                  )}
                >
                  {isCancelled ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : isDelivered ? (
                    <PackageCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Truck className="h-3.5 w-3.5" />
                  )}
                  {t(s.label)}
                </span>
                {!isCancelled && (
                  <div className="ms-2 flex flex-1 items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          "h-[3px] flex-1 rounded-full transition-colors",
                          s.step >= step ? s.bgBar : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link
              href={`/orders/${id}`}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Eye className="h-3.5 w-3.5" /> {t("view_order_details")}
            </Link>

            <button
              type="button"
              onClick={() => {
                const api =
                  typeof window !== "undefined"
                    ? `http://${window.location.hostname}:3000/api/v1`
                    : "";
                window.open(
                  `${api}/order/invoice?orderProductId=${id}`,
                  "_blank",
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" /> {t("download_invoice")}
            </button>

            <Link
              href={`/messages?channel=orders&orderId=${id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" />{" "}
              {t("message_seller") || "Message Seller"}
            </Link>

            {isDelivered && (
              <Link
                href={`/trending/${productId}?type=reviews`}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
              >
                <Star className="h-3.5 w-3.5" /> {t("rate_review") || "Rate & Review"}
              </Link>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setShowComplaint(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <AlertTriangle className="h-3.5 w-3.5" />{" "}
              {t("file_complaint") || "Complaint"}
            </button>

            {!isCancelled && (
              <button
                type="button"
                onClick={() => setShowRefund(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <ReceiptText className="h-3.5 w-3.5" /> {t("refund")}
              </button>
            )}
          </div>
        </div>
      </div>

      <ComplaintModal
        open={showComplaint}
        onOpenChange={setShowComplaint}
        orderProductId={id}
        orderNo={orderNo}
        productName={productName}
      />

      <RefundModal
        open={showRefund}
        onOpenChange={setShowRefund}
        orderProductId={id}
        orderNo={orderNo}
        amount={total}
        currencySymbol={currency.symbol}
      />
    </>
  );
}
