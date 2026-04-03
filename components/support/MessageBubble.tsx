"use client";
import React from "react";
import { Bot, User, Shield, ThumbsUp, ThumbsDown, ExternalLink, FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ChatMessage {
  id: number;
  senderType: "customer" | "bot" | "admin";
  content: string;
  contentType: "text" | "menu" | "cards" | "buttons" | "search_results" | "navigate" | "file" | "status";
  metadata?: any;
  feedbackScore?: number | null;
  createdAt: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  locale: string;
  onFeedback?: (messageId: number, positive: boolean) => void;
  onButtonClick?: (action: string, value: string) => void;
  onNavigate?: (url: string) => void;
}

export default function MessageBubble({
  message,
  locale,
  onFeedback,
  onButtonClick,
  onNavigate,
}: MessageBubbleProps) {
  const isCustomer = message.senderType === "customer";
  const isBot = message.senderType === "bot";
  const isAdmin = message.senderType === "admin";

  // System status message
  if (message.contentType === "status") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isCustomer ? "flex-row-reverse" : "flex-row"} mb-3`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isBot
            ? "bg-primary text-primary-foreground"
            : isAdmin
              ? "bg-green-600 text-white"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {isBot && <Bot className="h-3.5 w-3.5" />}
        {isAdmin && <Shield className="h-3.5 w-3.5" />}
        {isCustomer && <User className="h-3.5 w-3.5" />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] space-y-1.5 ${isCustomer ? "items-end" : "items-start"}`}>
        {/* Sender label */}
        <span className="text-[10px] text-muted-foreground">
          {isBot ? "Bot" : isAdmin ? "Support" : "You"}
          {" · "}
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {/* Text content */}
        {(message.contentType === "text" || message.contentType === "menu") && (
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm ${
              isCustomer
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted rounded-bl-sm"
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Product/Order Cards */}
        {message.contentType === "cards" && message.metadata?.cards && (
          <div className="space-y-2">
            {message.content && (
              <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm rounded-bl-sm">
                {message.content}
              </div>
            )}
            <div className="space-y-1.5">
              {message.metadata.cards.map((card: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate?.(card.url)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-start hover:bg-muted/50 transition-colors"
                >
                  {card.image && (
                    <img
                      src={card.image}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover bg-muted"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{card.title}</div>
                    {card.subtitle && (
                      <div className="text-xs text-muted-foreground">{card.subtitle}</div>
                    )}
                    {card.price && (
                      <div className="text-xs font-semibold text-primary">{card.price}</div>
                    )}
                  </div>
                  {card.badge && (
                    <Badge
                      variant={
                        card.badge === "DELIVERED"
                          ? "default"
                          : card.badge === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {card.badge}
                    </Badge>
                  )}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reply Buttons */}
        {message.contentType === "buttons" && message.metadata?.buttons && (
          <div className="space-y-2">
            {message.content && (
              <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm rounded-bl-sm">
                {message.content}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {message.metadata.buttons.map((btn: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onButtonClick?.(btn.action, btn.value)}
                  className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {locale === "ar" && btn.labelAr ? btn.labelAr : btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigate Card */}
        {message.contentType === "navigate" && message.metadata?.navigateTo && (
          <div className="space-y-2">
            <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm rounded-bl-sm">
              {message.content}
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.(message.metadata.navigateTo)}
              className="flex items-center gap-2 rounded-xl border bg-primary/5 px-3.5 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {message.metadata.label || "Open Page"}
            </button>
          </div>
        )}

        {/* File Message */}
        {message.contentType === "file" && message.metadata && (
          <div className="space-y-2">
            {message.content && (
              <div className={`rounded-2xl px-3.5 py-2 text-sm ${isCustomer ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                {message.content}
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border bg-card p-2.5">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{message.metadata.fileName}</div>
                <div className="text-[10px] text-muted-foreground">
                  {message.metadata.fileType} · {Math.round((message.metadata.fileSize || 0) / 1024)}KB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results (grouped) */}
        {message.contentType === "search_results" && message.metadata?.groups && (
          <div className="space-y-2">
            <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm rounded-bl-sm">
              {message.content}
            </div>
            {message.metadata.groups.map((group: any, gi: number) => (
              <div key={gi} className="space-y-1">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground px-1">
                  {group.type} ({group.items.length})
                </div>
                {group.items.slice(0, 3).map((item: any, ii: number) => (
                  <button
                    key={ii}
                    type="button"
                    onClick={() => onNavigate?.(item.url)}
                    className="flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-start hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[10px] text-muted-foreground">{item.subtitle}</div>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Feedback buttons (only on bot messages) */}
        {isBot && (message.contentType as string) !== "status" && message.contentType !== "menu" && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => onFeedback?.(message.id, true)}
              className={`rounded-full p-1 transition-colors ${
                message.feedbackScore === 5
                  ? "bg-green-100 text-green-600"
                  : "text-muted-foreground/40 hover:text-green-600 hover:bg-green-50"
              }`}
              title="Helpful"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.(message.id, false)}
              className={`rounded-full p-1 transition-colors ${
                message.feedbackScore === 1
                  ? "bg-red-100 text-red-600"
                  : "text-muted-foreground/40 hover:text-red-600 hover:bg-red-50"
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
