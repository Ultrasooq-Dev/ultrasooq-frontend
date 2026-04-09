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
  AlertTriangle,
  ReceiptText,
  X,
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

// ─── Stage → Order status mapping ───────────────────────────────
// Maps detailed courier stages to the 5 high-level order statuses
const STAGE_TO_STATUS: Record<string, string> = {
  shipment_created: "CONFIRMED",
  picked_up: "CONFIRMED",
  at_origin_facility: "SHIPPED",
  departed_origin: "SHIPPED",
  in_transit: "SHIPPED",
  at_destination_facility: "SHIPPED",
  customs_clearance: "SHIPPED",
  cleared_customs: "SHIPPED",
  at_local_hub: "OFD",
  out_for_delivery: "OFD",
  delivery_attempt: "OFD",
  delivered: "DELIVERED",
  held: "SHIPPED",
  returned: "CANCELLED",
  delayed: "SHIPPED",
};

// ─── Delivery stages data ───────────────────────────────────────
const DELIVERY_STAGES = [
  { group: "Pickup", stages: [
    { key: "shipment_created", label: "Shipment Created", emoji: "📋", msg: "Shipment label has been created" },
    { key: "picked_up", label: "Picked Up", emoji: "📦", msg: "Package picked up from seller" },
  ]},
  { group: "In Transit", stages: [
    { key: "at_origin_facility", label: "At Origin Facility", emoji: "🏭", msg: "Arrived at origin sorting facility" },
    { key: "departed_origin", label: "Departed Origin", emoji: "✈️", msg: "Departed origin facility" },
    { key: "in_transit", label: "In Transit", emoji: "🚚", msg: "In transit to destination" },
    { key: "at_destination_facility", label: "At Destination", emoji: "🏬", msg: "Arrived at destination facility" },
    { key: "customs_clearance", label: "Customs Clearance", emoji: "🛃", msg: "In customs clearance" },
    { key: "cleared_customs", label: "Cleared Customs", emoji: "✅", msg: "Cleared customs" },
  ]},
  { group: "Last Mile", stages: [
    { key: "at_local_hub", label: "At Local Hub", emoji: "📍", msg: "Arrived at local delivery hub" },
    { key: "out_for_delivery", label: "Out for Delivery", emoji: "🛵", msg: "Out for delivery" },
    { key: "delivery_attempt", label: "Delivery Attempted", emoji: "🚪", msg: "Delivery attempted — not available" },
    { key: "delivered", label: "Delivered", emoji: "✅", msg: "Delivered successfully" },
  ]},
  { group: "Exceptions", stages: [
    { key: "held", label: "Held at Facility", emoji: "⏸️", msg: "Held — awaiting instructions" },
    { key: "returned", label: "Returned", emoji: "↩️", msg: "Returned to sender" },
    { key: "delayed", label: "Delayed", emoji: "⚠️", msg: "Delayed" },
  ]},
];

interface TrackingMessage {
  id: string;
  type: "stage" | "text" | "attachment" | "confirm";
  emoji?: string;
  stage?: string;
  text: string;
  location?: string;
  time: string;
  sender: "vendor" | "system" | "customer";
}

// ─── 2-Panel: Tracking Timeline + Chat ──────────────────────────
function TrackingChatPanel({
  sellerName,
  langDir,
  status,
  orderId,
  onStatusChange,
}: {
  sellerName: string;
  langDir: string;
  status: string;
  orderId: string;
  onStatusChange?: (newStatus: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [stageLocation, setStageLocation] = useState("");
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfirmMenu, setShowConfirmMenu] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Messages = tracking updates + chat messages in one timeline
  const [messages, setMessages] = useState<TrackingMessage[]>([
    // Example pre-populated tracking history
    { id: "1", type: "stage", emoji: "📋", stage: "Shipment Created", text: "Shipment label has been created", time: new Date(Date.now() - 3 * 86400000).toISOString(), sender: "system" },
    { id: "2", type: "stage", emoji: "📦", stage: "Picked Up", text: "Package picked up from seller", location: "Seller Warehouse", time: new Date(Date.now() - 2.5 * 86400000).toISOString(), sender: "system" },
  ]);

  const templates = [
    "Your order has been shipped. Tracking will be updated shortly.",
    "Your package is out for delivery today.",
    "Thank you for your order! We're preparing it now.",
    "Please confirm receipt once you've received the product.",
  ];

  const confirmActions = [
    { key: "freelancer", label: "Connect Freelancer", icon: User, desc: "Assign freelancer for delivery" },
    { key: "customer_pickup", label: "Customer Pickup", icon: PackageCheck, desc: "Customer will collect" },
    { key: "delivery_partner", label: "Delivery Partner", icon: Truck, desc: "Assign delivery company" },
  ];

  const addMessage = (msg: Omit<TrackingMessage, "id" | "time">) => {
    setMessages((prev) => [...prev, { ...msg, id: `msg-${Date.now()}`, time: new Date().toISOString() }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleStageSelect = (s: { key: string; label: string; emoji: string; msg: string }) => {
    const loc = stageLocation.trim();
    addMessage({
      type: "stage",
      emoji: s.emoji,
      stage: s.label,
      text: s.msg + (loc ? ` — ${loc}` : ""),
      location: loc || undefined,
      sender: "vendor",
    });
    // Auto-update the top-level order status
    const newStatus = STAGE_TO_STATUS[s.key];
    if (newStatus && onStatusChange) onStatusChange(newStatus);
    setStageLocation("");
    setShowStageMenu(false);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    addMessage({ type: "text", text: message.trim(), sender: "vendor" });
    setMessage("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Order Tracking & Messages</span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          #{orderId}
        </span>
      </div>

      {/* 2-panel layout */}
      <div className="flex" style={{ height: 420 }}>
        {/* ═══ Panel 1: Tracking Timeline ═══ */}
        <div className="w-64 shrink-0 border-e border-border flex flex-col">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Delivery Timeline
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Vertical timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute start-[7px] top-2 bottom-2 w-[2px] bg-border" />

              <div className="space-y-0">
                {messages.filter((m) => m.type === "stage").map((m, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <div key={m.id} className="relative flex gap-3 pb-5">
                      {/* Dot */}
                      <div className={cn(
                        "relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        isLast
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-emerald-500 bg-card",
                      )}>
                        {isLast && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{m.emoji}</span>
                          <span className="text-[11px] font-semibold leading-tight">{m.stage}</span>
                        </div>
                        {m.location && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {m.location}
                          </div>
                        )}
                        <span className="mt-0.5 block text-[9px] text-muted-foreground/60">
                          {formatTime(m.time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {messages.filter((m) => m.type === "stage").length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="mb-2 h-6 w-6 text-muted-foreground/15" />
                <p className="text-[11px] text-muted-foreground/40">No tracking updates yet</p>
              </div>
            )}
          </div>

          {/* Stage quick-add at bottom of timeline */}
          <div className="border-t border-border px-3 py-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowStageMenu(!showStageMenu); setShowTemplates(false); setShowConfirmMenu(false); }}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-colors",
                  showStageMenu
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",
                )}
              >
                <Package className="h-3 w-3" />
                + Add Stage Update
              </button>

              {/* Stage dropdown */}
              {showStageMenu && (
                <div className="absolute bottom-full start-0 mb-2 w-72 rounded-xl border border-border bg-card shadow-2xl z-20">
                  <div className="border-b border-border px-3 py-2">
                    <span className="text-[11px] font-bold">Select Delivery Stage</span>
                  </div>
                  {/* Location input */}
                  <div className="border-b border-border px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <input
                        type="text"
                        value={stageLocation}
                        onChange={(e) => setStageLocation(e.target.value)}
                        placeholder="Location (Dubai Hub, Muscat...)"
                        className="flex-1 rounded border border-border bg-muted/30 px-2 py-1 text-[11px] outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1">
                    {DELIVERY_STAGES.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">
                            {group.group}
                          </span>
                        </div>
                        {group.stages.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => handleStageSelect(s)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-muted"
                          >
                            <span className="text-xs">{s.emoji}</span>
                            <span className="text-[11px] font-medium">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border px-3 py-2">
                    <button type="button" className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
                      <Truck className="h-3 w-3" /> Connect Aramex / DHL API
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Panel 2: Messages / Chat ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Messages with {sellerName}
            </span>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cn(
                "flex",
                m.sender === "customer" ? "justify-start" : "justify-end",
              )}>
                <div className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5",
                  m.type === "stage"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900"
                    : m.type === "confirm"
                      ? "bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900"
                      : m.sender === "vendor"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted",
                )}>
                  {/* Stage message */}
                  {m.type === "stage" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">{m.emoji}</span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        {m.stage}
                      </span>
                    </div>
                  )}
                  {m.type === "confirm" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-violet-500" />
                      <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                        Confirmation
                      </span>
                    </div>
                  )}
                  <p className="text-[12px] leading-relaxed">{m.text}</p>
                  {m.location && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" /> {m.location}
                    </div>
                  )}
                  <span className="mt-1 block text-[9px] text-muted-foreground/50 text-end">
                    {formatTime(m.time)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/10" />
                <p className="text-[11px] text-muted-foreground/40">No messages yet</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="relative flex items-center gap-1.5 border-t border-border bg-muted/20 px-3 py-2">
            {/* Auto Text */}
            <div className="relative">
              <button type="button"
                onClick={() => { setShowTemplates(!showTemplates); setShowStageMenu(false); setShowConfirmMenu(false); }}
                className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors",
                  showTemplates ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400")}>
                <Zap className="h-3 w-3" /> Templates
              </button>
              {showTemplates && (
                <div className="absolute bottom-full start-0 mb-2 w-64 rounded-lg border border-border bg-card shadow-xl z-20">
                  <div className="border-b border-border px-3 py-2">
                    <span className="text-[10px] font-semibold text-muted-foreground">Quick Templates</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-1">
                    {templates.map((tpl, i) => (
                      <button key={i} type="button"
                        onClick={() => { setMessage(tpl); setShowTemplates(false); }}
                        className="w-full rounded-md px-3 py-1.5 text-start text-[11px] hover:bg-muted transition-colors">
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachment */}
            <button type="button"
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400">
              <FileText className="h-3 w-3" /> Attach
            </button>

            {/* Confirm */}
            <div className="relative">
              <button type="button"
                onClick={() => { setShowConfirmMenu(!showConfirmMenu); setShowTemplates(false); setShowStageMenu(false); }}
                className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors",
                  showConfirmMenu ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400")}>
                <CheckCircle2 className="h-3 w-3" /> Confirm
              </button>
              {showConfirmMenu && (
                <div className="absolute bottom-full start-0 mb-2 w-60 rounded-lg border border-border bg-card shadow-xl z-20">
                  <div className="p-1">
                    {confirmActions.map((a) => (
                      <button key={a.key} type="button"
                        onClick={() => {
                          addMessage({ type: "confirm", text: a.desc, sender: "vendor" });
                          setShowConfirmMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start transition-colors hover:bg-muted">
                        <a.icon className="h-3.5 w-3.5 text-violet-500" />
                        <div>
                          <span className="text-[11px] font-semibold">{a.label}</span>
                          <p className="text-[9px] text-muted-foreground">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              dir={langDir}
            />
            <button type="button" onClick={handleSend}
              disabled={!message.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
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
  const [liveStatus, setLiveStatus] = useState("");
  const [showComplainModal, setShowComplainModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [complainText, setComplainText] = useState("");
  const [complainType, setComplainType] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const status = liveStatus || order?.orderProductStatus || "CONFIRMED";
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
  // Live timeline dates — updated when vendor clicks stages
  const [liveDates, setLiveDates] = useState<Record<string, string>>({});

  const timelineDates: Record<string, string> = {
    ...(orderDate ? { placed: orderDate } : {}),
    ...(order?.confirmedAt || orderDate ? { confirmed: order?.confirmedAt || orderDate } : {}),
    ...(order?.shippedAt ? { shipped: order.shippedAt } : {}),
    ...(order?.ofdAt ? { ofd: order.ofdAt } : {}),
    ...(order?.deliveredAt ? { delivered: order.deliveredAt } : {}),
    ...liveDates, // live updates override DB values
  };

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
              {status === "DELIVERED" && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Star className="h-4 w-4" />
                  Write a Review
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowComplainModal(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
              >
                <AlertTriangle className="h-4 w-4" />
                File a Complaint
              </button>
              {["DELIVERED", "CONFIRMED", "SHIPPED", "OFD"].includes(status) && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                >
                  <ReceiptText className="h-4 w-4" />
                  Request Refund
                </button>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4" />
                {t("need_help")}
              </button>
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
          <TrackingChatPanel
            sellerName={sellerName}
            langDir={langDir}
            status={status}
            orderId={orderInfo?.orderNo || String(params?.id)}
            onStatusChange={(newStatus) => {
              const now = new Date().toISOString();
              setLiveStatus(newStatus);
              // Update timeline date for the step that just changed
              const statusToDateKey: Record<string, string> = {
                CONFIRMED: "confirmed",
                SHIPPED: "shipped",
                OFD: "ofd",
                DELIVERED: "delivered",
              };
              const dateKey = statusToDateKey[newStatus];
              if (dateKey) {
                setLiveDates((prev) => {
                  const next = { ...prev, [dateKey]: now };
                  // Also fill in earlier steps if they don't have dates yet
                  const order = ["confirmed", "shipped", "ofd", "delivered"];
                  const idx = order.indexOf(dateKey);
                  for (let i = 0; i < idx; i++) {
                    if (!next[order[i]] && !timelineDates[order[i]]) {
                      next[order[i]] = now;
                    }
                  }
                  return next;
                });
              }
              // TODO: call backend API to persist status change
              // e.g. updateOrderStatus.mutate({ orderProductId: params?.id, status: newStatus })
            }}
          />
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

      {/* ═══ Complaint Modal ═══ */}
      {showComplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4 z-10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold">File a Complaint</h2>
              </div>
              <button type="button" onClick={() => setShowComplainModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Order</label>
                <p className="text-sm font-medium">#{orderInfo?.orderNo} — {product.productName || "Product"}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Complaint Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "damaged", label: "Damaged Item", emoji: "💔" },
                    { key: "wrong_item", label: "Wrong Item", emoji: "❌" },
                    { key: "missing_parts", label: "Missing Parts", emoji: "🧩" },
                    { key: "not_as_described", label: "Not as Described", emoji: "📝" },
                    { key: "late_delivery", label: "Late Delivery", emoji: "⏰" },
                    { key: "poor_quality", label: "Poor Quality", emoji: "👎" },
                    { key: "seller_issue", label: "Seller Issue", emoji: "🏪" },
                    { key: "other", label: "Other", emoji: "💬" },
                  ].map((t) => (
                    <button key={t.key} type="button" onClick={() => setComplainType(t.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
                        complainType === t.key
                          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                          : "border-border hover:bg-muted",
                      )}>
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Describe your issue</label>
                <textarea value={complainText} onChange={(e) => setComplainText(e.target.value)}
                  placeholder="Tell us what went wrong..." rows={4}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Attach Evidence (optional)</label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-6 text-center hover:border-amber-400 transition-colors cursor-pointer">
                  <div>
                    <Download className="mx-auto mb-1 h-5 w-5 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Drop images or click to upload</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
              <button type="button" onClick={() => setShowComplainModal(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!complainType || !complainText.trim()}
                onClick={() => { setShowComplainModal(false); setComplainType(""); setComplainText(""); }}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Refund Modal ═══ */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4 z-10">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold">Request Refund</h2>
              </div>
              <button type="button" onClick={() => setShowRefundModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-semibold">#{orderInfo?.orderNo}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-lg font-bold text-primary">{currency.symbol}{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Reason for Refund</label>
                <div className="space-y-2">
                  {[
                    { key: "defective", label: "Product is defective or damaged" },
                    { key: "not_as_described", label: "Product not as described" },
                    { key: "wrong_item", label: "Received wrong item" },
                    { key: "no_longer_needed", label: "No longer needed" },
                    { key: "found_better_price", label: "Found a better price" },
                    { key: "late_delivery", label: "Delivery was too late" },
                    { key: "other", label: "Other reason" },
                  ].map((r) => (
                    <button key={r.key} type="button" onClick={() => setRefundReason(r.key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start text-sm transition-all",
                        refundReason === r.key
                          ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                          : "border-border hover:bg-muted",
                      )}>
                      <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        refundReason === r.key ? "border-red-500 bg-red-500" : "border-muted-foreground/30")}>
                        {refundReason === r.key && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Additional Details (optional)</label>
                <textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Any additional information..." rows={3}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none" />
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Refund requests are reviewed within 24-48 hours. The refund will be processed to your original payment method.
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
              <button type="button" onClick={() => setShowRefundModal(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button type="button" disabled={!refundReason}
                onClick={() => { setShowRefundModal(false); setRefundReason(""); setRefundNotes(""); }}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                Submit Refund Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
