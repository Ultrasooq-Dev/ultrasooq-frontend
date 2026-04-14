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
  useUpdateOrderStatus,
  useAddOrderTracking,
} from "@/apis/queries/orders.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2, Truck, PackageCheck, Clock, XCircle,
  ChevronDown, Download, MessageCircle, Eye, MapPin,
  Star, Loader2,
} from "lucide-react";
import {
  FLOW, getFlowItem, getNextFlowItem, STATUS_MAP, QUICK_STAGES,
} from "@/components/modules/orders/constants";
import type { SellerOrderCardProps } from "@/components/modules/orders/types";

export default function SellerOrderCard({
  id, orderProductType, productId, purchasePrice, productName, produtctImage,
  orderQuantity, orderId, orderStatus, orderProductDate, updatedAt,
  serviceFeature, buyerName, buyerEmail, buyerPhone, buyerRating, buyerOrderCount,
  selected, onSelect, onStatusChange,
}: SellerOrderCardProps) {
  const t = useTranslations();
  const { currency, selectedLocale } = useAuth();
  const [localStatus, setLocalStatus] = useState(orderStatus);
  const [showMenu, setShowMenu] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const [stageLocation, setStageLocation] = useState("");

  const current = getFlowItem(localStatus);
  const next = getNextFlowItem(localStatus);
  const currentIdx = FLOW.findIndex((f) => f.key === localStatus);
  const imageUrl = produtctImage?.[0]?.image || null;
  const total = Number(purchasePrice || 0) * (orderQuantity ?? 1);
  const isCancelled = localStatus === "CANCELLED";
  const isDelivered = localStatus === "DELIVERED";
  const progress = currentIdx >= 0 ? (currentIdx / (FLOW.length - 1)) * 100 : 0;
  const Icon = current.icon;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateStatusMutation = useUpdateOrderStatus();
  const addTrackingMutation = useAddOrderTracking();

  const handleSetStatus = (key: string) => {
    const prev = localStatus;
    setLocalStatus(key);
    setShowMenu(false);

    const apiStatus = STATUS_MAP[key] || key.toLowerCase();
    updateStatusMutation.mutate(
      { orderProductId: id, status: apiStatus },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
          toast({
            title: t("order_status_has_been_updated"),
            variant: "success",
          });
          onStatusChange?.(id, key);
        },
        onError: () => {
          setLocalStatus(prev);
          toast({
            title: t("error") || "Failed to update status",
            variant: "danger",
          });
        },
      },
    );
  };

  const handleStageUpdate = (stage: (typeof QUICK_STAGES)[number]) => {
    const loc = stageLocation.trim();
    addTrackingMutation.mutate(
      {
        orderProductId: id,
        trackingNumber: stage.key,
        carrier: loc || "Manual Update",
        notes: `${stage.emoji} ${stage.label}${loc ? ` — ${loc}` : ""}`,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
          toast({
            title: `Stage updated: ${stage.label}`,
            variant: "success",
          });
        },
      },
    );
    setStageLocation("");
    setShowStages(false);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-border/80 hover:shadow-lg">
      {/* Top color accent bar */}
      <div className="relative h-1 overflow-hidden bg-muted">
        <div
          className={cn("h-full transition-all duration-700", current.bgBar)}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex gap-5">
          {/* Checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(id, e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary/30"
            />
          )}

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
                #{orderId}
              </span>
              <span>
                {orderProductDate
                  ? formattedDate(orderProductDate, selectedLocale)
                  : ""}
              </span>
            </div>

            {/* Row 3: Buyer info */}
            {buyerName && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{buyerName}</span>
                {buyerRating && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-3 w-3" /> {buyerRating}
                  </span>
                )}
                {buyerOrderCount != null && (
                  <span>
                    {buyerOrderCount} {t("orders_placed") || "orders"}
                  </span>
                )}
              </div>
            )}

            {/* Row 4: Status + Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold",
                  current.color,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(current.label)}
              </span>

              {!isCancelled && !isDelivered && (
                <div className="ms-2 flex flex-1 items-center gap-0.5">
                  {FLOW.map((f, i) => (
                    <div
                      key={f.key}
                      className={cn(
                        "h-[3px] flex-1 rounded-full transition-colors",
                        currentIdx >= i ? current.bgBar : "bg-border",
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
          {/* Quick advance */}
          {next && !isCancelled && (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => handleSetStatus(next.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50",
                next.bgBar,
              )}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <next.icon className="h-3.5 w-3.5" />
              )}
              {t("mark_as") || "Mark as"} {t(next.label)}
            </button>
          )}

          {/* Stage update dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowStages(!showStages); setShowMenu(false); }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MapPin className="h-3.5 w-3.5" /> {t("update_delivery_status")}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showStages && (
              <div className="absolute start-0 top-full z-20 mt-1 w-60 rounded-lg border border-border bg-card shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <input
                    type="text"
                    value={stageLocation}
                    onChange={(e) => setStageLocation(e.target.value)}
                    placeholder={t("location") || "Location"}
                    className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-[11px] outline-none focus:border-primary"
                  />
                </div>
                <div className="p-1">
                  {QUICK_STAGES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleStageUpdate(s)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-start text-[11px] transition-colors hover:bg-muted"
                    >
                      <span>{s.emoji}</span> {t(s.label) || s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Set status dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowMenu(!showMenu); setShowStages(false); }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("order_status")} <ChevronDown className="h-3 w-3" />
            </button>
            {showMenu && (
              <div className="absolute start-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-card shadow-xl">
                <div className="p-1">
                  {[...FLOW, { key: "CANCELLED", label: "cancelled", icon: XCircle, color: "text-red-500", bgBar: "bg-red-500" }].map(
                    (f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => handleSetStatus(f.key)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium transition-colors hover:bg-muted",
                          localStatus === f.key && "bg-muted",
                        )}
                      >
                        <f.icon className={cn("h-3.5 w-3.5", f.color)} />
                        {t(f.label)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <Link
            href={`/orders/${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            <MessageCircle className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
