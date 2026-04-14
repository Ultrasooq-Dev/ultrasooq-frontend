"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Truck, Package, MapPin, Send, Zap, FileText,
  CheckCircle2, MessageCircle, User, PackageCheck,
} from "lucide-react";
import {
  useDeliveryTimeline,
  useUpdateOrderStatus,
  useAddOrderTracking,
} from "@/apis/queries/orders.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  DELIVERY_STAGES,
  STAGE_TO_STATUS,
  STATUS_MAP,
} from "./constants";
import type { TrackingChatPanelProps, TrackingMessage } from "./types";

const TEMPLATES = [
  "Your order has been shipped. Tracking will be updated shortly.",
  "Your package is out for delivery today.",
  "Thank you for your order! We're preparing it now.",
  "Please confirm receipt once you've received the product.",
];

const CONFIRM_ACTIONS = [
  { key: "freelancer", label: "Connect Freelancer", icon: User, desc: "Assign freelancer for delivery" },
  { key: "customer_pickup", label: "Customer Pickup", icon: PackageCheck, desc: "Customer will collect" },
  { key: "delivery_partner", label: "Delivery Partner", icon: Truck, desc: "Assign delivery company" },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrackingChatPanel({
  sellerName,
  langDir,
  status,
  orderId,
  onStatusChange,
}: TrackingChatPanelProps) {
  const t = useTranslations();
  const [viewMode, setViewMode] = useState<"vendor" | "customer">("customer");
  const isVendor = viewMode === "vendor";
  const [message, setMessage] = useState("");
  const [stageLocation, setStageLocation] = useState("");
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfirmMenu, setShowConfirmMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orderProductId = orderId.replace(/[^0-9]/g, "") || "0";
  const timelineQuery = useDeliveryTimeline(Number(orderProductId));
  const updateStatusMutation = useUpdateOrderStatus();
  const addTrackingMutation = useAddOrderTracking();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [messages, setMessages] = useState<TrackingMessage[]>([]);

  // Populate from API
  useEffect(() => {
    if (timelineQuery.data?.data?.length) {
      setMessages(
        timelineQuery.data.data.map((ev: Record<string, unknown>) => ({
          id: String(ev.id),
          type: "stage" as const,
          emoji:
            ev.event === "TRACKING_ADDED"
              ? "📦"
              : ev.event === "RECEIVED"
                ? "✅"
                : "📋",
          stage: String(ev.event || ""),
          text:
            String(ev.note || "") ||
            String(ev.event || "").replace(/_/g, " "),
          location: (ev.metadata as Record<string, unknown>)?.location as string | undefined,
          time: String(ev.createdAt || ""),
          sender: (ev.actor === "BUYER" ? "customer" : "vendor") as
            | "customer"
            | "vendor",
        })),
      );
    }
  }, [timelineQuery.data]);

  const addMessage = (msg: Omit<TrackingMessage, "id" | "time">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}`, time: new Date().toISOString() },
    ]);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const handleStageSelect = (s: {
    key: string;
    label: string;
    emoji: string;
    msg: string;
  }) => {
    const loc = stageLocation.trim();
    addMessage({
      type: "stage",
      emoji: s.emoji,
      stage: s.label,
      text: s.msg + (loc ? ` — ${loc}` : ""),
      location: loc || undefined,
      sender: "vendor",
    });

    addTrackingMutation.mutate(
      {
        orderProductId: Number(orderProductId),
        trackingNumber: s.key,
        carrier: loc || "Manual Update",
        notes: `${s.emoji} ${s.label}${loc ? ` — ${loc}` : ""}`,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["delivery-timeline"] });
          queryClient.invalidateQueries({ queryKey: ["order-by-id"] });
        },
      },
    );

    const newStatus = STAGE_TO_STATUS[s.key];
    if (newStatus) {
      const apiStatus = STATUS_MAP[newStatus] || newStatus.toLowerCase();
      updateStatusMutation.mutate({
        orderProductId: Number(orderProductId),
        status: apiStatus,
      });
      onStatusChange?.(newStatus);
    }
    setStageLocation("");
    setShowStageMenu(false);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    addMessage({ type: "text", text: message.trim(), sender: "vendor" });
    setMessage("");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {t("order_tracking")}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("customer")}
            className={cn(
              "rounded-md px-3 py-1 text-[10px] font-semibold transition-all",
              !isVendor
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("customer") || "Customer View"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("vendor")}
            className={cn(
              "rounded-md px-3 py-1 text-[10px] font-semibold transition-all",
              isVendor
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("vendor") || "Vendor View"}
          </button>
        </div>
      </div>

      {/* 2-panel layout */}
      <div className="flex h-[420px]">
        {/* Panel 1: Tracking Timeline */}
        <div className="flex w-64 shrink-0 flex-col border-e border-border">
          <div className="border-b border-border bg-muted/20 px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("delivery_timeline")}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="relative">
              <div className="absolute start-[7px] top-2 bottom-2 w-[2px] bg-border" />
              <div className="space-y-0">
                {messages
                  .filter((m) => m.type === "stage")
                  .map((m, i, arr) => {
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={m.id} className="relative flex gap-3 pb-5">
                        <div
                          className={cn(
                            "relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                            isLast
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-emerald-500 bg-card",
                          )}
                        >
                          {isLast && (
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{m.emoji}</span>
                            <span className="text-[11px] font-semibold leading-tight">
                              {m.stage}
                            </span>
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
                <p className="text-[11px] text-muted-foreground/40">
                  {t("no_tracking_updates") || "No tracking updates yet"}
                </p>
              </div>
            )}
          </div>

          {/* Stage quick-add (vendor only) */}
          {isVendor && (
            <div className="border-t border-border px-3 py-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowStageMenu(!showStageMenu);
                    setShowTemplates(false);
                    setShowConfirmMenu(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-colors",
                    showStageMenu
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",
                  )}
                >
                  <Package className="h-3 w-3" />
                  + {t("add_stage_update") || "Add Stage Update"}
                </button>

                {showStageMenu && (
                  <div className="absolute bottom-full start-0 z-20 mb-2 w-72 rounded-xl border border-border bg-card shadow-2xl">
                    <div className="border-b border-border px-3 py-2">
                      <span className="text-[11px] font-bold">
                        {t("select_delivery_stage") || "Select Delivery Stage"}
                      </span>
                    </div>
                    <div className="border-b border-border px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <input
                          type="text"
                          value={stageLocation}
                          onChange={(e) => setStageLocation(e.target.value)}
                          placeholder={t("location") || "Location"}
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
                              <span className="text-[11px] font-medium">
                                {s.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-3 py-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                      >
                        <Truck className="h-3 w-3" /> Connect Aramex / DHL API
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Messages / Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border bg-muted/20 px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isVendor
                ? "Messages with Customer"
                : `Messages with ${sellerName}`}
            </span>
          </div>

          {/* Message list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.sender === "customer" ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3.5 py-2.5",
                    m.type === "stage"
                      ? "border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : m.type === "confirm"
                        ? "border border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20"
                        : m.sender === "vendor"
                          ? "border border-primary/20 bg-primary/10"
                          : "bg-muted",
                  )}
                >
                  {m.type === "stage" && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs">{m.emoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {m.stage}
                      </span>
                    </div>
                  )}
                  {m.type === "confirm" && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-violet-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-400">
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
                  <span className="mt-1 block text-end text-[9px] text-muted-foreground/50">
                    {formatTime(m.time)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/10" />
                <p className="text-[11px] text-muted-foreground/40">
                  No messages yet
                </p>
              </div>
            )}
          </div>

          {/* Vendor action buttons */}
          {isVendor && (
            <div className="relative flex items-center gap-1.5 border-t border-border bg-muted/20 px-3 py-2">
              {/* Templates */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowStageMenu(false);
                    setShowConfirmMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors",
                    showTemplates
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400",
                  )}
                >
                  <Zap className="h-3 w-3" /> Templates
                </button>
                {showTemplates && (
                  <div className="absolute bottom-full start-0 z-20 mb-2 w-64 rounded-lg border border-border bg-card shadow-xl">
                    <div className="border-b border-border px-3 py-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Quick Templates
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1">
                      {TEMPLATES.map((tpl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setMessage(tpl);
                            setShowTemplates(false);
                          }}
                          className="w-full rounded-md px-3 py-1.5 text-start text-[11px] transition-colors hover:bg-muted"
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attach */}
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400"
              >
                <FileText className="h-3 w-3" /> Attach
              </button>

              {/* Confirm */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmMenu(!showConfirmMenu);
                    setShowTemplates(false);
                    setShowStageMenu(false);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors",
                    showConfirmMenu
                      ? "bg-violet-500 text-white"
                      : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400",
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" /> Confirm
                </button>
                {showConfirmMenu && (
                  <div className="absolute bottom-full start-0 z-20 mb-2 w-60 rounded-lg border border-border bg-card shadow-xl">
                    <div className="p-1">
                      {CONFIRM_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => {
                            addMessage({
                              type: "confirm",
                              text: a.desc,
                              sender: "vendor",
                            });
                            setShowConfirmMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start transition-colors hover:bg-muted"
                        >
                          <a.icon className="h-3.5 w-3.5 text-violet-500" />
                          <div>
                            <span className="text-[11px] font-semibold">
                              {a.label}
                            </span>
                            <p className="text-[9px] text-muted-foreground">
                              {a.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder={t("type_a_message") || "Type a message..."}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              dir={langDir}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
