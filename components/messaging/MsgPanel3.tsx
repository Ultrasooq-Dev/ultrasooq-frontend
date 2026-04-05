"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, User } from "lucide-react";

function timeAgo(mins: number) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

// P3 data keyed by P2 item ID
// Shows questions/reviews/complaints/people/vendors depending on channel type
const MOCK_P3: Record<string, Array<{ id: string; name: string; lastMsg: string; time: number; unread: number; online: boolean }>> = {
  // V: Questions → questions per product
  "vq-1": [ // Sony WH-1000XM5 questions
    { id: "vq1-q1", name: "Ahmed · Battery life?", lastMsg: "How long does the battery last with ANC on?", time: 30, unread: 1, online: true },
    { id: "vq1-q2", name: "Sara · LDAC support?", lastMsg: "Does it support LDAC codec?", time: 120, unread: 1, online: false },
    { id: "vq1-q3", name: "Omar · Warranty", lastMsg: "What warranty do you offer?", time: 240, unread: 0, online: false },
  ],
  "vq-2": [ // MacBook Air questions
    { id: "vq2-q1", name: "Fatima · RAM upgrade?", lastMsg: "Can I upgrade RAM later?", time: 60, unread: 0, online: false },
  ],

  // V: Reviews → reviews per product
  "vr-1": [ // Sony WH-1000XM5 reviews
    { id: "vr1-r1", name: "Ahmed ⭐⭐⭐⭐⭐", lastMsg: "Excellent noise cancelling! Best headphones.", time: 120, unread: 1, online: false },
    { id: "vr1-r2", name: "Sara ⭐⭐⭐⭐", lastMsg: "Good sound but tight on large heads.", time: 240, unread: 0, online: false },
    { id: "vr1-r3", name: "Nasser ⭐⭐⭐⭐⭐", lastMsg: "Battery lasts forever. Very comfortable.", time: 480, unread: 0, online: false },
  ],
  "vr-2": [ // Samsung reviews
    { id: "vr2-r1", name: "Omar ⭐⭐⭐⭐", lastMsg: "Great camera but average battery.", time: 360, unread: 0, online: false },
  ],

  // V: Complaints → complaints per product
  "vc-1": [ // Sony complaints
    { id: "vc1-c1", name: "Ahmed · Defective", lastMsg: "Unit stopped working after 2 days", time: 30, unread: 1, online: true },
  ],
  "vc-2": [ // Samsung complaints
    { id: "vc2-c1", name: "Sara · Wrong color", lastMsg: "Received blue instead of black", time: 240, unread: 0, online: false },
  ],

  // V: Buy Group → people per group product
  "vbg-1": [
    { id: "vbg1-p1", name: "Omar Al-Rawahi", lastMsg: "I want 2 units", time: 30, unread: 0, online: true },
    { id: "vbg1-p2", name: "Khalid Hassan", lastMsg: "Count me in for 3", time: 60, unread: 0, online: false },
  ],

  // Bot Support — sessions
  "s_bot": [
    { id: "bot-1", name: "Session #1", lastMsg: "Product inquiry", time: 5, unread: 0, online: false },
    { id: "bot-2", name: "Session #2", lastMsg: "Shipping question", time: 120, unread: 0, online: false },
  ],
  // Admin Support — sessions/tickets
  "s_admin": [
    { id: "admin-1", name: "Ticket #1024", lastMsg: "Account verification", time: 15, unread: 1, online: true },
    { id: "admin-2", name: "Ticket #1019", lastMsg: "Payment issue resolved", time: 1440, unread: 0, online: false },
  ],
  // V: RFQ — sessions
  "v_rfq": [
    { id: "vrfq-1", name: "RFQ #5 · Bulk Electronics", lastMsg: "2 products · Ahmed offered", time: 20, unread: 2, online: false },
    { id: "vrfq-2", name: "RFQ #6 · Audio Equipment", lastMsg: "1 product · Omar quoted", time: 180, unread: 1, online: false },
  ],
  // V: Product — customers
  "v_product": [
    { id: "vp-1", name: "Ahmed Al-Busaidi", lastMsg: "About Sony headphones", time: 5, unread: 1, online: true },
    { id: "vp-2", name: "Fatima Al-Kindi", lastMsg: "About Samsung phone", time: 60, unread: 1, online: false },
  ],
  // C: Product — vendors
  "c_product": [
    { id: "cp-1", name: "Tech Store Oman", lastMsg: "About Sony headphones", time: 10, unread: 0, online: true },
    { id: "cp-2", name: "Gulf Electronics", lastMsg: "About bulk pricing", time: 90, unread: 1, online: false },
  ],

  // All unread — aggregated from all channels, sorted by time
  "unread": [
    { id: "u-vp1", name: "Ahmed Al-Busaidi", lastMsg: "Can you do 420 OMR per unit? · Product Chat", time: 5, unread: 1, online: true },
    { id: "u-vp2", name: "Fatima Al-Kindi", lastMsg: "Is this available in blue? · Product Chat", time: 10, unread: 1, online: true },
    { id: "u-admin1", name: "Ticket #1024", lastMsg: "Account verification · Admin Support", time: 15, unread: 1, online: true },
    { id: "u-vrfq1", name: "RFQ #5 · Bulk Electronics", lastMsg: "Ahmed offered 420 OMR · RFQ", time: 20, unread: 2, online: false },
    { id: "u-crfq1", name: "Tech Store Oman", lastMsg: "Quote: 10,700 OMR · My RFQ", time: 20, unread: 1, online: true },
    { id: "u-vq1", name: "Ahmed · Battery life?", lastMsg: "Sony WH-1000XM5 · Questions", time: 30, unread: 1, online: true },
    { id: "u-vc1", name: "Ahmed · Defective unit", lastMsg: "Sony WH-1000XM5 · Complaints", time: 30, unread: 1, online: true },
    { id: "u-cp2", name: "Gulf Electronics", lastMsg: "Bulk pricing available · Product Chat", time: 90, unread: 1, online: false },
    { id: "u-vr1", name: "Ahmed ⭐⭐⭐⭐⭐", lastMsg: "Sony WH-1000XM5 · Reviews", time: 120, unread: 1, online: false },
    { id: "u-vrfq2", name: "RFQ #6 · Audio Equipment", lastMsg: "Omar quoted 700 OMR · RFQ", time: 180, unread: 1, online: false },
    { id: "u-crfq2", name: "Audio World LLC", lastMsg: "700 OMR for 5 units · My RFQ", time: 90, unread: 1, online: true },
    { id: "u-oa1", name: "Order #ORD-1234", lastMsg: "Shipped via DHL · Orders", time: 60, unread: 1, online: false },
  ],

  // C: Complaints → complaints per product
  "cc-1": [
    { id: "cc1-c1", name: "Your complaint", lastMsg: "Unit defective — not charging", time: 120, unread: 0, online: false },
  ],

  // C: Questions → questions per product (customer's own questions)
  "cq-1": [ // Dell questions
    { id: "cq1-q1", name: "Your question", lastMsg: "What's the battery life on this model?", time: 90, unread: 1, online: false },
  ],

  // C: Reviews → reviews per product (customer's own reviews)
  "cr-1": [
    { id: "cr1-r1", name: "Your review ⭐⭐⭐⭐⭐", lastMsg: "Excellent headphones, highly recommend!", time: 500, unread: 0, online: false },
  ],

  // C: RFQ → vendors per RFQ session
  "crfq-1": [
    { id: "crfq1-v1", name: "Tech Store Oman", lastMsg: "Quote: 10,700 OMR total", time: 20, unread: 1, online: true },
    { id: "crfq1-v2", name: "Gulf Electronics", lastMsg: "We can offer 10,200 OMR", time: 45, unread: 0, online: false },
  ],
  "crfq-2": [
    { id: "crfq2-v1", name: "Audio World LLC", lastMsg: "700 OMR for 5 units", time: 90, unread: 1, online: true },
  ],
};

interface MsgPanel3Props {
  channelId: string | null;
  selectedId: string | null;
  collapsed?: boolean;
  onSelect: (id: string) => void;
  locale: string;
}

export default function MsgPanel3({ channelId, selectedId, collapsed, onSelect, locale }: MsgPanel3Props) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const people = channelId ? (MOCK_P3[channelId] ?? []) : [];

  const filtered = search
    ? people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : people;

  // ─── COLLAPSED: 130px — centered avatar + name ───
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
        <div className="flex-1 overflow-y-auto">
          {people.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-15" />
            </div>
          )}
          {people.map((p) => (
            <button key={p.id} type="button" onClick={() => onSelect(p.id)}
              className={cn(
                "flex flex-col w-full items-center gap-1 px-1.5 py-2.5 text-center transition-colors border-b border-border/20",
                p.id === selectedId ? "bg-primary/5" : "hover:bg-muted/50"
              )}>
              <div className="relative">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold",
                  p.id === selectedId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {p.name.charAt(0)}
                </div>
                {p.online && <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />}
                {p.unread > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground px-0.5 border-2 border-background">
                    {p.unread}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] leading-tight w-full truncate", p.unread > 0 ? "font-bold" : "font-medium")}>
                {p.name.split(" · ")[0].split(" ").slice(0, 2).join(" ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── EXPANDED: 260px — full detail ───
  return (
    <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
      {/* Search */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "بحث..." : "Search people..."}
            className="w-full rounded-md border bg-muted/50 ps-8 pe-3 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mb-2 opacity-15" />
            <p className="text-xs">{isAr ? "لا توجد محادثات" : "No conversations"}</p>
          </div>
        )}

        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-3 text-start transition-colors border-b border-border/30",
              p.id === selectedId ? "bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                p.id === selectedId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {p.name.charAt(0)}
              </div>
              {/* Online dot */}
              {p.online && (
                <div className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm truncate",
                  p.unread > 0 ? "font-bold" : "font-medium"
                )}>
                  {p.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 ms-2">{timeAgo(p.time)}</span>
              </div>
              <p className={cn(
                "text-xs truncate mt-0.5",
                p.unread > 0 ? "text-foreground" : "text-muted-foreground"
              )}>
                {p.lastMsg}
              </p>
            </div>

            {/* Unread */}
            {p.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                {p.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
