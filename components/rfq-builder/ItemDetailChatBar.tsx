"use client";
/**
 * ItemDetailChatBar — collapsible Discussion/Chat bar pinned at the bottom
 * of ItemDetailPanel, shown only on the Products tab.
 */
import React from "react";
import { MessageSquare, Paperclip, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemDetailChatBarProps {
  isAr: boolean;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatExpanded: boolean;
  setChatExpanded: (v: boolean) => void;
  aiUsedToday: number;
  aiResetHours: number;
  vendorFileRef: React.RefObject<HTMLInputElement | null>;
}

export function ItemDetailChatBar({
  isAr,
  chatInput,
  setChatInput,
  chatExpanded,
  setChatExpanded,
  aiUsedToday,
  aiResetHours,
  vendorFileRef,
}: ItemDetailChatBarProps) {
  return (
    <div className="border-t border-border shrink-0">
      <button
        type="button"
        onClick={() => setChatExpanded(!chatExpanded)}
        className="flex items-center gap-2 w-full px-3 py-1.5 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <MessageSquare className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold">
          {isAr ? "محادثة" : "Discussion"}
        </span>
        <span
          className={cn(
            "text-[7px] font-bold px-1 py-0.5 rounded ms-auto me-1",
            aiUsedToday >= 50
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {50 - aiUsedToday}/50
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            chatExpanded && "rotate-180"
          )}
        />
      </button>

      {chatExpanded && (
        <div className="max-h-36 overflow-y-auto px-3 py-2 space-y-1.5 border-t border-border/30">
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 opacity-20" />
            <p className="text-[9px]">
              {isAr ? "ابدأ المحادثة" : "Start a discussion"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50">
        {aiUsedToday >= 50 ? (
          <div className="flex-1 text-center py-1">
            <span className="text-[9px] text-destructive font-medium">
              {isAr
                ? `انتهى الحد اليومي — يتجدد خلال ${aiResetHours}س`
                : `Daily limit reached — resets in ${aiResetHours}h`}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => vendorFileRef.current?.click()}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Paperclip className="h-3 w-3" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isAr ? "اسأل عن المنتج..." : "Ask about this product..."}
              className="flex-1 bg-muted/50 rounded border px-2 py-1 text-[10px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              className="text-primary hover:text-primary/80 shrink-0"
            >
              <Send className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
