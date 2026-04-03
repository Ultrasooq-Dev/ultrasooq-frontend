"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Paperclip, X, Package, ChevronRight } from "lucide-react";

export interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  budgetFrom?: number;
  budgetTo?: number;
  type: "SAME" | "SIMILAR";
  attachments: string[];
  notes?: string;
}

// Mock items for UI preview
const MOCK_ITEMS: RequestItem[] = [
  { id: "1", name: "Wireless Headphones (Noise Cancelling)", quantity: 50, budgetFrom: 80, budgetTo: 100, type: "SAME", attachments: ["spec.pdf"] },
  { id: "2", name: "Business Laptops 14-inch", quantity: 10, budgetFrom: 450, budgetTo: 600, type: "SIMILAR", attachments: [] },
  { id: "3", name: "USB-C Cables 1.5m", quantity: 200, budgetFrom: 1, budgetTo: 3, type: "SAME", attachments: [] },
  { id: "4", name: "Ergonomic Office Chairs", quantity: 25, budgetFrom: 80, budgetTo: 150, type: "SIMILAR", attachments: ["photo.jpg", "dims.pdf"] },
  { id: "5", name: "27-inch Monitors 4K", quantity: 10, budgetFrom: 200, budgetTo: 350, type: "SAME", attachments: [] },
  { id: "6", name: "Mechanical Keyboards RGB", quantity: 30, budgetFrom: 25, budgetTo: 50, type: "SIMILAR", attachments: [] },
  { id: "7", name: "Webcam HD 1080p", quantity: 20, budgetFrom: 15, budgetTo: 30, type: "SAME", attachments: [] },
  { id: "8", name: "Wireless Mouse Ergonomic", quantity: 50, budgetFrom: 10, budgetTo: 20, type: "SAME", attachments: [] },
  { id: "9", name: "Standing Desk Electric", quantity: 5, budgetFrom: 300, budgetTo: 500, type: "SIMILAR", attachments: ["specs.pdf"] },
  { id: "10", name: "LED Desk Lamps", quantity: 30, budgetFrom: 15, budgetTo: 30, type: "SAME", attachments: [] },
];

interface RequestListPanelProps {
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  locale: string;
}

export default function RequestListPanel({ selectedItemId, onSelectItem, locale }: RequestListPanelProps) {
  const isAr = locale === "ar";
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const items = MOCK_ITEMS;

  return (
    <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-bold">{isAr ? "قائمة الطلبات" : "Request Items"}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isAr ? "أضف المنتجات التي تحتاجها" : "Add products you need quotes for"}
        </p>
      </div>

      {/* Input area — expanded for detailed descriptions */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          placeholder={isAr
            ? "صِف ما تحتاجه بالتفصيل...\nمثال: 50 سماعة لاسلكية مع إلغاء الضوضاء، ميزانية 80-100 ريال، تسليم خلال أسبوع"
            : "Describe what you need in detail...\ne.g. 50 wireless headphones with ANC, budget 80-100 OMR per unit, delivery within 1 week"}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
        />

        {/* Attachments row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Hidden multi-file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const names = Array.from(e.target.files).map((f) => f.name);
                setAttachments((prev) => [...prev, ...names]);
              }
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded border border-dashed border-border hover:border-primary px-2 py-1 text-[10px] text-muted-foreground hover:text-primary"
          >
            <Paperclip className="h-3 w-3" />
            {isAr ? "إرفاق ملفات" : "Attach Files"}
          </button>

          {/* Attachment chips */}
          {attachments.map((a, i) => (
            <span key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-[10px]">
              📎 {a}
              <button type="button" onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}>
                <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
          ))}

          {/* Add to list button */}
          <button
            type="button"
            className="flex items-center gap-1.5 ms-auto rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-[10px] font-semibold shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "أضف للقائمة" : "Add to List"}
          </button>
        </div>
      </div>

      {/* Items count */}
      <div className="px-3 py-1.5 bg-muted/30 border-b border-border shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {items.length} {isAr ? "عنصر" : "items"}
        </span>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item.id)}
            className={cn(
              "flex w-full items-start gap-2.5 px-3 py-3 text-start border-b border-border/50 transition-colors",
              item.id === selectedItemId
                ? "bg-primary/5 border-e-2 border-e-primary"
                : "hover:bg-muted/30"
            )}
          >
            {/* Number badge */}
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5",
              item.id === selectedItemId
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-xs block truncate",
                item.id === selectedItemId ? "font-bold text-primary" : "font-semibold"
              )}>
                {item.name}
              </span>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Package className="h-2.5 w-2.5" />
                  {isAr ? "الكمية" : "Qty"}: {item.quantity}
                </span>
                {item.budgetFrom && (
                  <span>{item.budgetFrom}-{item.budgetTo} OMR</span>
                )}
                <span className={cn(
                  "px-1 py-0 rounded text-[8px] font-medium",
                  item.type === "SAME" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                )}>
                  {item.type}
                </span>
              </div>
              {item.attachments.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {item.attachments.map((a, i) => (
                    <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      📎 {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className={cn(
              "h-4 w-4 shrink-0 mt-1",
              item.id === selectedItemId ? "text-primary" : "text-muted-foreground/30"
            )} />
          </button>
        ))}
      </div>
    </div>
  );
}
