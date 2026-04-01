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
  Bot, Shield, Headset, Paperclip, Send, Minimize2,
  Plus, History, MessageSquare, Store, ChevronLeft,
  Loader2,
} from "lucide-react";

interface MessagingHubProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  user: any;
  locale: string;
}

interface ChatThread {
  id: string; // "support-{convId}" or "seller-{roomId}"
  type: "bot" | "admin" | "seller";
  name: string;
  status: string;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
  conversationId?: number;
  icon: "bot" | "admin" | "seller";
}

const GREETING = (name: string, locale: string): ChatMessage => ({
  id: -1,
  senderType: "bot",
  content: locale === "ar"
    ? `مرحبا${name ? " " + name : ""}! 👋 كيف يمكنني مساعدتك؟`
    : `Hi${name ? " " + name : ""}! 👋 How can I help you today?`,
  contentType: "text",
  createdAt: new Date().toISOString(),
});

export default function MessagingHub({ onClose, onUnreadChange, user, locale }: MessagingHubProps) {
  const router = useRouter();
  const tradeRole = user?.tradeRole || "BUYER";
  const userName = user?.firstName || "";

  // ─── Drag + Resize ───
  const windowRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    return { x: w - 420, y: h - 590 };
  });
  const [size, setSize] = useState({ w: 380, h: 540 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, a")) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    dragOffset.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.w)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 80)),
        });
      }
      if (resizing.current) {
        const dx = e.clientX - dragOffset.current.x;
        const dy = e.clientY - dragOffset.current.y;
        dragOffset.current = { x: e.clientX, y: e.clientY };
        setSize((prev) => ({
          w: Math.max(300, Math.min(prev.w + dx, 600)),
          h: Math.max(350, Math.min(prev.h + dy, window.innerHeight - 40)),
        }));
      }
    };
    const onMouseUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [size.w]);

  // Auto-move when sidebars open (cart, sidebar, etc.)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (typeof window === "undefined") return;
      // Detect open sidebars/drawers by checking for common classes
      const cartSidebar = document.querySelector("[data-state='open'][role='dialog'], .cart-sidebar, [class*='translate-x-0'][class*='fixed']");
      const rightEdge = window.innerWidth;
      if (cartSidebar) {
        const rect = cartSidebar.getBoundingClientRect();
        if (rect.left < rightEdge && pos.x + size.w > rect.left) {
          setPos((prev) => ({ ...prev, x: Math.max(0, rect.left - size.w - 16) }));
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-state", "style"] });
    return () => observer.disconnect();
  }, [pos.x, size.w]);

  // Views: "threads" = sidebar list, "chat" = active chat, "menu" = action menu
  const [view, setView] = useState<"threads" | "chat" | "menu">("threads");
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenuInChat, setShowMenuInChat] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState("bot");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Init: load support conversation
  useEffect(() => {
    initSupportChat({ locale, currentPage: typeof window !== "undefined" ? window.location.pathname : "/" })
      .then((res) => {
        const data = res.data;
        if (data?.conversationId) {
          setConversationId(data.conversationId);
          setConversationStatus(data.status || "bot");

          // Build thread from support conversation
          const hasMessages = data.messages?.length > 0;
          const lastMsg = hasMessages ? data.messages[data.messages.length - 1] : null;
          const isEscalated = data.status === "open" || data.status === "assigned";

          const supportThread: ChatThread = {
            id: `support-${data.conversationId}`,
            type: isEscalated ? "admin" : "bot",
            name: isEscalated
              ? (locale === "ar" ? "الدعم الفني" : "Support Team")
              : (locale === "ar" ? "المساعد الذكي" : "AI Assistant"),
            status: data.status,
            lastMessage: lastMsg?.content?.slice(0, 40) ?? (locale === "ar" ? "ابدأ محادثة جديدة" : "Start a new chat"),
            lastTime: lastMsg?.createdAt ?? new Date().toISOString(),
            unread: 0,
            conversationId: data.conversationId,
            icon: isEscalated ? "admin" : "bot",
          };

          setThreads([supportThread]);

          // If there are messages, auto-open this thread
          if (hasMessages) {
            const existing: ChatMessage[] = data.messages.map((m: any) => ({
              id: m.id,
              senderType: m.senderType,
              content: m.content,
              contentType: m.contentType,
              metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
              feedbackScore: m.feedbackScore,
              createdAt: m.createdAt,
            }));
            setMessages([GREETING(userName, locale), ...existing]);
            nextId.current = Math.max(...existing.map((m) => m.id), 0) + 1;
            setActiveThread(supportThread);
            setView("chat");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!conversationId || conversationStatus === "resolved") return;

    const interval = setInterval(() => {
      getSupportHistory(conversationId)
        .then((res) => {
          const conv = res.data;
          if (!conv?.messages) return;

          const localIds = new Set(messages.filter((m) => m.id > 0).map((m) => m.id));
          const newMsgs = conv.messages.filter((m: any) => m.id > 0 && !localIds.has(m.id));

          if (newMsgs.length > 0) {
            const toAdd: ChatMessage[] = newMsgs.map((m: any) => ({
              id: m.id,
              senderType: m.senderType,
              content: m.content,
              contentType: m.contentType,
              metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
              createdAt: m.createdAt,
            }));
            setMessages((prev) => [...prev, ...toAdd]);

            const adminNew = newMsgs.filter((m: any) => m.senderType === "admin");
            if (adminNew.length > 0 && view !== "chat") {
              onUnreadChange(adminNew.length);
            }

            // Update thread
            const last = newMsgs[newMsgs.length - 1];
            setThreads((prev) =>
              prev.map((t) =>
                t.conversationId === conversationId
                  ? { ...t, lastMessage: last.content?.slice(0, 40), lastTime: last.createdAt, unread: view !== "chat" ? t.unread + adminNew.length : 0 }
                  : t
              )
            );
          }

          if (conv.status && conv.status !== conversationStatus) {
            setConversationStatus(conv.status);
            setThreads((prev) =>
              prev.map((t) =>
                t.conversationId === conversationId
                  ? { ...t, status: conv.status, type: conv.status === "open" || conv.status === "assigned" ? "admin" : "bot", name: conv.status === "open" || conv.status === "assigned" ? (locale === "ar" ? "الدعم الفني" : "Support Team") : (locale === "ar" ? "المساعد الذكي" : "AI Assistant"), icon: conv.status === "open" || conv.status === "assigned" ? "admin" : "bot" }
                  : t
              )
            );
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, conversationStatus, messages, view, locale, onUnreadChange]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const addMessage = useCallback((msg: Partial<ChatMessage>) => {
    const id = msg.id ?? nextId.current++;
    const full: ChatMessage = {
      id,
      senderType: "customer",
      content: "",
      contentType: "text",
      createdAt: new Date().toISOString(),
      ...msg,
    };
    setMessages((prev) => [...prev, full]);
    return id;
  }, []);

  // Open a thread
  const openThread = useCallback((thread: ChatThread) => {
    setActiveThread(thread);
    setView("chat");
    setShowMenuInChat(false);
    thread.unread = 0;
    setThreads((prev) => prev.map((t) => t.id === thread.id ? { ...t, unread: 0 } : t));

    // If no messages loaded yet (first time), show greeting + menu
    if (messages.length <= 1) {
      setMessages([GREETING(userName, locale)]);
      setShowMenuInChat(true);
    }
  }, [messages.length, userName, locale]);

  // Start new chat (reset)
  const startNew = useCallback(() => {
    setMessages([GREETING(userName, locale)]);
    setShowMenuInChat(true);
    setView("chat");
    if (threads.length > 0) {
      setActiveThread(threads[0]);
    }
  }, [userName, locale, threads]);

  // Send message
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !conversationId) return;

    addMessage({ senderType: "customer", content: text, contentType: "text" });
    setInput("");
    setShowMenuInChat(false);

    if (conversationStatus === "open" || conversationStatus === "assigned") {
      sendSupportMessage({ conversationId, content: text, metadata: { locale } }).catch(() => {});
      addMessage({
        senderType: "bot",
        content: locale === "ar" ? "تم إرسال رسالتك. سيرد فريق الدعم قريباً." : "Message sent. Support will respond shortly.",
        contentType: "status",
      });
    } else {
      setIsTyping(true);
      sendSupportMessage({ conversationId, content: text, metadata: { locale, currentPage: typeof window !== "undefined" ? window.location.pathname : "/" } })
        .then((res) => {
          setIsTyping(false);
          const bot = res.data?.botResponse;
          if (bot?.content) {
            addMessage({ senderType: "bot", content: bot.content, contentType: bot.contentType, metadata: bot.metadata });
          }
          if (res.data?.status) setConversationStatus(res.data.status);
        })
        .catch(() => {
          setIsTyping(false);
          addMessage({ senderType: "bot", content: locale === "ar" ? "حدث خطأ." : "Something went wrong.", contentType: "text" });
        });
    }
  }, [input, conversationId, conversationStatus, locale, addMessage]);

  // Menu click
  const handleMenuClick = useCallback((menuId: string) => {
    if (!conversationId) return;
    setShowMenuInChat(false);

    const labels: Record<string, string> = {
      product_search: "🔍", order_tracker: "📦", faq: "❓", escalate: "🛟",
    };
    addMessage({ senderType: "customer", content: labels[menuId] || menuId, contentType: "text" });

    setIsTyping(true);
    sendMenuClick({ conversationId, menuId, locale })
      .then((res) => {
        setIsTyping(false);
        const bot = res.data?.botResponse;
        if (bot?.content) {
          addMessage({ senderType: "bot", content: bot.content, contentType: bot.contentType, metadata: bot.metadata });
        }
        if (res.data?.status) setConversationStatus(res.data.status);
      })
      .catch(() => setIsTyping(false));
  }, [conversationId, locale, addMessage]);

  // Navigate (from menu or cards)
  const handleNavigate = useCallback((url: string) => {
    router.push(url);
    onClose();
  }, [router, onClose]);

  // Feedback
  const handleFeedback = useCallback((messageId: number, positive: boolean) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, feedbackScore: positive ? 5 : 1 } : m));
    submitFeedback({ messageId, positive }).catch(() => {});
  }, []);

  // File upload
  const handleFileUpload = useCallback(() => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv";
    inp.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      addMessage({ senderType: "customer", content: `📎 ${file.name}`, contentType: "file", metadata: { fileName: file.name, fileSize: file.size, fileType: file.type } });
    };
    inp.click();
  }, [addMessage]);

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return locale === "ar" ? "الآن" : "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const ThreadIcon = ({ type }: { type: string }) => (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
      type === "bot" ? "bg-primary/10 text-primary" : type === "admin" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
    }`}>
      {type === "bot" ? <Bot className="h-4 w-4" /> : type === "admin" ? <Shield className="h-4 w-4" /> : <Store className="h-4 w-4" />}
    </div>
  );

  return (
    <div
      ref={windowRef}
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${size.w}px`, height: `${size.h}px` }}
      className="fixed z-50 flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
      {/* ═══ HEADER — DRAG HANDLE ═══ */}
      <div
        onMouseDown={onDragStart}
        className="flex items-center justify-between bg-primary px-4 py-2.5 text-primary-foreground shrink-0 cursor-move select-none">
        {view === "chat" && (
          <button type="button" onClick={() => setView("threads")} className="p-1 rounded-lg hover:bg-primary-foreground/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 ms-2">
          <div className="text-sm font-semibold">
            {view === "chat" && activeThread ? activeThread.name : locale === "ar" ? "الرسائل" : "Messages"}
          </div>
          <div className="text-[10px] opacity-70">
            {view === "chat" && activeThread
              ? activeThread.status === "bot" ? (locale === "ar" ? "مساعد ذكي" : "AI Assistant")
                : activeThread.status === "open" || activeThread.status === "assigned" ? (locale === "ar" ? "متصل بالدعم" : "Connected to support")
                : (locale === "ar" ? "تم الحل" : "Resolved")
              : locale === "ar" ? "محادثاتك" : "Your conversations"
            }
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === "threads" && (
            <button type="button" onClick={startNew} className="p-1.5 rounded-lg hover:bg-primary-foreground/10" title="New chat">
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary-foreground/10">
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══ THREADS VIEW ═══ */}
      {view === "threads" && (
        <div className="flex-1 overflow-y-auto">
          {/* Active Threads */}
          <div className="px-3 pt-3 pb-1">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
              {locale === "ar" ? "نشطة" : "Active"}
            </div>
          </div>
          {threads.filter((t) => t.status !== "resolved").length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{locale === "ar" ? "لا توجد محادثات نشطة" : "No active chats"}</p>
              <button type="button" onClick={startNew} className="mt-2 text-xs text-primary font-medium hover:underline">
                {locale === "ar" ? "ابدأ محادثة جديدة" : "Start a new chat"}
              </button>
            </div>
          ) : (
            threads.filter((t) => t.status !== "resolved").map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => openThread(thread)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-start"
              >
                <ThreadIcon type={thread.icon} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{thread.name}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{thread.lastTime ? timeAgo(thread.lastTime) : ""}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))
          )}

          {/* History */}
          {threads.filter((t) => t.status === "resolved").length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <History className="h-3 w-3" />
                  {locale === "ar" ? "المحادثات السابقة" : "History"}
                </div>
              </div>
              {threads.filter((t) => t.status === "resolved").map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openThread(thread)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-start opacity-60"
                >
                  <ThreadIcon type={thread.icon} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs truncate">{thread.name}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{thread.lastMessage}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Quick Actions Footer */}
          <div className="border-t mt-auto">
            <MenuGrid
              tradeRole={tradeRole}
              locale={locale}
              onMenuClick={(id) => { openThread(threads[0] || { id: "support-new", type: "bot", name: "Bot", status: "bot", unread: 0, icon: "bot" } as ChatThread); setTimeout(() => handleMenuClick(id), 300); }}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}

      {/* ═══ CHAT VIEW ═══ */}
      {view === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                locale={locale}
                onFeedback={handleFeedback}
                onButtonClick={(action, value) => {
                  if (action === "navigate") handleNavigate(value);
                  else if (action === "menu_click") handleMenuClick(value);
                  else if (action === "send_text") {
                    addMessage({ senderType: "customer", content: value, contentType: "text" });
                    if (conversationId) {
                      setIsTyping(true);
                      sendSupportMessage({ conversationId, content: value, metadata: { locale } })
                        .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMessage({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); })
                        .catch(() => setIsTyping(false));
                    }
                  }
                }}
                onNavigate={handleNavigate}
              />
            ))}

            {showMenuInChat && (
              <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={handleMenuClick} onNavigate={handleNavigate} />
            )}

            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="rounded-2xl bg-muted px-3.5 py-2 rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-background p-3 shrink-0">
            <div className="flex items-end gap-2">
              <button type="button" onClick={handleFileUpload} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type your message..."}
                className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-20"
                rows={1}
              />
              {conversationStatus === "bot" && (
                <button type="button" onClick={() => handleMenuClick("escalate")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600">
                  <Headset className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={handleSend} disabled={!input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute bottom-0 end-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 opacity-30 hover:opacity-70 transition-opacity"
      >
        <svg width="8" height="8" viewBox="0 0 10 10" className="text-muted-foreground">
          <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 5v4H5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
