/**
 * Shared constants for order module components.
 * All label strings reference i18n translation keys.
 */

import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Order status flow (buyer + seller cards, timeline)
// ---------------------------------------------------------------------------

export interface StatusConfig {
  label: string; // i18n key
  color: string;
  bgBar: string;
  icon: LucideIcon;
  step: number;
}

export const ORDER_STATUS: Record<string, StatusConfig> = {
  PLACED: {
    label: "placed",
    color: "text-slate-600",
    bgBar: "bg-slate-400",
    icon: Clock,
    step: 0,
  },
  CONFIRMED: {
    label: "confirmed",
    color: "text-blue-600",
    bgBar: "bg-blue-500",
    icon: CheckCircle2,
    step: 1,
  },
  SHIPPED: {
    label: "shipped",
    color: "text-indigo-600",
    bgBar: "bg-indigo-500",
    icon: Truck,
    step: 2,
  },
  OFD: {
    label: "on_the_way",
    color: "text-amber-600",
    bgBar: "bg-amber-500",
    icon: Truck,
    step: 3,
  },
  DELIVERED: {
    label: "delivered",
    color: "text-emerald-600",
    bgBar: "bg-emerald-500",
    icon: PackageCheck,
    step: 4,
  },
  CANCELLED: {
    label: "cancelled",
    color: "text-red-500",
    bgBar: "bg-red-500",
    icon: XCircle,
    step: -1,
  },
};

// ---------------------------------------------------------------------------
// Seller flow steps (advance status)
// ---------------------------------------------------------------------------

export const FLOW = [
  { key: "PLACED", label: "placed", icon: Clock, color: "text-slate-600", bgBar: "bg-slate-400" },
  { key: "CONFIRMED", label: "confirmed", icon: CheckCircle2, color: "text-blue-600", bgBar: "bg-blue-500" },
  { key: "SHIPPED", label: "shipped", icon: Truck, color: "text-indigo-600", bgBar: "bg-indigo-500" },
  { key: "OFD", label: "on_the_way", icon: Truck, color: "text-amber-600", bgBar: "bg-amber-500" },
  { key: "DELIVERED", label: "delivered", icon: PackageCheck, color: "text-emerald-600", bgBar: "bg-emerald-500" },
] as const;

export function getFlowItem(key: string) {
  return FLOW.find((f) => f.key === key) || FLOW[0];
}

export function getNextFlowItem(key: string) {
  const idx = FLOW.findIndex((f) => f.key === key);
  return idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
}

// ---------------------------------------------------------------------------
// Frontend → Backend status mapping
// ---------------------------------------------------------------------------

export const STATUS_MAP: Record<string, string> = {
  PLACED: "pending",
  CONFIRMED: "processing",
  SHIPPED: "shipped",
  OFD: "ofd",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// ---------------------------------------------------------------------------
// Timeline steps (order detail page)
// ---------------------------------------------------------------------------

export const TIMELINE_STEPS = [
  { key: "PLACED", label: "order_received" },
  { key: "CONFIRMED", label: "order_confirmed" },
  { key: "SHIPPED", label: "shipped" },
  { key: "OFD", label: "out_for_delivery" },
  { key: "DELIVERED", label: "delivered" },
] as const;

export function stepIndex(status: string): number {
  if (status === "CANCELLED") return -1;
  const map: Record<string, number> = {
    PLACED: 0,
    CONFIRMED: 1,
    SHIPPED: 2,
    OFD: 3,
    DELIVERED: 4,
  };
  return map[status] ?? 0;
}

// ---------------------------------------------------------------------------
// Delivery stages (tracking chat panel)
// ---------------------------------------------------------------------------

export const STAGE_TO_STATUS: Record<string, string> = {
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

export const DELIVERY_STAGES = [
  {
    group: "pickup",
    stages: [
      { key: "shipment_created", label: "shipment_created", emoji: "📋", msg: "shipment_label_created" },
      { key: "picked_up", label: "picked_up", emoji: "📦", msg: "package_picked_up" },
    ],
  },
  {
    group: "in_transit",
    stages: [
      { key: "at_origin_facility", label: "at_origin_facility", emoji: "🏭", msg: "arrived_origin_facility" },
      { key: "departed_origin", label: "departed_origin", emoji: "✈️", msg: "departed_origin_facility" },
      { key: "in_transit", label: "in_transit", emoji: "🚚", msg: "in_transit_destination" },
      { key: "at_destination_facility", label: "at_destination", emoji: "🏬", msg: "arrived_destination_facility" },
      { key: "customs_clearance", label: "customs_clearance", emoji: "🛃", msg: "in_customs_clearance" },
      { key: "cleared_customs", label: "cleared_customs", emoji: "✅", msg: "cleared_customs_msg" },
    ],
  },
  {
    group: "last_mile",
    stages: [
      { key: "at_local_hub", label: "at_local_hub", emoji: "📍", msg: "arrived_local_hub" },
      { key: "out_for_delivery", label: "out_for_delivery", emoji: "🛵", msg: "out_for_delivery_msg" },
      { key: "delivery_attempt", label: "delivery_attempted", emoji: "🚪", msg: "delivery_attempted_msg" },
      { key: "delivered", label: "delivered", emoji: "✅", msg: "delivered_successfully" },
    ],
  },
  {
    group: "exceptions",
    stages: [
      { key: "held", label: "held_at_facility", emoji: "⏸️", msg: "held_awaiting_instructions" },
      { key: "returned", label: "returned_to_sender", emoji: "↩️", msg: "returned_to_sender_msg" },
      { key: "delayed", label: "delayed", emoji: "⚠️", msg: "delayed_msg" },
    ],
  },
] as const;

// Quick stages for seller card
export const QUICK_STAGES = [
  { key: "picked_up", label: "picked_up", emoji: "📦" },
  { key: "in_transit", label: "in_transit", emoji: "🚚" },
  { key: "at_hub", label: "at_local_hub", emoji: "📍" },
  { key: "out_delivery", label: "out_for_delivery", emoji: "🛵" },
  { key: "delivered", label: "delivered", emoji: "✅" },
  { key: "delayed", label: "delayed", emoji: "⚠️" },
] as const;

// ---------------------------------------------------------------------------
// Complaint types
// ---------------------------------------------------------------------------

export const COMPLAINT_TYPES = [
  { key: "damaged", label: "complaint_damaged", icon: "💔" },
  { key: "wrong", label: "complaint_wrong_item", icon: "❌" },
  { key: "missing", label: "complaint_missing_parts", icon: "🧩" },
  { key: "desc", label: "complaint_not_as_described", icon: "📝" },
  { key: "late", label: "complaint_late_delivery", icon: "⏰" },
  { key: "quality", label: "complaint_poor_quality", icon: "👎" },
  { key: "seller", label: "complaint_seller_issue", icon: "🏪" },
  { key: "other", label: "complaint_other", icon: "💬" },
] as const;

// ---------------------------------------------------------------------------
// Refund reasons
// ---------------------------------------------------------------------------

export const REFUND_REASONS = [
  { key: "defective", label: "refund_defective" },
  { key: "not_described", label: "refund_not_described" },
  { key: "wrong_item", label: "refund_wrong_item" },
  { key: "not_needed", label: "refund_not_needed" },
  { key: "better_price", label: "refund_better_price" },
  { key: "late_delivery", label: "refund_late_delivery" },
  { key: "other", label: "refund_other" },
] as const;

// ---------------------------------------------------------------------------
// Status filter chips (orders list page)
// ---------------------------------------------------------------------------

export const STATUS_FILTERS = [
  { value: "", label: "all", color: "bg-primary" },
  { value: "CONFIRMED", label: "confirmed", color: "bg-blue-500" },
  { value: "SHIPPED", label: "shipped", color: "bg-indigo-500" },
  { value: "OFD", label: "on_the_way", color: "bg-amber-500" },
  { value: "DELIVERED", label: "delivered", color: "bg-emerald-500" },
  { value: "CANCELLED", label: "cancelled", color: "bg-red-500" },
] as const;

// ---------------------------------------------------------------------------
// Date range helper
// ---------------------------------------------------------------------------

export function getYearDates(
  input: string,
): { startDate: string; endDate: string } {
  const currentDate = new Date();

  if (input === "last30") {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: currentDate.toISOString().slice(0, 10) + " 23:59:59",
    };
  }

  if (input === "older") {
    const startDate = new Date(currentDate.getFullYear() - 20, 0, 1);
    const endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
    return {
      startDate: `${startDate.getFullYear()}-01-01`,
      endDate: `${endDate.getFullYear()}-12-31`,
    };
  }

  const yearNumber = Number(input);
  if (isNaN(yearNumber) || yearNumber < 1000 || yearNumber > 9999) {
    return { startDate: "", endDate: "" };
  }

  return {
    startDate: `${yearNumber}-01-01`,
    endDate: `${yearNumber}-12-31`,
  };
}
