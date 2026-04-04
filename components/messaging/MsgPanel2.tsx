"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMessageStore, type TreeItem as StoreTreeItem } from "@/lib/messageStore";
import { useTogglePin, useToggleArchive, useDeleteRoom } from "@/apis/queries/chat.queries";
import { Search, User, ShoppingBag, FileText, Star, MessageSquare, ShoppingCart, ChevronDown, ChevronRight, Trash2, Archive, Pin } from "lucide-react";

function timeAgo(mins: number) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

interface TreeChild {
  id: string;
  label: string;
  lastMsg?: string;
  time: number;
  unread: number;
  online?: boolean;
}

interface TreeItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: "product" | "session" | "person" | "review" | "order" | "buygroup";
  time: number;
  unread: number;
  online?: boolean;
  children?: TreeChild[]; // if has children → expand/collapse. if not → direct click to chat
}

// Merged P2+P3 data — tree structure
const CHANNEL_TREE: Record<string, { title: string; titleAr: string; items: TreeItem[] }> = {
  // Support — direct to chat (flat, no tree needed)
  s_bot: { title: "Bot Support", titleAr: "دعم المساعد", items: [
    { id: "bot-1", label: "Session #1", sublabel: "Product inquiry", icon: "session", time: 5, unread: 0 },
    { id: "bot-2", label: "Session #2", sublabel: "Shipping question", icon: "session", time: 120, unread: 0 },
  ]},
  s_admin: { title: "Admin Support", titleAr: "دعم الإدارة", items: [
    { id: "admin-1", label: "Ticket #1024", sublabel: "Account verification", icon: "session", time: 15, unread: 1 },
    { id: "admin-2", label: "Ticket #1019", sublabel: "Payment issue resolved", icon: "session", time: 1440, unread: 0 },
  ]},
  s_notifications: { title: "Notifications", titleAr: "الإشعارات", items: [] },

  // Vendor Ops — products → questions/reviews/complaints as children
  v_questions: { title: "Questions", titleAr: "أسئلة", items: [
    { id: "vq-1", label: "Sony WH-1000XM5", sublabel: "3 questions", icon: "product", time: 30, unread: 2, children: [
      { id: "vq1-q1", label: "Ahmed · Battery life?", lastMsg: "How long does the battery last?", time: 30, unread: 1, online: true },
      { id: "vq1-q2", label: "Sara · LDAC support?", lastMsg: "Does it support LDAC codec?", time: 120, unread: 1, online: false },
      { id: "vq1-q3", label: "Omar · Warranty", lastMsg: "What warranty do you offer?", time: 240, unread: 0, online: false },
    ]},
    { id: "vq-2", label: "MacBook Air M3", sublabel: "1 question", icon: "product", time: 120, unread: 0, children: [
      { id: "vq2-q1", label: "Fatima · RAM upgrade?", lastMsg: "Can I upgrade RAM later?", time: 60, unread: 0, online: false },
    ]},
  ]},
  v_reviews: { title: "Reviews", titleAr: "التقييمات", items: [
    { id: "vr-1", label: "Sony WH-1000XM5", sublabel: "⭐4.7 · 5 reviews", icon: "review", time: 240, unread: 1, children: [
      { id: "vr1-r1", label: "Ahmed ⭐⭐⭐⭐⭐", lastMsg: "Excellent noise cancelling!", time: 120, unread: 1, online: false },
      { id: "vr1-r2", label: "Sara ⭐⭐⭐⭐", lastMsg: "Good sound but tight fit.", time: 240, unread: 0, online: false },
      { id: "vr1-r3", label: "Nasser ⭐⭐⭐⭐⭐", lastMsg: "Battery lasts forever.", time: 480, unread: 0, online: false },
    ]},
    { id: "vr-2", label: "Samsung Galaxy S24", sublabel: "⭐4.3 · 2 reviews", icon: "review", time: 480, unread: 0, children: [
      { id: "vr2-r1", label: "Omar ⭐⭐⭐⭐", lastMsg: "Great camera, avg battery.", time: 360, unread: 0, online: false },
    ]},
  ]},
  v_complaints: { title: "Complaints", titleAr: "الشكاوى", items: [
    { id: "vc-1", label: "Sony WH-1000XM5", sublabel: "1 complaint", icon: "product", time: 60, unread: 1, children: [
      { id: "vc1-c1", label: "Ahmed · Defective", lastMsg: "Stopped working after 2 days", time: 30, unread: 1, online: true },
    ]},
  ]},
  v_rfq: { title: "RFQ", titleAr: "طلبات أسعار", items: [
    { id: "vrfq-1", label: "RFQ #5 · Bulk Electronics", sublabel: "2 products · 2 buyers", icon: "session", time: 20, unread: 2, children: [
      { id: "vrfq1-c1", label: "Ahmed Al-Busaidi", lastMsg: "Can you do 420 OMR per unit?", time: 5, unread: 1, online: true },
      { id: "vrfq1-c2", label: "Khalid Hassan", lastMsg: "Need 50 units, bulk price?", time: 45, unread: 1, online: false },
    ]},
    { id: "vrfq-2", label: "RFQ #6 · Audio Equipment", sublabel: "1 product · 1 buyer", icon: "session", time: 180, unread: 1, children: [
      { id: "vrfq2-c1", label: "Omar Al-Rawahi", lastMsg: "Need quote for 5 units", time: 180, unread: 1, online: false },
    ]},
  ]},
  v_product: { title: "Product Chat", titleAr: "محادثات المنتجات", items: [
    { id: "vp-prod1", label: "Sony WH-1000XM5", sublabel: "2 customers chatting", icon: "product", time: 5, unread: 2, children: [
      { id: "vp-1", label: "Ahmed Al-Busaidi", lastMsg: "About Sony headphones", time: 5, unread: 1, online: true },
      { id: "vp-2", label: "Fatima Al-Kindi", lastMsg: "Is this available in blue?", time: 60, unread: 1, online: false },
    ]},
    { id: "vp-prod2", label: "Samsung Galaxy S24", sublabel: "1 customer", icon: "product", time: 120, unread: 0, children: [
      { id: "vp-3", label: "Sara Al-Lawati", lastMsg: "What's the warranty?", time: 120, unread: 0, online: false },
    ]},
  ]},
  v_service: { title: "Service", titleAr: "الخدمات", items: [] },
  v_buygroup: { title: "Buy Group", titleAr: "مجموعات شراء", items: [
    { id: "vbg-1", label: "Headphones 50% Off", sublabel: "5/10 joined", icon: "buygroup", time: 60, unread: 0, children: [
      { id: "vbg1-p1", label: "Omar Al-Rawahi", lastMsg: "I want 2 units", time: 30, unread: 0, online: true },
      { id: "vbg1-p2", label: "Khalid Hassan", lastMsg: "Count me in for 3", time: 60, unread: 0, online: false },
    ]},
  ]},

  // Customer Ops
  c_questions: { title: "Questions", titleAr: "أسئلة", items: [
    { id: "cq-1", label: "Dell XPS 15", sublabel: "Your question", icon: "product", time: 90, unread: 1, children: [
      { id: "cq1-q1", label: "Your question", lastMsg: "What's the battery life?", time: 90, unread: 1, online: false },
    ]},
  ]},
  c_reviews: { title: "My Reviews", titleAr: "تقييماتي", items: [
    { id: "cr-1", label: "Sony WH-1000XM5", sublabel: "⭐⭐⭐⭐⭐", icon: "review", time: 500, unread: 0, children: [
      { id: "cr1-r1", label: "Your review ⭐⭐⭐⭐⭐", lastMsg: "Excellent, highly recommend!", time: 500, unread: 0, online: false },
    ]},
  ]},
  c_rfq: { title: "My RFQ", titleAr: "طلباتي", items: [
    { id: "crfq-1", label: "RFQ #5 · Bulk Electronics", sublabel: "2 vendors", icon: "session", time: 20, unread: 1, children: [
      { id: "crfq1-v1", label: "Tech Store Oman", lastMsg: "Quote: 10,700 OMR", time: 20, unread: 1, online: true },
      { id: "crfq1-v2", label: "Gulf Electronics", lastMsg: "We can offer 10,200 OMR", time: 45, unread: 0, online: false },
    ]},
    { id: "crfq-2", label: "RFQ #6 · Audio Equipment", sublabel: "1 vendor", icon: "session", time: 180, unread: 1, children: [
      { id: "crfq2-v1", label: "Audio World LLC", lastMsg: "700 OMR for 5 units", time: 90, unread: 1, online: true },
    ]},
  ]},
  c_complaints: { title: "My Complaints", titleAr: "شكاوى", items: [
    { id: "cc-1", label: "Sony WH-1000XM5", sublabel: "Defective unit", icon: "product", time: 120, unread: 0, children: [
      { id: "cc1-c1", label: "Your complaint", lastMsg: "Not charging", time: 120, unread: 0, online: false },
    ]},
  ]},
  c_product: { title: "Product Chat", titleAr: "محادثات", items: [
    { id: "cp-prod1", label: "Sony WH-1000XM5", sublabel: "2 vendors", icon: "product", time: 10, unread: 1, children: [
      { id: "cp-1", label: "Tech Store Oman", lastMsg: "About Sony headphones", time: 10, unread: 0, online: true },
      { id: "cp-2", label: "Gulf Electronics", lastMsg: "About bulk pricing", time: 90, unread: 1, online: false },
    ]},
  ]},

  // Orders — flat
  o_active: { title: "Active Orders", titleAr: "طلبات نشطة", items: [
    { id: "oa-1", label: "ORD-1234", sublabel: "Shipped · DHL", icon: "order", time: 60, unread: 1 },
  ]},
  o_shipping: { title: "Shipping", titleAr: "الشحن", items: [] },
  o_returns: { title: "Returns", titleAr: "إرجاع", items: [] },
  o_disputes: { title: "Disputes", titleAr: "نزاعات", items: [] },

  // Payment — flat
  p_issues: { title: "Issues", titleAr: "مشاكل", items: [] },
  p_wallet: { title: "Wallet", titleAr: "المحفظة", items: [] },
  p_invoices: { title: "Invoices", titleAr: "فواتير", items: [] },

  // Team — flat
  t_chat: { title: "Team Chat", titleAr: "محادثة", items: [
    { id: "tc-1", label: "Sara (Sales)", icon: "person", time: 30, unread: 0, online: true },
    { id: "tc-2", label: "Omar (Manager)", icon: "person", time: 120, unread: 0, online: false },
  ]},
  t_notes: { title: "Notes", titleAr: "ملاحظات", items: [] },

  // Unread — computed dynamically below, placeholder here
  unread: { title: "All Unread", titleAr: "جميع غير المقروءة", items: [] },
};

const ICON_MAP: Record<string, typeof MessageSquare> = {
  product: ShoppingBag, session: FileText, person: User, review: Star, order: ShoppingCart, buygroup: ShoppingCart,
};

interface MsgPanel2Props {
  channelId: string | null;
  selectedId: string | null;
  collapsed?: boolean;
  onSelect: (id: string) => void;
  locale: string;
}

// Collect all unread leaf items from every channel
// Accepts optional store data to check first, then falls back to CHANNEL_TREE
function collectAllUnread(storeItems: Record<string, StoreTreeItem[]>): TreeItem[] {
  const leaves: TreeItem[] = [];

  // Build a merged source: for each channel, use store data if present, else CHANNEL_TREE fallback
  const allSources: Record<string, { title: string; items: TreeItem[] }> = {};
  for (const [chId, ch] of Object.entries(CHANNEL_TREE)) {
    if (chId === "unread") continue;
    const fromStore = storeItems[chId];
    allSources[chId] = {
      title: ch.title,
      items: fromStore && fromStore.length > 0 ? (fromStore as TreeItem[]) : ch.items,
    };
  }
  // Also include any store channels not in CHANNEL_TREE
  for (const [chId, items] of Object.entries(storeItems)) {
    if (chId === "unread" || allSources[chId]) continue;
    allSources[chId] = { title: chId, items: items as TreeItem[] };
  }

  for (const [, ch] of Object.entries(allSources)) {
    for (const item of ch.items) {
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (child.unread > 0) {
            leaves.push({
              id: child.id,
              label: child.label,
              sublabel: `${child.lastMsg ?? ""} · ${ch.title}`,
              icon: "person",
              time: child.time,
              unread: child.unread,
              online: child.online,
            });
          }
        }
      } else {
        if (item.unread > 0) {
          leaves.push({
            id: item.id,
            label: item.label,
            sublabel: `${item.sublabel ?? ""} · ${ch.title}`,
            icon: item.icon,
            time: item.time,
            unread: item.unread,
            online: item.online,
          });
        }
      }
    }
  }
  return leaves.sort((a, b) => a.time - b.time);
}

export default function MsgPanel2({ channelId, selectedId, collapsed, onSelect, locale }: MsgPanel2Props) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // ─── Read from Zustand store first, fallback to CHANNEL_TREE mock ───
  const { channelItems: storeChannelItems, markAsRead } = useMessageStore();
  const storeItems = channelId ? storeChannelItems[channelId] : undefined;

  // ─── Mutations: Pin, Archive, Delete (call real backend) ───
  const pinMutation = useTogglePin();
  const archiveMutation = useToggleArchive();
  const deleteMutation = useDeleteRoom();

  // For "unread" channel, dynamically collect all unread leaves (store-aware)
  const config = channelId ? CHANNEL_TREE[channelId] : null;
  const isUnread = channelId === "unread";

  // Real data only — from store. Mock CHANNEL_TREE used only for title lookup.
  const items = useMemo(() => {
    if (isUnread) return collectAllUnread(storeChannelItems);
    if (storeItems && storeItems.length > 0) return storeItems as TreeItem[];
    return [];
  }, [isUnread, storeChannelItems, storeItems]);

  const title = isUnread
    ? (locale === "ar" ? "جميع غير المقروءة" : "All Unread")
    : config ? (locale === "ar" && config.titleAr ? config.titleAr : config.title) : (channelId ?? "");

  // Wrap onSelect to also mark as read in the store
  const handleSelect = (id: string) => {
    onSelect(id);
    // Mark conversation as read in the store (id is used as roomId proxy)
    markAsRead(id);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Find which parent has the selected child
  const activeParent = items.find((it) => it.children?.some((ch) => ch.id === selectedId));

  const filtered = search
    ? items.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()) || p.sublabel?.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (!channelId) {
    return (
      <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <MessageSquare className="h-10 w-10 mb-2 opacity-15" />
          <p className="text-sm">{isAr ? "اختر قناة" : "Select a channel"}</p>
        </div>
      </div>
    );
  }

  // ─── COLLAPSED: 130px — same tree style as P1 collapsed ───
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 border-e border-border bg-muted/30 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center px-2 py-1.5 border-b border-border shrink-0">
          <span className="text-[10px] font-bold truncate">{title}</span>
        </div>
        <div className="py-1">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? MessageSquare;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = expanded[item.id] ?? false;
            const isParent = activeParent?.id === item.id;
            const isDirectActive = item.id === selectedId;

            return (
              <div key={item.id}>
                <button type="button"
                  onClick={() => hasChildren ? toggle(item.id) : handleSelect(item.id)}
                  className={cn(
                    "flex w-full items-center gap-1.5 px-2 py-1.5 text-start transition-colors",
                    isDirectActive ? "bg-primary/10 text-primary" : isParent ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {hasChildren ? (isOpen ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />) : <div className="w-2.5 shrink-0" />}
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 text-[10px] font-bold truncate">{item.label}</span>
                  {item.unread > 0 && (
                    <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive text-[7px] font-bold text-white px-0.5 shrink-0">{item.unread}</span>
                  )}
                </button>
                {isOpen && hasChildren && item.children!.map((ch) => (
                  <button key={ch.id} type="button" onClick={() => handleSelect(ch.id)}
                    className={cn(
                      "flex w-full items-center gap-1.5 ps-6 pe-2 py-1 text-start transition-colors",
                      ch.id === selectedId ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                    <User className={cn("h-3 w-3 shrink-0", ch.id === selectedId ? "" : "opacity-50")} />
                    <span className="flex-1 text-[9px] truncate">{ch.label}</span>
                    {ch.unread > 0 && <span className="flex h-3 min-w-3 items-center justify-center rounded-full bg-destructive text-[6px] font-bold text-white px-0.5 shrink-0">{ch.unread}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── EXPANDED: 260px — same tree style as P1 expanded ───
  return (
    <div className="flex flex-col h-full min-h-0 border-e border-border bg-muted/30 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
      </div>

      <div className="py-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-15" />
            <p className="text-xs">{isAr ? "لا توجد عناصر" : "No items"}</p>
          </div>
        )}

        {filtered.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? MessageSquare;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = expanded[item.id] ?? false;
          const isParent = activeParent?.id === item.id;
          const isDirectActive = item.id === selectedId;

          return (
            <div key={item.id} className="mb-1">
              {/* L1: row — same style as P1 */}
              <div className={cn(
                "group flex w-full items-center gap-2 px-3 py-2 transition-colors",
                isDirectActive
                  ? "bg-primary/10 text-primary"
                  : isParent
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
              )}>
                <button type="button"
                  onClick={() => hasChildren ? toggle(item.id) : handleSelect(item.id)}
                  className="flex flex-1 items-center gap-2 text-start min-w-0">
                  {hasChildren ? (
                    isOpen
                      ? <ChevronDown className="h-3 w-3 shrink-0" />
                      : <ChevronRight className="h-3 w-3 shrink-0" />
                  ) : (
                    <div className="w-3 shrink-0" />
                  )}
                  <Icon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1 text-xs font-bold truncate">{item.label}</span>
                </button>
                {/* Per-item actions — visible on hover */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" title={isAr ? "تثبيت" : "Pin"} onClick={(e) => { e.stopPropagation(); const numId = Number(item.id); if (!isNaN(numId)) pinMutation.mutate(numId); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-amber-600">
                    <Pin className="h-3 w-3" />
                  </button>
                  <button type="button" title={isAr ? "أرشفة" : "Archive"} onClick={(e) => { e.stopPropagation(); const numId = Number(item.id); if (!isNaN(numId)) archiveMutation.mutate(numId); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-blue-600">
                    <Archive className="h-3 w-3" />
                  </button>
                  <button type="button" title={isAr ? "حذف" : "Delete"} onClick={(e) => { e.stopPropagation(); const numId = Number(item.id); if (!isNaN(numId)) deleteMutation.mutate(numId); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {/* Badge — hidden when actions show */}
                {item.unread > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1 shrink-0 group-hover:hidden">
                    {item.unread}
                  </span>
                )}
              </div>

              {/* L2: children — same style as P1 children */}
              {isOpen && hasChildren && item.children!.map((ch) => {
                const isActive = ch.id === selectedId;

                return (
                  <div key={ch.id} className={cn(
                    "group/ch relative flex w-full items-center gap-2 ps-9 pe-3 py-1.5 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}>
                    {isActive && <div className="absolute start-0 top-1 bottom-1 w-[3px] bg-primary rounded-e-full" />}
                    {!isActive && ch.unread > 0 && <div className="absolute start-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-foreground" />}
                    <button type="button" onClick={() => handleSelect(ch.id)} className="flex flex-1 items-center gap-2 text-start min-w-0">
                      <User className={cn("h-4 w-4 shrink-0", isActive ? "" : "opacity-60")} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate block">{ch.label}</span>
                        {ch.lastMsg && <p className={cn("text-[10px] truncate", ch.unread > 0 ? "text-foreground/70" : "text-muted-foreground")}>{ch.lastMsg}</p>}
                      </div>
                    </button>
                    {/* Per-child actions — on hover */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/ch:opacity-100 transition-opacity">
                      <button type="button" title={isAr ? "تثبيت" : "Pin"} onClick={(e) => { e.stopPropagation(); const numId = Number(ch.id); if (!isNaN(numId)) pinMutation.mutate(numId); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-amber-600">
                        <Pin className="h-2.5 w-2.5" />
                      </button>
                      <button type="button" title={isAr ? "أرشفة" : "Archive"} onClick={(e) => { e.stopPropagation(); const numId = Number(ch.id); if (!isNaN(numId)) archiveMutation.mutate(numId); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-blue-600">
                        <Archive className="h-2.5 w-2.5" />
                      </button>
                      <button type="button" title={isAr ? "حذف" : "Delete"} onClick={(e) => { e.stopPropagation(); const numId = Number(ch.id); if (!isNaN(numId)) deleteMutation.mutate(numId); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    {/* Badge + online — hidden when actions show */}
                    <div className="flex items-center gap-1 shrink-0 group-hover/ch:hidden">
                      <span className="text-[9px] text-muted-foreground">{timeAgo(ch.time)}</span>
                      {ch.unread > 0 && (
                        <span className={cn(
                          "flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-bold px-1",
                          isActive ? "bg-primary text-primary-foreground" : "bg-destructive text-white"
                        )}>{ch.unread}</span>
                      )}
                      {ch.online && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── Archived section at bottom ── */}
        <div className="mt-2 border-t border-border pt-1">
          <button type="button"
            onClick={() => toggle("__archived")}
            className="flex w-full items-center gap-2 px-3 py-2 text-start text-muted-foreground hover:text-foreground transition-colors">
            {expanded["__archived"]
              ? <ChevronDown className="h-3 w-3 shrink-0" />
              : <ChevronRight className="h-3 w-3 shrink-0" />
            }
            <Archive className="h-4 w-4 shrink-0 opacity-50" />
            <span className="flex-1 text-xs font-bold uppercase tracking-wide truncate">{isAr ? "الأرشيف" : "Archived"}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">2</span>
          </button>

          {expanded["__archived"] && (
            <>
              {/* Archived items — will come from API when wired */}
              {([] as { id: string; label: string; sublabel: string; icon: "session" | "product" }[]).map((arch) => {
                const ArchIcon = ICON_MAP[arch.icon] ?? MessageSquare;
                return (
                  <div key={arch.id} className="group flex w-full items-center gap-2 ps-9 pe-3 py-1.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    <button type="button" onClick={() => handleSelect(arch.id)} className="flex flex-1 items-center gap-2 text-start min-w-0">
                      <ArchIcon className="h-4 w-4 shrink-0 opacity-40" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate block">{arch.label}</span>
                        <p className="text-[10px] truncate opacity-60">{arch.sublabel}</p>
                      </div>
                    </button>
                    {/* Restore / Delete */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" title={isAr ? "استعادة" : "Restore"} onClick={(e) => e.stopPropagation()}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-blue-600">
                        <Archive className="h-3 w-3" />
                      </button>
                      <button type="button" title={isAr ? "حذف نهائي" : "Delete"} onClick={(e) => e.stopPropagation()}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
