"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Bell, Shield, Store, UserCheck, Package, CreditCard, Users, MessageSquare, ChevronDown, ChevronRight, Hash, Star, AlertTriangle, FileText, ShoppingBag, Wrench, ShoppingCart, Truck, RotateCcw, Scale, Wallet, Receipt, StickyNote, Bot } from "lucide-react";

const TREE = [
  { id: "unread", icon: Bell, label: "Unread", labelAr: "غير مقروءة", color: "text-red-500", count: 12, children: [] },
  { id: "support", icon: Shield, label: "Support", labelAr: "الدعم", color: "text-green-600", count: 1, children: [
    { id: "s_bot", icon: Bot, label: "Bot Support", labelAr: "دعم المساعد", count: 0 },
    { id: "s_admin", icon: Shield, label: "Admin Support", labelAr: "دعم الإدارة", count: 1 },
    { id: "s_notifications", icon: Bell, label: "Notifications", labelAr: "الإشعارات", count: 4 },
  ]},
  { id: "vendor_ops", icon: Store, label: "Vendor Ops", labelAr: "عمليات البائع", color: "text-orange-600", count: 8, children: [
    { id: "v_questions", icon: MessageSquare, label: "Questions", labelAr: "أسئلة", count: 2 },
    { id: "v_reviews", icon: Star, label: "Reviews", labelAr: "التقييمات", count: 1 },
    { id: "v_complaints", icon: AlertTriangle, label: "Complaints", labelAr: "الشكاوى", count: 0 },
    { id: "v_rfq", icon: FileText, label: "RFQ", labelAr: "طلبات أسعار", count: 3 },
    { id: "v_product", icon: ShoppingBag, label: "Product", labelAr: "المنتجات", count: 2 },
    { id: "v_service", icon: Wrench, label: "Service", labelAr: "الخدمات", count: 0 },
    { id: "v_buygroup", icon: ShoppingCart, label: "Buy Group", labelAr: "مجموعات شراء", count: 0 },
  ]},
  { id: "customer_ops", icon: UserCheck, label: "Customer", labelAr: "العملاء", color: "text-blue-600", count: 4, children: [
    { id: "c_questions", icon: MessageSquare, label: "Questions", labelAr: "أسئلة", count: 1 },
    { id: "c_reviews", icon: Star, label: "My Reviews", labelAr: "تقييماتي", count: 0 },
    { id: "c_complaints", icon: AlertTriangle, label: "Complaints", labelAr: "شكاوى", count: 0 },
    { id: "c_rfq", icon: FileText, label: "My RFQ", labelAr: "طلباتي", count: 2 },
    { id: "c_product", icon: ShoppingBag, label: "Product Chat", labelAr: "محادثات", count: 1 },
  ]},
  { id: "orders", icon: Package, label: "Orders", labelAr: "الطلبات", color: "text-purple-600", count: 1, children: [
    { id: "o_active", icon: Package, label: "Active", labelAr: "نشطة", count: 1 },
    { id: "o_shipping", icon: Truck, label: "Shipping", labelAr: "الشحن", count: 0 },
    { id: "o_returns", icon: RotateCcw, label: "Returns", labelAr: "إرجاع", count: 0 },
    { id: "o_disputes", icon: Scale, label: "Disputes", labelAr: "نزاعات", count: 0 },
  ]},
  { id: "payment", icon: CreditCard, label: "Payment", labelAr: "الدفع", color: "text-emerald-600", count: 0, children: [
    { id: "p_issues", icon: CreditCard, label: "Issues", labelAr: "مشاكل", count: 0 },
    { id: "p_wallet", icon: Wallet, label: "Wallet", labelAr: "المحفظة", count: 0 },
    { id: "p_invoices", icon: Receipt, label: "Invoices", labelAr: "فواتير", count: 0 },
  ]},
  { id: "team", icon: Users, label: "Team", labelAr: "الفريق", color: "text-cyan-600", count: 0, children: [
    { id: "t_chat", icon: MessageSquare, label: "Team Chat", labelAr: "محادثة", count: 0 },
    { id: "t_notes", icon: StickyNote, label: "Notes", labelAr: "ملاحظات", count: 0 },
  ]},
];

interface MsgPanel1Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  locale: string;
}

export default function MsgPanel1({ selectedId, onSelect, locale }: MsgPanel1Props) {
  const isAr = locale === "ar";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ vendor_ops: true, support: true });

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Find which parent the selectedId belongs to
  const selectedParent = TREE.find((cat) => cat.children?.some((ch) => ch.id === selectedId));

  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/40 border-e border-border overflow-y-auto">
      <div className="py-1">
        {TREE.map((cat) => {
          const Icon = cat.icon;
          const isOpen = expanded[cat.id] ?? false;
          const hasChildren = cat.children && cat.children.length > 0;
          const isParentActive = selectedParent?.id === cat.id;
          const label = isAr && cat.labelAr ? cat.labelAr : cat.label;
          const totalCount = cat.count;

          return (
            <div key={cat.id}>
              {/* L1: Category header */}
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) toggle(cat.id);
                  else onSelect(cat.id);
                }}
                className={cn(
                  "flex w-full items-center gap-1.5 px-2 py-1.5 text-start transition-colors",
                  isParentActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hasChildren && (
                  isOpen
                    ? <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                    : <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                )}
                <Icon className={cn("h-3.5 w-3.5 shrink-0", cat.color)} />
                <span className="flex-1 text-[10px] font-bold uppercase tracking-wide truncate">{label}</span>
                {totalCount > 0 && (
                  <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive text-[7px] font-bold text-white px-0.5 shrink-0">
                    {totalCount}
                  </span>
                )}
              </button>

              {/* L2: Children */}
              {isOpen && hasChildren && cat.children!.map((ch) => {
                const ChIcon = ch.icon;
                const isActive = ch.id === selectedId;
                const chLabel = isAr && ch.labelAr ? ch.labelAr : ch.label;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onSelect(ch.id)}
                    className={cn(
                      "flex w-full items-center gap-1.5 ps-7 pe-2 py-1 text-start transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ChIcon className={cn("h-3 w-3 shrink-0", isActive ? "" : "opacity-50")} />
                    <span className="flex-1 text-[10px] truncate">{chLabel}</span>
                    {ch.count > 0 && (
                      <span className={cn(
                        "flex h-3 min-w-3 items-center justify-center rounded-full text-[7px] font-bold px-0.5 shrink-0",
                        isActive ? "bg-primary text-primary-foreground" : "bg-destructive text-white"
                      )}>
                        {ch.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
