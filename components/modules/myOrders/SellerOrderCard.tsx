"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Truck,
  PackageCheck,
  ChevronDown,
  Clock,
  XCircle,
  Package,
  MapPin,
  MessageCircle,
} from "lucide-react";

type SellerOrderCardProps = {
  id: number;
  orderProductType?: string;
  productId: number;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image: string }[];
  orderQuantity?: number;
  orderId: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: any;
  buyerName?: string;
  onStatusChange?: (orderProductId: number, newStatus: string) => void;
};

const STATUS_FLOW = [
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, color: "text-violet-600", bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800" },
  { key: "OFD", label: "Out for Delivery", icon: Truck, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" },
  { key: "DELIVERED", label: "Delivered", icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" },
];

function getNextStatus(current: string): typeof STATUS_FLOW[number] | null {
  const idx = STATUS_FLOW.findIndex((s) => s.key === current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function getStatusDef(status: string) {
  return STATUS_FLOW.find((s) => s.key === status) || {
    key: status, label: status, icon: Clock, color: "text-muted-foreground", bg: "bg-muted border-border",
  };
}

const SellerOrderCard: React.FC<SellerOrderCardProps> = ({
  id,
  orderProductType,
  productId,
  purchasePrice,
  productName,
  produtctImage,
  orderQuantity,
  orderId,
  orderStatus,
  orderProductDate,
  updatedAt,
  serviceFeature,
  buyerName,
  onStatusChange,
}) => {
  const t = useTranslations();
  const { langDir, currency, selectedLocale } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [localStatus, setLocalStatus] = useState(orderStatus);

  const statusDef = getStatusDef(localStatus);
  const nextStatus = getNextStatus(localStatus);
  const isCancelled = localStatus === "CANCELLED";
  const isDelivered = localStatus === "DELIVERED";
  const StatusIcon = statusDef.icon;

  const handleAdvance = () => {
    if (!nextStatus) return;
    setLocalStatus(nextStatus.key);
    onStatusChange?.(id, nextStatus.key);
  };

  const handleSetStatus = (key: string) => {
    setLocalStatus(key);
    onStatusChange?.(id, key);
    setShowMenu(false);
  };

  // Mini progress bar
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === localStatus);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4 p-4">
        {/* Product image */}
        <Link href={`/my-orders/${id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={orderProductType === "SERVICE" ? PlaceholderImage : (produtctImage?.[0]?.image || PlaceholderImage)}
            alt={productName}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/my-orders/${id}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">
            {orderProductType === "SERVICE" ? serviceFeature?.name : productName}
          </Link>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">#{orderId}</span>
            <span>Qty: {orderQuantity || 0}</span>
            <span className="font-semibold text-foreground">{currency.symbol}{Number(purchasePrice) * (orderQuantity ?? 0)}</span>
          </div>
          {buyerName && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">Buyer: <span className="font-medium">{buyerName}</span></p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {orderProductDate ? formattedDate(orderProductDate, selectedLocale) : ""}
          </p>
        </div>

        {/* Status + Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {/* Current status badge */}
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusDef.bg, statusDef.color)}>
            <StatusIcon className="h-3 w-3" />
            {statusDef.label}
          </span>

          {/* Quick actions */}
          {!isCancelled && !isDelivered && (
            <div className="flex items-center gap-1.5">
              {/* Next stage button */}
              {nextStatus && (
                <button
                  type="button"
                  onClick={handleAdvance}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <nextStatus.icon className="h-3 w-3" />
                  {nextStatus.label}
                </button>
              )}

              {/* More stages dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showMenu && (
                  <div className="absolute end-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-xl z-20">
                    <div className="p-1">
                      {STATUS_FLOW.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => handleSetStatus(s.key)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium transition-colors hover:bg-muted",
                            localStatus === s.key && "bg-muted",
                          )}
                        >
                          <s.icon className={cn("h-3 w-3", s.color)} />
                          {s.label}
                          {localStatus === s.key && (
                            <span className="ms-auto text-[8px] font-bold text-emerald-600">Current</span>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSetStatus("CANCELLED")}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isCancelled && (
            <span className="text-[10px] font-medium text-red-500">Cancelled</span>
          )}
        </div>
      </div>

      {/* Mini progress bar */}
      {!isCancelled && (
        <div className="flex items-center gap-0 border-t border-border bg-muted/20 px-4 py-2">
          {STATUS_FLOW.map((s, i) => {
            const isActive = currentIdx >= i;
            return (
              <React.Fragment key={s.key}>
                <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-border")} />
                {i < STATUS_FLOW.length - 1 && (
                  <div className={cn("h-[1.5px] flex-1", currentIdx > i ? "bg-emerald-500" : "bg-border")} />
                )}
              </React.Fragment>
            );
          })}
          <Link href={`/my-orders/${id}`} className="ms-3 flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
            <MessageCircle className="h-3 w-3" /> Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default SellerOrderCard;
