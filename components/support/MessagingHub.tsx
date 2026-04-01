"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MenuGrid from "./MenuGrid";
import MessageBubble, { type ChatMessage } from "./MessageBubble";
import {
  initSupportChat,
  sendSupportMessage,
  sendMenuClick,
  submitFeedback,
  getSupportHistory,
} from "@/apis/requests/support.requests";
import {
  Bot, Shield, Headset, Paperclip, Send,
  Plus, History, MessageSquare, Store, ChevronLeft,
  Loader2, Search, X, Minus, ArrowLeft,
} from "lucide-react";

interface MessagingHubProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  user: any;
  locale: string;
}

interface ChatThread {
  id: string;
  type: "bot" | "admin" | "seller";
  name: string;
  nameAr?: string;
  status: string;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
  conversationId?: number;
}

const GREETING = (name: string, locale: string): ChatMessage => ({
  id: -1,
  senderType: "bot",
  content: locale === "ar"
    ? `مرحبا${name ? " " + name : ""}! 👋 كيف يمكنني مساعدتك؟`
    : `Hi${name ? " " + name : ""}! 👋 How can I help you?`,
  contentType: "text",
  createdAt: new Date().toISOString(),
});

function timeAgo(d: string, locale: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return locale === "ar" ? "الآن" : "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Single Pop Chat Window (bottom-docked) ──────────────────────
function PopChat({
  thread,
  messages,
  isTyping,
  locale,
  tradeRole,
  conversationId,
  conversationStatus,
  onSend,
  onMenuClick,
  onNavigate,
  onFeedback,
  onFileUpload,
  onMinimize,
  onClose,
  showMenu,
}: {
  thread: ChatThread;
  messages: ChatMessage[];
  isTyping: boolean;
  locale: string;
  tradeRole: string;
  conversationId: number | null;
  conversationStatus: string;
  onSend: (text: string) => void;
  onMenuClick: (id: string) => void;
  onNavigate: (url: string) => void;
  onFeedback: (id: number, positive: boolean) => void;
  onFileUpload: () => void;
  onMinimize: () => void;
  onClose: () => void;
  showMenu: boolean;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const isEscalated = conversationStatus === "open" || conversationStatus === "assigned";

  return (
    <div className="w-[340px] h-[440px] flex flex-col rounded-t-xl border border-b-0 bg-background shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
            thread.type === "bot" ? "bg-primary-foreground/20" : thread.type === "admin" ? "bg-green-500/30" : "bg-orange-500/30"
          }`}>
            {thread.type === "bot" ? <Bot className="h-3.5 w-3.5" /> : thread.type === "admin" ? <Shield className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{locale === "ar" && thread.nameAr ? thread.nameAr : thread.name}</div>
            <div className="text-[9px] opacity-70">
              {isEscalated ? (locale === "ar" ? "متصل" : "Connected") : thread.type === "bot" ? (locale === "ar" ? "مساعد ذكي" : "AI") : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={onMinimize} className="p-1 rounded hover:bg-primary-foreground/10">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            locale={locale}
            onFeedback={onFeedback}
            onButtonClick={(action, value) => {
              if (action === "navigate") onNavigate(value);
              else if (action === "menu_click") onMenuClick(value);
              else if (action === "send_text") onSend(value);
            }}
            onNavigate={onNavigate}
          />
        ))}

        {showMenu && (
          <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={onMenuClick} onNavigate={onNavigate} />
        )}

        {isTyping && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
            <div className="rounded-2xl bg-muted px-3 py-1.5 rounded-bl-sm">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-2 py-2 shrink-0">
        <div className="flex items-end gap-1.5">
          <button type="button" onClick={onFileUpload} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
            className="flex-1 resize-none rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-16"
            rows={1}
          />
          {!isEscalated && (
            <button type="button" onClick={() => onMenuClick("escalate")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50">
              <Headset className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={handleSend} disabled={!input.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Messaging Hub ──────────────────────────────────────────
export default function MessagingHub({ onClose, onUnreadChange, user, locale }: MessagingHubProps) {
  const router = useRouter();
  const tradeRole = user?.tradeRole || "BUYER";
  const userName = user?.firstName || "";

  // State
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [openChats, setOpenChats] = useState<string[]>([]); // thread IDs that are open as pop windows
  const [minimizedChats, setMinimizedChats] = useState<string[]>([]); // thread IDs minimized to tabs
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState("bot");
  const [showList, setShowList] = useState(true); // conversation list panel
  const [searchTerm, setSearchTerm] = useState("");
  const nextId = useRef(1);

  // Init
  useEffect(() => {
    initSupportChat({ locale, currentPage: typeof window !== "undefined" ? window.location.pathname : "/" })
      .then((res) => {
        const data = res.data;
        if (data?.conversationId) {
          setConversationId(data.conversationId);
          setConversationStatus(data.status || "bot");

          const hasMessages = data.messages?.length > 0;
          const lastMsg = hasMessages ? data.messages[data.messages.length - 1] : null;
          const isEscalated = data.status === "open" || data.status === "assigned";

          const thread: ChatThread = {
            id: `support-${data.conversationId}`,
            type: isEscalated ? "admin" : "bot",
            name: isEscalated ? "Support Team" : "AI Assistant",
            nameAr: isEscalated ? "الدعم الفني" : "المساعد الذكي",
            status: data.status,
            lastMessage: lastMsg?.content?.slice(0, 40) ?? "Start a conversation",
            lastTime: lastMsg?.createdAt ?? new Date().toISOString(),
            unread: 0,
            conversationId: data.conversationId,
          };
          setThreads([thread]);

          if (hasMessages) {
            const existing: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType,
              metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
              feedbackScore: m.feedbackScore, createdAt: m.createdAt,
            }));
            setMessages([GREETING(userName, locale), ...existing]);
            nextId.current = Math.max(...existing.map((m) => m.id), 0) + 1;
            setShowMenu(false);
          } else {
            setMessages([GREETING(userName, locale)]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!conversationId || conversationStatus === "resolved") return;
    const interval = setInterval(() => {
      getSupportHistory(conversationId).then((res) => {
        const conv = res.data;
        if (!conv?.messages) return;
        const localIds = new Set(messages.filter((m) => m.id > 0).map((m) => m.id));
        const newMsgs = conv.messages.filter((m: any) => m.id > 0 && !localIds.has(m.id));
        if (newMsgs.length > 0) {
          const toAdd = newMsgs.map((m: any) => ({
            id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType,
            metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
            createdAt: m.createdAt,
          }));
          setMessages((prev) => [...prev, ...toAdd]);
          const adminNew = newMsgs.filter((m: any) => m.senderType === "admin");
          if (adminNew.length > 0) onUnreadChange(adminNew.length);
          const last = newMsgs[newMsgs.length - 1];
          setThreads((prev) => prev.map((t) => t.conversationId === conversationId ? { ...t, lastMessage: last.content?.slice(0, 40), lastTime: last.createdAt } : t));
        }
        if (conv.status && conv.status !== conversationStatus) {
          setConversationStatus(conv.status);
          setThreads((prev) => prev.map((t) => t.conversationId === conversationId ? {
            ...t, status: conv.status, type: conv.status === "open" || conv.status === "assigned" ? "admin" : "bot",
            name: conv.status === "open" || conv.status === "assigned" ? "Support Team" : "AI Assistant",
            nameAr: conv.status === "open" || conv.status === "assigned" ? "الدعم الفني" : "المساعد الذكي",
          } : t));
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, conversationStatus, messages, onUnreadChange]);

  const addMessage = useCallback((msg: Partial<ChatMessage>) => {
    const id = msg.id ?? nextId.current++;
    setMessages((prev) => [...prev, { id, senderType: "customer", content: "", contentType: "text", createdAt: new Date().toISOString(), ...msg }]);
  }, []);

  // Open a chat as pop window
  const openChat = useCallback((threadId: string) => {
    setOpenChats((prev) => prev.includes(threadId) ? prev : [...prev, threadId]);
    setMinimizedChats((prev) => prev.filter((id) => id !== threadId));
    setShowList(false);
    setShowMenu(false);
  }, []);

  const minimizeChat = useCallback((threadId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== threadId));
    setMinimizedChats((prev) => prev.includes(threadId) ? prev : [...prev, threadId]);
  }, []);

  const closeChat = useCallback((threadId: string) => {
    setOpenChats((prev) => prev.filter((id) => id !== threadId));
    setMinimizedChats((prev) => prev.filter((id) => id !== threadId));
  }, []);

  const handleSend = useCallback((text: string) => {
    if (!conversationId) return;
    addMessage({ senderType: "customer", content: text, contentType: "text" });
    setShowMenu(false);
    if (conversationStatus === "open" || conversationStatus === "assigned") {
      sendSupportMessage({ conversationId, content: text, metadata: { locale } }).catch(() => {});
      addMessage({ senderType: "bot", content: locale === "ar" ? "تم إرسال رسالتك." : "Message sent to support.", contentType: "status" });
    } else {
      setIsTyping(true);
      sendSupportMessage({ conversationId, content: text, metadata: { locale, currentPage: typeof window !== "undefined" ? window.location.pathname : "/" } })
        .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMessage({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConversationStatus(res.data.status); })
        .catch(() => { setIsTyping(false); addMessage({ senderType: "bot", content: "Something went wrong.", contentType: "text" }); });
    }
  }, [conversationId, conversationStatus, locale, addMessage]);

  const handleMenuClick = useCallback((menuId: string) => {
    if (!conversationId) return;
    setShowMenu(false);
    addMessage({ senderType: "customer", content: menuId === "escalate" ? "🛟" : menuId === "product_search" ? "🔍" : menuId === "order_tracker" ? "📦" : menuId === "faq" ? "❓" : menuId, contentType: "text" });
    setIsTyping(true);
    sendMenuClick({ conversationId, menuId, locale })
      .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMessage({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConversationStatus(res.data.status); })
      .catch(() => setIsTyping(false));
  }, [conversationId, locale, addMessage]);

  const handleNavigate = useCallback((url: string) => { router.push(url); onClose(); }, [router, onClose]);
  const handleFeedback = useCallback((messageId: number, positive: boolean) => { setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, feedbackScore: positive ? 5 : 1 } : m)); submitFeedback({ messageId, positive }).catch(() => {}); }, []);
  const handleFileUpload = useCallback(() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"; inp.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) addMessage({ senderType: "customer", content: `📎 ${f.name}`, contentType: "file", metadata: { fileName: f.name, fileSize: f.size, fileType: f.type } }); }; inp.click(); }, [addMessage]);

  return (
    <>
      {/* ═══ CONVERSATION LIST PANEL (Freelancer style — bottom-right fixed) ═══ */}
      {showList && openChats.length === 0 && (
        <div className="fixed bottom-20 end-6 z-50 w-[320px] max-h-[480px] flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-semibold">{locale === "ar" ? "الرسائل" : "Messages"}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { if (threads[0]) openChat(threads[0].id); else { setShowList(false); setShowMenu(true); openChat("new"); } }} className="p-1 rounded hover:bg-primary-foreground/10" title="New chat">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b">
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={locale === "ar" ? "بحث..." : "Search..."}
                className="w-full rounded-lg border bg-muted/50 ps-7 pe-2 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{locale === "ar" ? "لا توجد محادثات" : "No conversations yet"}</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openChat(thread.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-start border-b last:border-0"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    thread.type === "bot" ? "bg-primary/10 text-primary" : thread.type === "admin" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                  }`}>
                    {thread.type === "bot" ? <Bot className="h-5 w-5" /> : thread.type === "admin" ? <Shield className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{locale === "ar" && thread.nameAr ? thread.nameAr : thread.name}</span>
                      <span className="text-[9px] text-muted-foreground">{thread.lastTime ? timeAgo(thread.lastTime, locale) : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                  </div>
                  {thread.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                      {thread.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t max-h-[200px] overflow-y-auto">
            <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={(id) => { openChat(threads[0]?.id || "new"); setTimeout(() => handleMenuClick(id), 200); }} onNavigate={handleNavigate} />
          </div>
        </div>
      )}

      {/* ═══ POP CHAT WINDOWS (side by side at bottom) ═══ */}
      <div className="fixed bottom-0 end-24 z-40 flex items-end gap-2" style={{ direction: "ltr" }}>
        {openChats.map((threadId) => {
          const thread = threads.find((t) => t.id === threadId) || { id: threadId, type: "bot" as const, name: "AI Assistant", nameAr: "المساعد الذكي", status: "bot", unread: 0 };
          return (
            <PopChat
              key={threadId}
              thread={thread}
              messages={messages}
              isTyping={isTyping}
              locale={locale}
              tradeRole={tradeRole}
              conversationId={conversationId}
              conversationStatus={conversationStatus}
              onSend={handleSend}
              onMenuClick={handleMenuClick}
              onNavigate={handleNavigate}
              onFeedback={handleFeedback}
              onFileUpload={handleFileUpload}
              onMinimize={() => minimizeChat(threadId)}
              onClose={() => closeChat(threadId)}
              showMenu={showMenu}
            />
          );
        })}
      </div>

      {/* ═══ MINIMIZED TABS (bottom bar) ═══ */}
      <div className="fixed bottom-0 end-24 z-30 flex items-end gap-1" style={{ direction: "ltr", marginInlineEnd: `${openChats.length * 348}px` }}>
        {minimizedChats.map((threadId) => {
          const thread = threads.find((t) => t.id === threadId);
          if (!thread) return null;
          return (
            <button
              key={threadId}
              type="button"
              onClick={() => openChat(threadId)}
              className="flex items-center gap-2 rounded-t-lg border border-b-0 bg-background px-3 py-1.5 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                thread.type === "bot" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
              }`}>
                {thread.type === "bot" ? <Bot className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              </div>
              <span className="text-xs font-medium max-w-[80px] truncate">{locale === "ar" && thread.nameAr ? thread.nameAr : thread.name}</span>
              {thread.unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white px-0.5">{thread.unread}</span>
              )}
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); closeChat(threadId); }} />
            </button>
          );
        })}
      </div>
    </>
  );
}
