"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMessageStore, type ChannelCount } from "@/lib/messageStore";
import { Bell, Shield, Store, UserCheck, Package, CreditCard, Users, MessageSquare, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Hash, Star, AlertTriangle, FileText, ShoppingBag, Wrench, ShoppingCart, Truck, RotateCcw, Scale, Wallet, Receipt, StickyNote, Bot } from "lucide-react";

// Channel tree structure — icons, labels, hierarchy are static. Counts come from API via store.
const TREE_DEFAULT = [
  { id: "unread", icon: Bell, label: "Unread", labelAr: "غير مقروءة", color: "text-red-500", count: 0, children: [] },
  { id: "support", icon: Shield, label: "Support", labelAr: "الدعم", color: "text-green-600", count: 0, children: [
    { id: "s_bot", icon: Bot, label: "Bot Support", labelAr: "دعم المساعد", count: 0 },
    { id: "s_admin", icon: Shield, label: "Admin Support", labelAr: "دعم الإدارة", count: 0 },
    { id: "s_notifications", icon: Bell, label: "Notifications", labelAr: "الإشعارات", count: 0 },
  ]},
  { id: "vendor_ops", icon: Store, label: "Vendor Ops", labelAr: "عمليات البائع", color: "text-orange-600", count: 0, children: [
    { id: "v_questions", icon: MessageSquare, label: "Questions", labelAr: "أسئلة", count: 0 },
    { id: "v_reviews", icon: Star, label: "Reviews", labelAr: "التقييمات", count: 0 },
    { id: "v_complaints", icon: AlertTriangle, label: "Complaints", labelAr: "الشكاوى", count: 0 },
    { id: "v_rfq", icon: FileText, label: "RFQ", labelAr: "طلبات أسعار", count: 0 },
    { id: "v_product", icon: ShoppingBag, label: "Product", labelAr: "المنتجات", count: 0 },
    { id: "v_service", icon: Wrench, label: "Service", labelAr: "الخدمات", count: 0 },
    { id: "v_buygroup", icon: ShoppingCart, label: "Buy Group", labelAr: "مجموعات شراء", count: 0 },
  ]},
  { id: "customer_ops", icon: UserCheck, label: "Customer", labelAr: "العملاء", color: "text-blue-600", count: 0, children: [
    { id: "c_questions", icon: MessageSquare, label: "Questions", labelAr: "أسئلة", count: 0 },
    { id: "c_reviews", icon: Star, label: "My Reviews", labelAr: "تقييماتي", count: 0 },
    { id: "c_complaints", icon: AlertTriangle, label: "Complaints", labelAr: "شكاوى", count: 0 },
    { id: "c_rfq", icon: FileText, label: "My RFQ", labelAr: "طلباتي", count: 0 },
    { id: "c_product", icon: ShoppingBag, label: "Product Chat", labelAr: "محادثات", count: 0 },
  ]},
  { id: "orders", icon: Package, label: "Orders", labelAr: "الطلبات", color: "text-purple-600", count: 0, children: [
    { id: "o_active", icon: Package, label: "Active", labelAr: "نشطة", count: 0 },
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
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  locale: string;
}

export default function MsgPanel1({ selectedId, collapsed, onToggleCollapse, onSelect, locale }: MsgPanel1Props) {
  const isAr = locale === "ar";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ vendor_ops: true, support: true });

  // ─── Read channel counts from Zustand store ───
  const { channelCounts } = useMessageStore();

  // Merge store counts into TREE_DEFAULT — store overrides hardcoded fallback counts
  const TREE = useMemo(() => {
    if (!channelCounts || channelCounts.length === 0) return TREE_DEFAULT;

    // Build lookup: id → count, plus child lookup
    const countMap = new Map<string, number>();
    const childCountMap = new Map<string, Map<string, number>>();
    for (const cc of channelCounts) {
      countMap.set(cc.id, cc.count);
      if (cc.children) {
        const childMap = new Map<string, number>();
        for (const ch of cc.children) {
          childMap.set(ch.id, ch.count);
        }
        childCountMap.set(cc.id, childMap);
      }
    }

    return TREE_DEFAULT.map((cat) => {
      const storeCount = countMap.get(cat.id);
      const storeChildMap = childCountMap.get(cat.id);
      const children = cat.children?.map((ch) => ({
        ...ch,
        count: storeChildMap?.get(ch.id) ?? ch.count,
      }));
      // If store has a parent count, use it; otherwise sum children or use fallback
      const parentCount = storeCount ?? (children
        ? children.reduce((sum, ch) => sum + ch.count, 0)
        : cat.count);
      return { ...cat, count: parentCount, children: children ?? cat.children };
    });
  }, [channelCounts]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Find which parent the selectedId belongs to
  const selectedParent = TREE.find((cat) => cat.children?.some((ch) => ch.id === selectedId));

  // ═══════════════════════════════════════════════
  // COLLAPSED — 130px compact icon + label
  // ═══════════════════════════════════════════════
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-muted/30 border-e border-border overflow-y-auto">
        <div className="py-1">
          {TREE.map((cat) => {
            const Icon = cat.icon;
            const isOpen = expanded[cat.id] ?? false;
            const hasChildren = cat.children && cat.children.length > 0;
            const isParentActive = selectedParent?.id === cat.id;
            const isDirectActive = cat.id === selectedId;
            const label = isAr && cat.labelAr ? cat.labelAr : cat.label;

            return (
              <div key={cat.id}>
                {/* L1: icon + short label */}
                <button type="button"
                  onClick={() => { if (hasChildren) toggle(cat.id); else onSelect(cat.id); }}
                  className={cn(
                    "flex w-full items-center gap-1.5 px-2 py-1.5 text-start transition-colors",
                    !hasChildren && isDirectActive ? "bg-primary/10 text-primary" :
                    isParentActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {hasChildren && (
                    isOpen ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                  )}
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", cat.color)} />
                  <span className="flex-1 text-[10px] font-bold truncate">{label}</span>
                  {cat.count > 0 && (
                    <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive text-[7px] font-bold text-white px-0.5 shrink-0">
                      {cat.count}
                    </span>
                  )}
                </button>

                {/* L2: compact children — icon + short name */}
                {isOpen && hasChildren && cat.children!.map((ch) => {
                  const ChIcon = ch.icon;
                  const isActive = ch.id === selectedId;
                  const chLabel = isAr && ch.labelAr ? ch.labelAr : ch.label;

                  return (
                    <button key={ch.id} type="button" onClick={() => onSelect(ch.id)}
                      className={cn(
                        "flex w-full items-center gap-1.5 ps-6 pe-2 py-1 text-start transition-colors",
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <ChIcon className={cn("h-3 w-3 shrink-0", isActive ? "" : "opacity-50")} />
                      <span className="flex-1 text-[9px] truncate">{chLabel}</span>
                      {ch.count > 0 && (
                        <span className={cn(
                          "flex h-3 min-w-3 items-center justify-center rounded-full text-[6px] font-bold px-0.5 shrink-0",
                          isActive ? "bg-primary text-primary-foreground" : "bg-destructive text-white"
                        )}>{ch.count}</span>
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

  // ═══════════════════════════════════════════════
  // EXPANDED — Discord-style channel list (240px)
  // ═══════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/30 border-e border-border overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {isAr ? "الرسائل" : "Messages"}
        </span>
      </div>

      <div className="py-2">
        {TREE.map((cat) => {
          const Icon = cat.icon;
          const isOpen = expanded[cat.id] ?? false;
          const hasChildren = cat.children && cat.children.length > 0;
          const isParentActive = selectedParent?.id === cat.id;
          const isDirectActive = cat.id === selectedId;
          const label = isAr && cat.labelAr ? cat.labelAr : cat.label;
          const totalCount = cat.count;

          return (
            <div key={cat.id} className="mb-1">
              {/* L1: Category header */}
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) toggle(cat.id);
                  else onSelect(cat.id);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-start transition-colors rounded-md mx-0",
                  !hasChildren && isDirectActive
                    ? "bg-primary/10 text-primary"
                    : isParentActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hasChildren ? (
                  isOpen
                    ? <ChevronDown className="h-3 w-3 shrink-0" />
                    : <ChevronRight className="h-3 w-3 shrink-0" />
                ) : (
                  <div className="w-3 shrink-0" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", cat.color)} />
                <span className="flex-1 text-xs font-bold uppercase tracking-wide truncate">{label}</span>
                {totalCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1 shrink-0">
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
                      "relative flex w-full items-center gap-2 ps-9 pe-3 py-1.5 text-start transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute start-0 top-1 bottom-1 w-[3px] bg-primary rounded-e-full" />
                    )}
                    {/* Unread indicator dot */}
                    {!isActive && ch.count > 0 && (
                      <div className="absolute start-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-foreground" />
                    )}
                    <ChIcon className={cn("h-4 w-4 shrink-0", isActive ? "" : "opacity-60")} />
                    <span className="flex-1 text-xs truncate">{chLabel}</span>
                    {ch.count > 0 && (
                      <span className={cn(
                        "flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-bold px-1 shrink-0",
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
