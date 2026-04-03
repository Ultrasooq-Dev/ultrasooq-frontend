"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Phone, Video, Info, Paperclip, Send, Smile } from "lucide-react";

const MOCK_MESSAGES = [
  { id: 1, userId: 5, name: "Ahmed", text: "Hi, I need a bulk order of iPads and Dell laptops.", time: "10:30 AM" },
  { id: 2, userId: 6, name: "You", text: "Hello! I can offer 10 iPads at 450 OMR each and 10 Dell XPS at 650 OMR each.", time: "10:32 AM" },
  { id: 3, userId: 5, name: "Ahmed", text: "Can you do 400 OMR for the iPads? We are ordering 10 units.", time: "10:35 AM" },
  { id: 4, userId: 6, name: "You", text: "I can do 420 OMR per unit for 10+ orders. Best price I can offer.", time: "10:38 AM" },
  { id: 5, userId: 5, name: "Ahmed", text: "Deal! Please send the updated quote.", time: "10:45 AM" },
  { id: 6, userId: 6, name: "You", text: "Updated quote sent. Total: 10,700 OMR for 10 iPads + 10 Dell XPS.", time: "10:50 AM" },
  { id: 7, userId: 5, name: "Ahmed", text: "When can you deliver?", time: "11:00 AM" },
  { id: 8, userId: 6, name: "You", text: "Delivery within 5-7 business days to Muscat.", time: "11:02 AM" },
];

interface MsgPanel4Props {
  personId: string | null;
  onToggleInfo: () => void;
  showInfo: boolean;
  locale: string;
  userId: number;
  userName: string;
}

export default function MsgPanel4({ personId, onToggleInfo, showInfo, locale, userId, userName }: MsgPanel4Props) {
  const isAr = locale === "ar";
  const [input, setInput] = useState("");

  if (!personId) {
    return (
      <div className="flex flex-col h-full min-h-0 min-w-0 bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <MessageSquare className="h-6 w-6 opacity-20" />
          </div>
          <h3 className="text-sm font-semibold mb-1">{isAr ? "مركز الرسائل" : "Message Center"}</h3>
          <p className="text-xs text-center max-w-xs opacity-60">
            {isAr ? "اختر محادثة لبدء المراسلة" : "Select a conversation to start messaging"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold truncate">Ahmed Al-Busaidi</h3>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-muted-foreground">{isAr ? "متصل" : "Online"}</span>
          </div>
        </div>
        <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Phone className="h-3.5 w-3.5" /></button>
        <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Video className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={onToggleInfo}
          className={cn("p-1.5 rounded-lg transition-colors", showInfo ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}>
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
        {MOCK_MESSAGES.map((msg) => {
          const isOwn = msg.userId === 6;
          return (
            <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {msg.name.charAt(0)}
              </div>
              <div className="max-w-[70%] min-w-0">
                <div className={cn("flex items-baseline gap-1.5 mb-0.5", isOwn && "flex-row-reverse")}>
                  <span className="text-[9px] font-semibold">{msg.name}</span>
                  <span className="text-[7px] text-muted-foreground">{msg.time}</span>
                </div>
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs break-words",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
            className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-0"
          />
          <button type="button"
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
