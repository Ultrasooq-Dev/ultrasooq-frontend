"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  X, MessageSquare, ShoppingBag, Send, Paperclip, Smile, Phone, Video, Info,
  Star, MapPin, Shield, Truck, Package, ChevronDown, CreditCard, FileText,
} from "lucide-react";

// Mock messages
const MOCK_MSGS = [
  { id: 1, own: false, name: "Ahmed", text: "Hi, I need bulk order of iPads and Dell laptops.", time: "10:30" },
  { id: 2, own: true, name: "You", text: "Hello! 10 iPads at 450 OMR, 10 Dell XPS at 650 OMR.", time: "10:32" },
  { id: 3, own: false, name: "Ahmed", text: "Can you do 400 OMR for iPads? Ordering 10 units.", time: "10:35" },
  { id: 4, own: true, name: "You", text: "420 OMR per unit for 10+. Best price.", time: "10:38" },
  { id: 5, own: false, name: "Ahmed", text: "Deal! Send updated quote.", time: "10:45" },
  { id: 6, own: true, name: "You", text: "Total: 10,700 OMR for 10 iPads + 10 Dell XPS.", time: "10:50" },
];

// Mock RFQ products — each has vendor alternatives
const MOCK_PRODUCT = {
  totalPrice: 10700,
  items: [
    {
      id: "rfq-p1",
      requestedName: "iPad Pro 12.9",
      requestedQty: 10,
      requestedBudget: "400-500 OMR",
      selected: 0, // which alternative is selected
      alternatives: [
        { id: "alt-1a", name: "iPad Pro 12.9 (256GB)", seller: "Tech Store Oman", price: 420, stock: 45, rating: 4.8 },
        { id: "alt-1b", name: "iPad Pro 12.9 (512GB)", seller: "Tech Store Oman", price: 520, stock: 20, rating: 4.8 },
        { id: "alt-1c", name: "iPad Air M2 (Similar)", seller: "Tech Store Oman", price: 350, stock: 80, rating: 4.6 },
      ],
    },
    {
      id: "rfq-p2",
      requestedName: "Dell XPS 15 Laptop",
      requestedQty: 10,
      requestedBudget: "600-700 OMR",
      selected: 0,
      alternatives: [
        { id: "alt-2a", name: "Dell XPS 15 (i7/16GB)", seller: "Tech Store Oman", price: 650, stock: 30, rating: 4.7 },
        { id: "alt-2b", name: "Dell XPS 15 (i9/32GB)", seller: "Tech Store Oman", price: 850, stock: 10, rating: 4.9 },
      ],
    },
  ],
};

// ─── RFQ Product Card — multi-select alternatives ───────────────
function RfqProductCard({ item, locale }: { item: typeof MOCK_PRODUCT.items[0]; locale: string }) {
  const isAr = locale === "ar";
  const [expanded, setExpanded] = useState(false);
  // Multi-select: each alt can be checked with its own qty
  const [selections, setSelections] = useState<Record<string, { checked: boolean; qty: number; price: number }>>(
    () => Object.fromEntries(item.alternatives.map((a, i) => [a.id, { checked: i === 0, qty: item.requestedQty, price: a.price }]))
  );

  const toggleAlt = (id: string) => {
    setSelections((p) => ({ ...p, [id]: { ...p[id], checked: !p[id].checked } }));
  };
  const setAltQty = (id: string, qty: number) => {
    setSelections((p) => ({ ...p, [id]: { ...p[id], qty: Math.max(1, qty) } }));
  };
  const setAltPrice = (id: string, price: number) => {
    setSelections((p) => ({ ...p, [id]: { ...p[id], price: Math.max(0, price) } }));
  };

  const checkedAlts = item.alternatives.filter((a) => selections[a.id]?.checked);
  const totalForItem = checkedAlts.reduce((s, a) => s + (selections[a.id]?.price ?? a.price) * (selections[a.id]?.qty ?? 0), 0);
  const selectedCount = checkedAlts.length;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-2.5 py-2 text-start hover:bg-muted/30 transition-colors">
        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
          <Package className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold block truncate">{item.requestedName}</span>
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
            <span>{isAr ? "طلب" : "Req"}: {item.requestedQty}</span>
            <span>·</span>
            <span>{item.requestedBudget}</span>
            {selectedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-green-600 font-medium">{selectedCount} {isAr ? "مختار" : "selected"}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-end shrink-0">
          <span className="text-[11px] font-bold text-green-600">{totalForItem.toLocaleString()} OMR</span>
        </div>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform shrink-0", expanded && "rotate-180")} />
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border/50">
          {/* Header row */}
          <div className="flex items-center justify-between px-2.5 py-1">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
              {isAr ? "خيارات المورد" : "Vendor Products"} ({item.alternatives.length})
            </span>
            <button type="button" className="text-[8px] text-primary font-semibold">
              + {isAr ? "أضف منتج" : "Add Product"}
            </button>
          </div>

          {/* Alternatives — checkboxes, editable price/qty */}
          {item.alternatives.map((a) => {
            const sel = selections[a.id];
            const isChecked = sel?.checked ?? false;

            return (
              <div key={a.id} className={cn(
                "border-t border-border/30 transition-colors",
                isChecked ? "bg-green-50/30 dark:bg-green-950/5" : ""
              )}>
                {/* Row 1: checkbox + name + price */}
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <input type="checkbox" checked={isChecked} onChange={() => toggleAlt(a.id)}
                    className="rounded border-border text-green-600 h-3 w-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-[9px] truncate block", isChecked ? "font-bold" : "font-medium")}>{a.name}</span>
                    <div className="flex items-center gap-1 text-[7px] text-muted-foreground">
                      <Star className="h-2 w-2 fill-amber-400 text-amber-400" /> {a.rating}
                      <span>·</span>
                      <span>{a.stock} {isAr ? "متوفر" : "stock"}</span>
                    </div>
                  </div>
                  {/* Editable price */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <input type="number" value={sel?.price ?? a.price}
                      onChange={(e) => setAltPrice(a.id, parseInt(e.target.value) || 0)}
                      className="w-12 h-5 text-[9px] font-bold text-green-600 text-end border border-border rounded px-1 bg-background outline-none focus:ring-1 focus:ring-green-500" />
                    <span className="text-[7px] text-muted-foreground">OMR</span>
                  </div>
                </div>

                {/* Row 2: qty control (only when checked) */}
                {isChecked && (
                  <div className="flex items-center justify-between px-2.5 py-1 ps-8 bg-green-50/20 dark:bg-green-950/5">
                    <span className="text-[8px] text-muted-foreground">{isAr ? "الكمية" : "Qty"}</span>
                    <div className="flex items-center">
                      <button type="button" onClick={() => setAltQty(a.id, (sel?.qty ?? 1) - 1)}
                        className="flex h-4 w-4 items-center justify-center rounded-s border border-border bg-background text-[9px]">-</button>
                      <input type="number" value={sel?.qty ?? 1}
                        onChange={(e) => setAltQty(a.id, parseInt(e.target.value) || 1)}
                        className="h-4 w-8 border-y border-border bg-background text-center text-[9px] font-semibold outline-none" />
                      <button type="button" onClick={() => setAltQty(a.id, (sel?.qty ?? 1) + 1)}
                        className="flex h-4 w-4 items-center justify-center rounded-e border border-border bg-background text-[9px]">+</button>
                    </div>
                    <span className="text-[9px] font-bold text-green-600">
                      {((sel?.price ?? a.price) * (sel?.qty ?? 1)).toLocaleString()} OMR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MsgPanel5Props {
  personId: string | null;
  onClose: () => void;
  locale: string;
}

export default function MsgPanel5({ personId, onClose, locale }: MsgPanel5Props) {
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"messages" | "product">("messages");
  const [input, setInput] = useState("");

  if (!personId) return null;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background border-s border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold truncate block">Ahmed Al-Busaidi</span>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[8px] text-muted-foreground">{isAr ? "متصل" : "Online"}</span>
          </div>
        </div>
        <button type="button" className="p-1 rounded hover:bg-muted text-muted-foreground"><Phone className="h-3 w-3" /></button>
        <button type="button" className="p-1 rounded hover:bg-muted text-muted-foreground"><Video className="h-3 w-3" /></button>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-3 w-3" /></button>
      </div>

      {/* Tabs: Messages | Product */}
      <div className="flex border-b border-border shrink-0">
        <button type="button" onClick={() => setTab("messages")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "messages" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <MessageSquare className="h-3 w-3" /> {isAr ? "الرسائل" : "Messages"}
        </button>
        <button type="button" onClick={() => setTab("product")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "product" ? "border-green-600 text-green-600" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <ShoppingBag className="h-3 w-3" /> {isAr ? "المنتج" : "Product"}
        </button>
      </div>

      {/* ═══ MESSAGES TAB ═══ */}
      {tab === "messages" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {/* Customer requirements — pinned at top of messages */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 dark:border-blue-800/30 dark:bg-blue-950/10 p-2">
              <div className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3 text-blue-600" />
                <span className="text-[8px] font-bold text-blue-700 dark:text-blue-400">{isAr ? "متطلبات العميل" : "Customer Requirements"}</span>
              </div>
              <p className="text-[8px] text-blue-800/80 dark:text-blue-300/80">Need for corporate use. Prefer black or silver. Bulk packaging OK. Must include carrying case.</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["Quality Cert", "Warranty", "Express"].map((r, i) => (
                  <span key={i} className="text-[7px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1 py-0.5 rounded">{r}</span>
                ))}
                <span className="text-[7px] bg-blue-100/50 rounded px-1 py-0.5">📎 2 files</span>
              </div>
            </div>

            {/* Messages + update notifications */}
            {MOCK_MSGS.map((msg) => (
              <div key={msg.id} className={cn("flex gap-1.5", msg.own && "flex-row-reverse")}>
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0",
                  msg.own ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {msg.name.charAt(0)}
                </div>
                <div className="max-w-[85%] min-w-0">
                  <div className={cn("flex items-baseline gap-1 mb-0.5", msg.own && "flex-row-reverse")}>
                    <span className="text-[8px] font-semibold">{msg.name}</span>
                    <span className="text-[7px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className={cn(
                    "rounded-lg px-2 py-1.5 text-[10px] break-words",
                    msg.own ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {/* Update notifications — shown as system messages */}
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 px-3 py-1 text-[8px] text-amber-700 dark:text-amber-400">
                🔔 {isAr ? "حدّثت سعر iPad إلى 420 OMR" : "You updated iPad price to 420 OMR"} · 2m
              </div>
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-50 dark:bg-blue-950/10 border border-blue-200/50 px-3 py-1 text-[8px] text-blue-700 dark:text-blue-400">
                🔔 {isAr ? "أحمد اختار iPad Pro 256GB" : "Ahmed selected iPad Pro 256GB"} · 5m
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border px-2 py-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <button type="button" className="text-muted-foreground hover:text-foreground shrink-0"><Paperclip className="h-3.5 w-3.5" /></button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={isAr ? "رسالة..." : "Message..."}
                className="flex-1 rounded border bg-muted/50 px-2 py-1.5 text-[10px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-0" />
              <button type="button" className={cn("shrink-0", input.trim() ? "text-primary" : "text-muted-foreground")}><Send className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </>
      )}

      {/* ═══ PRODUCT TAB ═══ */}
      {tab === "product" && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* RFQ Product list — each product expandable */}
          <div className="px-2 py-2 space-y-2">
            {MOCK_PRODUCT.items.map((item, i) => (
              <RfqProductCard key={i} item={item} locale={locale} />
            ))}
          </div>

          {/* Total + actions */}
          <div className="px-3 py-2 border-t border-border sticky bottom-0 bg-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground">{MOCK_PRODUCT.items.length} {isAr ? "منتجات" : "products"}</span>
              <span className="text-sm font-bold text-green-600">{MOCK_PRODUCT.totalPrice.toLocaleString()} OMR</span>
            </div>
            <div className="flex gap-1.5">
              <button type="button" className="flex-1 flex items-center justify-center gap-1 rounded-md bg-green-600 text-white hover:bg-green-700 py-1.5 text-[10px] font-semibold">
                <Send className="h-3 w-3" /> {isAr ? "تحديث" : "Update"}
              </button>
              <button type="button" className="flex-1 flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 py-1.5 text-[10px] font-semibold">
                <ShoppingBag className="h-3 w-3" /> {isAr ? "أضف للسلة" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
