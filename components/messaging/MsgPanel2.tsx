"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, User, ShoppingBag, FileText, Star, MessageSquare, ShoppingCart, Loader2 } from "lucide-react";

function timeAgo(mins: number) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

// Each channel type shows different items in P2
// "direct" = goes straight to P4 chat (no P3)
// "product" = shows products, clicking goes to P3 (people per product)
// "session" = shows sessions, clicking goes to P4 chat
// "person" = shows people, clicking goes to P4 chat

type ItemType = "direct" | "product" | "session" | "person";

interface P2Item {
  id: string;
  label: string;
  sublabel?: string;
  icon: "product" | "session" | "person" | "review" | "order" | "buygroup";
  time: number;
  unread: number;
  online?: boolean;
  goesTo: "panel3" | "panel4"; // where clicking leads
}

// Channel → item type + mock data
const CHANNEL_CONFIG: Record<string, { title: string; titleAr: string; items: P2Item[] }> = {
  // Support — direct to chat
  s_bot: { title: "Bot Support", titleAr: "دعم المساعد", items: [
    { id: "bot-1", label: "Session #1", sublabel: "Product inquiry", icon: "session", time: 5, unread: 0, goesTo: "panel4" },
    { id: "bot-2", label: "Session #2", sublabel: "Shipping question", icon: "session", time: 120, unread: 0, goesTo: "panel4" },
  ]},
  s_admin: { title: "Admin Support", titleAr: "دعم الإدارة", items: [
    { id: "admin-1", label: "Ticket #1024", sublabel: "Account verification", icon: "session", time: 15, unread: 1, goesTo: "panel4" },
    { id: "admin-2", label: "Ticket #1019", sublabel: "Payment issue", icon: "session", time: 1440, unread: 0, goesTo: "panel4" },
  ]},

  // Vendor Ops
  v_questions: { title: "Questions", titleAr: "أسئلة", items: [
    { id: "vq-1", label: "Sony WH-1000XM5", sublabel: "3 questions", icon: "product", time: 30, unread: 2, goesTo: "panel3" },
    { id: "vq-2", label: "MacBook Air M3", sublabel: "1 question", icon: "product", time: 120, unread: 0, goesTo: "panel3" },
  ]},
  v_reviews: { title: "Reviews", titleAr: "التقييمات", items: [
    { id: "vr-1", label: "Sony WH-1000XM5", sublabel: "⭐4.7 · 5 reviews", icon: "review", time: 240, unread: 1, goesTo: "panel3" },
    { id: "vr-2", label: "Samsung Galaxy S24", sublabel: "⭐4.3 · 2 reviews", icon: "review", time: 480, unread: 0, goesTo: "panel3" },
  ]},
  v_complaints: { title: "Complaints", titleAr: "الشكاوى", items: [
    { id: "vc-1", label: "Sony WH-1000XM5", sublabel: "Defective unit reported", icon: "product", time: 60, unread: 1, goesTo: "panel3" },
    { id: "vc-2", label: "Samsung Galaxy S24", sublabel: "Wrong color delivered", icon: "product", time: 480, unread: 0, goesTo: "panel3" },
  ]},
  v_rfq: { title: "RFQ", titleAr: "طلبات أسعار", items: [
    { id: "vrfq-1", label: "RFQ #5", sublabel: "Bulk Electronics · 2 products", icon: "session", time: 20, unread: 2, goesTo: "panel4" },
    { id: "vrfq-2", label: "RFQ #6", sublabel: "Audio Equipment · 1 product", icon: "session", time: 180, unread: 1, goesTo: "panel4" },
  ]},
  v_product: { title: "Product Chat", titleAr: "محادثات المنتجات", items: [
    { id: "vp-1", label: "Ahmed Al-Busaidi", sublabel: "About Sony headphones", icon: "person", time: 5, unread: 1, online: true, goesTo: "panel4" },
    { id: "vp-2", label: "Fatima Al-Kindi", sublabel: "About Samsung phone", icon: "person", time: 60, unread: 1, online: false, goesTo: "panel4" },
  ]},
  v_service: { title: "Service", titleAr: "الخدمات", items: [] },
  v_buygroup: { title: "Buy Group", titleAr: "مجموعات شراء", items: [
    { id: "vbg-1", label: "Headphones 50% Off", sublabel: "5/10 joined · Session #3", icon: "buygroup", time: 60, unread: 0, goesTo: "panel3" },
  ]},

  // Customer Ops
  c_questions: { title: "Questions", titleAr: "أسئلة", items: [
    { id: "cq-1", label: "Dell XPS 15", sublabel: "Your question about battery", icon: "product", time: 90, unread: 1, goesTo: "panel3" },
  ]},
  c_reviews: { title: "My Reviews", titleAr: "تقييماتي", items: [
    { id: "cr-1", label: "Sony WH-1000XM5", sublabel: "⭐⭐⭐⭐⭐ Your review", icon: "review", time: 500, unread: 0, goesTo: "panel3" },
  ]},
  c_rfq: { title: "My RFQ", titleAr: "طلباتي", items: [
    { id: "crfq-1", label: "RFQ #5", sublabel: "Bulk Electronics · 2 vendors", icon: "session", time: 20, unread: 1, goesTo: "panel3" },
    { id: "crfq-2", label: "RFQ #6", sublabel: "Audio Equipment · 1 vendor", icon: "session", time: 180, unread: 1, goesTo: "panel3" },
  ]},
  c_complaints: { title: "My Complaints", titleAr: "شكاوى", items: [
    { id: "cc-1", label: "Sony WH-1000XM5", sublabel: "Defective unit", icon: "product", time: 120, unread: 0, goesTo: "panel3" },
  ]},
  c_product: { title: "Product Chat", titleAr: "محادثات", items: [
    { id: "cp-1", label: "Tech Store Oman", sublabel: "About Sony headphones", icon: "person", time: 10, unread: 0, online: true, goesTo: "panel4" },
    { id: "cp-2", label: "Gulf Electronics", sublabel: "About bulk pricing", icon: "person", time: 90, unread: 1, online: false, goesTo: "panel4" },
  ]},

  // Orders
  o_active: { title: "Active Orders", titleAr: "طلبات نشطة", items: [
    { id: "oa-1", label: "ORD-1234", sublabel: "Shipped · DHL", icon: "order", time: 60, unread: 1, goesTo: "panel4" },
  ]},
  o_shipping: { title: "Shipping", titleAr: "الشحن", items: [] },
  o_returns: { title: "Returns", titleAr: "إرجاع", items: [] },
  o_disputes: { title: "Disputes", titleAr: "نزاعات", items: [] },

  // Payment
  p_issues: { title: "Issues", titleAr: "مشاكل", items: [] },
  p_wallet: { title: "Wallet", titleAr: "المحفظة", items: [] },
  p_invoices: { title: "Invoices", titleAr: "فواتير", items: [] },

  // Team
  t_chat: { title: "Team Chat", titleAr: "محادثة", items: [
    { id: "tc-1", label: "Sara (Sales)", icon: "person", time: 30, unread: 0, online: true, goesTo: "panel4" },
    { id: "tc-2", label: "Omar (Manager)", icon: "person", time: 120, unread: 0, online: false, goesTo: "panel4" },
  ]},
  t_notes: { title: "Notes", titleAr: "ملاحظات", items: [] },

  // Unread — all unread messages across all channels
  u_all: { title: "All Unread", titleAr: "غير مقروءة", items: [
    { id: "u-vq1q1", label: "Ahmed · Battery life?", sublabel: "V: Questions · Sony WH-1000XM5", icon: "product", time: 30, unread: 1, goesTo: "panel4" },
    { id: "u-vq1q2", label: "Sara · LDAC support?", sublabel: "V: Questions · Sony WH-1000XM5", icon: "product", time: 120, unread: 1, goesTo: "panel4" },
    { id: "u-vr1r1", label: "Ahmed ⭐⭐⭐⭐⭐", sublabel: "V: Reviews · Sony WH-1000XM5", icon: "review", time: 120, unread: 1, goesTo: "panel4" },
    { id: "u-vc1c1", label: "Ahmed · Defective", sublabel: "V: Complaints · Sony WH-1000XM5", icon: "product", time: 30, unread: 1, goesTo: "panel4" },
    { id: "u-vrfq1", label: "RFQ #5 · Ahmed", sublabel: "V: RFQ · Bulk Electronics", icon: "session", time: 20, unread: 1, goesTo: "panel4" },
    { id: "u-vrfq2", label: "RFQ #6 · Omar", sublabel: "V: RFQ · Audio Equipment", icon: "session", time: 180, unread: 1, goesTo: "panel4" },
    { id: "u-vp1", label: "Ahmed Al-Busaidi", sublabel: "V: Product · Sony headphones", icon: "person", time: 5, unread: 1, online: true, goesTo: "panel4" },
    { id: "u-vp2", label: "Fatima Al-Kindi", sublabel: "V: Product · Samsung phone", icon: "person", time: 60, unread: 1, online: false, goesTo: "panel4" },
    { id: "u-crfq1", label: "Tech Store Oman", sublabel: "C: RFQ #5 · Quote received", icon: "session", time: 20, unread: 1, goesTo: "panel4" },
    { id: "u-oa1", label: "Order #ORD-1234", sublabel: "Orders · Shipped via DHL", icon: "order", time: 60, unread: 1, goesTo: "panel4" },
    { id: "u-admin1", label: "Ticket #1024", sublabel: "Support · Account verification", icon: "session", time: 15, unread: 1, goesTo: "panel4" },
  ]},
  unread: { title: "All Unread", titleAr: "جميع غير المقروءة", items: [
    { id: "u-1", label: "Ahmed Al-Busaidi", sublabel: "Can you do 420 OMR per unit?", icon: "person", time: 5, unread: 1, online: true, goesTo: "panel4" },
    { id: "u-2", label: "Support Team", sublabel: "Your ticket has been resolved", icon: "session", time: 15, unread: 1, goesTo: "panel4" },
    { id: "u-3", label: "Tech Store Oman", sublabel: "Quote updated: 10,700 OMR", icon: "person", time: 20, unread: 1, online: true, goesTo: "panel4" },
    { id: "u-4", label: "Fatima Al-Kindi", sublabel: "Is this available in blue?", icon: "person", time: 10, unread: 1, online: true, goesTo: "panel4" },
    { id: "u-5", label: "Order #ORD-1234", sublabel: "Shipped via DHL", icon: "order", time: 60, unread: 1, goesTo: "panel4" },
  ]},
};

const ICON_MAP = {
  product: ShoppingBag,
  session: FileText,
  person: User,
  review: Star,
  order: ShoppingCart,
  buygroup: ShoppingCart,
};

interface MsgPanel2Props {
  channelId: string | null;
  selectedId: string | null;
  onSelectForPanel3: (id: string) => void; // item needs P3
  onSelectForPanel4: (id: string) => void; // item goes direct to chat
  locale: string;
}

export default function MsgPanel2({ channelId, selectedId, onSelectForPanel3, onSelectForPanel4, locale }: MsgPanel2Props) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const config = channelId ? CHANNEL_CONFIG[channelId] : null;
  const items = config?.items ?? [];
  const title = config ? (isAr && config.titleAr ? config.titleAr : config.title) : "";

  const filtered = search
    ? items.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()) || p.sublabel?.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (!channelId) {
    return (
      <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <MessageSquare className="h-8 w-8 mb-2 opacity-15" />
          <p className="text-[10px]">{isAr ? "اختر قناة" : "Select a channel"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <h3 className="text-[11px] font-bold">{title}</h3>
      </div>

      {/* Search */}
      {items.length > 2 && (
        <div className="px-2 py-1.5 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "بحث..." : "Search..."}
              className="w-full rounded-md border bg-muted/50 ps-7 pe-2 py-1 text-[10px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-6 w-6 mb-1.5 opacity-15" />
            <p className="text-[9px]">{isAr ? "لا توجد عناصر" : "No items"}</p>
          </div>
        )}

        {filtered.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? MessageSquare;
          const isSelected = item.id === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.goesTo === "panel3" ? onSelectForPanel3(item.id) : onSelectForPanel4(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors border-b border-border/30",
                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              {/* Avatar/Icon */}
              <div className="relative shrink-0">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  item.icon === "person" ? (isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground") :
                  item.icon === "product" || item.icon === "review" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20" :
                  item.icon === "session" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" :
                  "bg-muted text-muted-foreground"
                )}>
                  {item.icon === "person"
                    ? <span className="text-[10px] font-bold">{item.label.charAt(0)}</span>
                    : <Icon className="h-3.5 w-3.5" />}
                </div>
                {item.online && (
                  <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[11px] truncate", item.unread > 0 ? "font-bold" : "font-medium")}>{item.label}</span>
                  <span className="text-[8px] text-muted-foreground shrink-0 ms-1">{timeAgo(item.time)}</span>
                </div>
                {item.sublabel && (
                  <p className="text-[9px] text-muted-foreground truncate mt-0.5">{item.sublabel}</p>
                )}
              </div>

              {/* Unread + arrow indicator */}
              <div className="flex items-center gap-1 shrink-0">
                {item.unread > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground px-0.5">
                    {item.unread}
                  </span>
                )}
                {item.goesTo === "panel3" && (
                  <span className="text-[8px] text-muted-foreground/40">▶</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
