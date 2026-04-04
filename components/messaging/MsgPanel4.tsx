"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Phone, Video, Info, Paperclip, Send, Loader2 } from "lucide-react";
import { useChatMessages } from "./useChat";
import type { ChatMessage } from "@/lib/messageStore";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// No mock data — real messages come from useMessageStore via useChat hook

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

  const {
    roomMessages,
    roomTyping,
    scrollRef,
    sendMessage,
    emitTyping,
    isSending,
  } = useChatMessages(userId, userName);

  const messages = roomMessages;

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">Ahmed Al-Busaidi</h3>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {roomTyping.length > 0
                ? (isAr ? "يكتب..." : "typing...")
                : (isAr ? "متصل" : "Online")}
            </span>
          </div>
        </div>
        <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></button>
        <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Video className="h-4 w-4" /></button>
        <button type="button" onClick={onToggleInfo}
          className={cn("p-1.5 rounded-lg transition-colors", showInfo ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}>
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId || msg.senderId === 0;
          const sending = isSending(msg.id);

          // System messages (RFQ updates)
          if (msg.contentType === "system" || msg.contentType === "rfq_update") {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="rounded-full bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                  🔔 {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {msg.senderName.charAt(0)}
              </div>
              <div className="max-w-[75%] min-w-0">
                <div className={cn("flex items-baseline gap-1.5 mb-0.5", isOwn && "flex-row-reverse")}>
                  <span className="text-xs font-semibold">{isOwn ? (isAr ? "أنت" : "You") : msg.senderName}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                  {sending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                <div className={cn(
                  "rounded-lg px-3 py-2 text-sm break-words",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                  sending && "opacity-70"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {roomTyping.length > 0 && (
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <div className="flex gap-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
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
            onChange={(e) => { setInput(e.target.value); emitTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
            className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-0"
          />
          <button type="button" onClick={handleSend}
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
