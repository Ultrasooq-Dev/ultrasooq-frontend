"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Send, Paperclip, Phone, Video, Loader2 } from "lucide-react";
import { useChatMessages } from "./useChat";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/lib/messageStore";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// No mock data — real messages come from useMessageStore via useChat hook

interface MsgPanel5Props {
  personId: string | null;
  onClose: () => void;
  locale: string;
}

export default function MsgPanel5({ personId, onClose, locale }: MsgPanel5Props) {
  const isAr = locale === "ar";
  const [input, setInput] = useState("");
  const { user } = useAuth();
  const currentUserId = user?.id ?? 0;
  const currentUserName = user?.firstName ?? "You";

  const {
    roomMessages,
    roomTyping,
    scrollRef,
    sendMessage,
    emitTyping,
    isSending,
  } = useChatMessages(currentUserId, currentUserName);

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

  if (!personId) return null;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold truncate block">Ahmed Al-Busaidi</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {roomTyping.length > 0
                ? (isAr ? "يكتب..." : "typing...")
                : (isAr ? "متصل" : "Online")}
            </span>
          </div>
        </div>
        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></button>
        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Video className="h-4 w-4" /></button>
        <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId || msg.senderId === 0;
          const sending = isSending(msg.id);

          // System / RFQ update messages
          if (msg.contentType === "system" || msg.contentType === "rfq_update") {
            const isAmber = msg.senderId === currentUserId || msg.senderId === 0;
            return (
              <div key={msg.id} className="flex justify-center">
                <div className={cn(
                  "rounded-full border px-4 py-1.5 text-xs",
                  isAmber
                    ? "bg-amber-50 dark:bg-amber-950/10 border-amber-200/50 text-amber-700 dark:text-amber-400"
                    : "bg-blue-50 dark:bg-blue-950/10 border-blue-200/50 text-blue-700 dark:text-blue-400"
                )}>
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
              <div className="max-w-[80%] min-w-0">
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
          <button type="button" className="text-muted-foreground hover:text-foreground shrink-0"><Paperclip className="h-5 w-5" /></button>
          <input type="text" value={input}
            onChange={(e) => { setInput(e.target.value); emitTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "رسالة..." : "Message..."}
            className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-0" />
          <button type="button" onClick={handleSend}
            className={cn("shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              input.trim() ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
