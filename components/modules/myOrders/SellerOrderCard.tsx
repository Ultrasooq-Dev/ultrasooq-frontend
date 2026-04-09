"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAuth } from "@/context/AuthContext";
import { formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Truck, PackageCheck, Clock, XCircle, Package,
  ChevronDown, Download, MessageCircle, Eye, MapPin, Zap,
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
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: any;
  buyerName?: string;
  onStatusChange?: (orderProductId: number, newStatus: string) => void;
};

const FLOW = [
  { key: "PLACED",    label: "Placed",           icon: Clock,        color: "text-slate-600",   bgBar: "bg-slate-400" },
  { key: "CONFIRMED", label: "Confirmed",        icon: CheckCircle2, color: "text-blue-600",    bgBar: "bg-blue-500" },
  { key: "SHIPPED",   label: "Shipped",          icon: Truck,        color: "text-indigo-600",  bgBar: "bg-indigo-500" },
  { key: "OFD",       label: "Out for Delivery", icon: Truck,        color: "text-amber-600",   bgBar: "bg-amber-500" },
  { key: "DELIVERED", label: "Delivered",        icon: PackageCheck, color: "text-emerald-600", bgBar: "bg-emerald-500" },
];

function getFlowItem(key: string) {
  return FLOW.find((f) => f.key === key) || FLOW[0];
}
function getNext(key: string) {
  const idx = FLOW.findIndex((f) => f.key === key);
  return idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
}

// Quick stage messages for the stage update
const QUICK_STAGES = [
  { key: "picked_up", label: "Picked Up", emoji: "📦" },
  { key: "in_transit", label: "In Transit", emoji: "🚚" },
  { key: "at_hub", label: "At Local Hub", emoji: "📍" },
  { key: "out_delivery", label: "Out for Delivery", emoji: "🛵" },
  { key: "delivered", label: "Delivered", emoji: "✅" },
  { key: "delayed", label: "Delayed", emoji: "⚠️" },
];

export default function SellerOrderCard({
  id, orderProductType, productId, purchasePrice, productName, produtctImage,
  orderQuantity, orderId, orderStatus, orderProductDate, updatedAt,
  serviceFeature, buyerName, onStatusChange,
}: Props) {
  const { currency, selectedLocale } = useAuth();
  const [localStatus, setLocalStatus] = useState(orderStatus);
  const [showMenu, setShowMenu] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const [stageLocation, setStageLocation] = useState("");

  const current = getFlowItem(localStatus);
  const next = getNext(localStatus);
  const currentIdx = FLOW.findIndex((f) => f.key === localStatus);
  const imageUrl = produtctImage?.[0]?.image || null;
  const total = Number(purchasePrice || 0) * (orderQuantity ?? 1);
  const isCancelled = localStatus === "CANCELLED";
  const isDelivered = localStatus === "DELIVERED";
  const progress = currentIdx >= 0 ? (currentIdx / (FLOW.length - 1)) * 100 : 0;
  const Icon = current.icon;

  const handleSetStatus = (key: string) => {
    setLocalStatus(key);
    onStatusChange?.(id, key);
    setShowMenu(false);
  };

  const handleAdvance = () => {
    if (next) handleSetStatus(next.key);
  };

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-border/80">
      {/* Progress bar */}
      <div className="h-1 bg-muted relative overflow-hidden">
        <div className={cn("h-full transition-all duration-700", current.bgBar)} style={{ width: `${progress}%` }} />
      </div>

      <div className="p-5">
        <div className="flex gap-5">
          {/* Image */}
          <Link href={`/orders/${id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-border transition-all group-hover:ring-primary/20">
            <Image
              src={imageUrl || PlaceholderImage}
              alt={productName}
              fill
              className="object-cover"
            />
            {(orderQuantity ?? 1) > 1 && (
              <span className="absolute bottom-1 end-1 rounded bg-foreground/80 px-1 py-0.5 text-[9px] font-bold text-background">
                x{orderQuantity}
              </span>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/orders/${id}`} className="text-[15px] font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
                {orderProductType === "SERVICE" ? serviceFeature?.name : productName}
              </Link>
              <div className="shrink-0 text-end">
                <span className="text-lg font-bold tracking-tight">{currency.symbol}{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">#{orderId}</span>
              <span>Qty: {orderQuantity || 1}</span>
              {buyerName && <span>Buyer: <span className="font-medium text-foreground">{buyerName}</span></span>}
              <span>{orderProductDate ? formattedDate(orderProductDate, selectedLocale) : ""}</span>
            </div>

            {/* Status */}
            <div className="mt-3 flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", current.color)}>
                <Icon className="h-3.5 w-3.5" />
                {current.label}
              </span>
              {!isCancelled && (
                <div className="flex-1 flex items-center gap-0.5 ms-2">
                  {FLOW.map((f, i) => (
                    <div key={f.key} className={cn("h-[3px] flex-1 rounded-full transition-colors", currentIdx >= i ? current.bgBar : "bg-border")} />
                  ))}
                </div>
              )}
              {isCancelled && <span className="text-xs text-red-500 font-medium">Order was cancelled</span>}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {/* Quick advance button */}
          {!isCancelled && !isDelivered && next && (
            <button type="button" onClick={handleAdvance}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90">
              <next.icon className="h-3.5 w-3.5" />
              Mark as {next.label}
            </button>
          )}

          {/* Stage update (detailed) */}
          {!isCancelled && !isDelivered && (
            <div className="relative">
              <button type="button" onClick={() => { setShowStages(!showStages); setShowMenu(false); }}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  showStages ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <MapPin className="h-3.5 w-3.5" /> Update Stage
              </button>
              {showStages && (
                <div className="absolute start-0 top-full mt-1 w-64 rounded-xl border border-border bg-card shadow-2xl z-20">
                  <div className="border-b border-border px-3 py-2">
                    <input type="text" value={stageLocation} onChange={(e) => setStageLocation(e.target.value)}
                      placeholder="📍 Location (optional)"
                      className="w-full rounded border border-border bg-muted/30 px-2 py-1.5 text-[11px] outline-none focus:border-primary" />
                  </div>
                  <div className="p-1 max-h-48 overflow-y-auto">
                    {QUICK_STAGES.map((s) => (
                      <button key={s.key} type="button"
                        onClick={() => {
                          // Map to order status
                          const map: Record<string, string> = { picked_up: "CONFIRMED", in_transit: "SHIPPED", at_hub: "OFD", out_delivery: "OFD", delivered: "DELIVERED", delayed: localStatus };
                          handleSetStatus(map[s.key] || localStatus);
                          setShowStages(false);
                          setStageLocation("");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium hover:bg-muted transition-colors">
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                        {stageLocation && <span className="ms-auto text-[9px] text-muted-foreground">{stageLocation}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Set any status */}
          {!isCancelled && !isDelivered && (
            <div className="relative">
              <button type="button" onClick={() => { setShowMenu(!showMenu); setShowStages(false); }}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
                Set Status <ChevronDown className="h-3 w-3" />
              </button>
              {showMenu && (
                <div className="absolute start-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-xl z-20">
                  <div className="p-1">
                    {FLOW.map((f) => (
                      <button key={f.key} type="button" onClick={() => handleSetStatus(f.key)}
                        className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium hover:bg-muted",
                          localStatus === f.key && "bg-muted")}>
                        <f.icon className={cn("h-3 w-3", f.color)} /> {f.label}
                        {localStatus === f.key && <span className="ms-auto text-[8px] text-emerald-600 font-bold">●</span>}
                      </button>
                    ))}
                    <div className="border-t border-border mt-0.5 pt-0.5">
                      <button type="button" onClick={() => handleSetStatus("CANCELLED")}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <XCircle className="h-3 w-3" /> Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Right side actions */}
          <Link href={`/orders/${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Eye className="h-3.5 w-3.5" /> Details
          </Link>

          <button type="button"
            onClick={() => {
              const api = typeof window !== "undefined" ? `http://${window.location.hostname}:3000/api/v1` : "";
              window.open(`${api}/order/invoice?orderProductId=${id}`, "_blank");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Invoice
          </button>

          <Link href={`/orders/${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-primary">
            <MessageCircle className="h-3.5 w-3.5" /> Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
