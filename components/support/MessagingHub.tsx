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
import http from "@/apis/http";
import {
  Bot, Shield, Headset, Paperclip, Send,
  Plus, History, MessageSquare, Store, ChevronLeft,
  Loader2, Search, X, Minus, User, Volume2, VolumeX,
  ShoppingBag, FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
interface MessagingHubProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  user: any;
  locale: string;
}

interface ChatThread {
  id: string;
  type: "bot" | "admin" | "user";
  name: string;
  nameAr?: string;
  status: string;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
  conversationId?: number;
  roomId?: number;
  otherUserId?: number;
  avatar?: string;
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

function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; gain.gain.value = 0.08;
    osc.start(); osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 1000; g.gain.value = 0.08; o.start(); o.stop(ctx.currentTime + 0.12); }, 120);
  } catch {}
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Pop Chat Window ─────────────────────────────────────────────
function PopChat({
  thread, messages, isTyping, locale, tradeRole, conversationId, conversationStatus,
  onSend, onMenuClick, onNavigate, onFeedback, onFileUpload, onMinimize, onClose, showMenu,
}: {
  thread: ChatThread; messages: ChatMessage[]; isTyping: boolean; locale: string;
  tradeRole: string; conversationId: number | null; conversationStatus: string;
  onSend: (text: string) => void; onMenuClick: (id: string) => void;
  onNavigate: (url: string) => void; onFeedback: (id: number, positive: boolean) => void;
  onFileUpload: () => void; onMinimize: () => void; onClose: () => void; showMenu: boolean;
}) {
  const [input, setInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCount = useRef(messages.length);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [pos, setPos] = useState(() => ({ x: 0, y: 0 }));
  const [hasDragged, setHasDragged] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return;
    dragging.current = true;
    const rect = windowRef.current?.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setHasDragged(true);
      setPos({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 300)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100)),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);

  useEffect(() => {
    if (messages.length > prevCount.current && soundEnabled) {
      const last = messages[messages.length - 1];
      if (last?.senderType !== "customer") playSound();
    }
    prevCount.current = messages.length;
  }, [messages.length, soundEnabled]);

  const handleSend = () => { const t = input.trim(); if (!t) return; onSend(t); setInput(""); };
  const isEscalated = conversationStatus === "open" || conversationStatus === "assigned";

  const iconBg = thread.type === "bot" ? "bg-blue-500" : thread.type === "admin" ? "bg-green-500" : "bg-orange-500";
  const IconComp = thread.type === "bot" ? Bot : thread.type === "admin" ? Shield : User;

  const style = hasDragged
    ? { position: "fixed" as const, left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 50 }
    : {};

  return (
    <div ref={windowRef} style={style} className={`w-[320px] h-[420px] flex flex-col rounded-t-xl border border-b-0 bg-background shadow-xl overflow-hidden ${!hasDragged ? '' : ''}`}>
      {/* Header — draggable */}
      <div onMouseDown={onDragStart} className="flex items-center justify-between px-3 py-2 text-white shrink-0 cursor-move select-none" style={{ backgroundColor: thread.type === "bot" ? "#3b82f6" : thread.type === "admin" ? "#22c55e" : "#f97316" }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <IconComp className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{thread.name}</div>
            <div className="text-[9px] opacity-70">{isEscalated ? "Connected" : thread.type === "bot" ? "AI" : thread.type === "user" ? "Online" : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 rounded hover:bg-white/10">
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </button>
          <button type="button" onClick={onMinimize} className="p-1 rounded hover:bg-white/10"><Minus className="h-3 w-3" /></button>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-3 w-3" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} locale={locale} onFeedback={onFeedback}
            onButtonClick={(a, v) => { if (a === "navigate") onNavigate(v); else if (a === "menu_click") onMenuClick(v); else if (a === "send_text") onSend(v); }}
            onNavigate={onNavigate} />
        ))}
        {showMenu && <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={onMenuClick} onNavigate={onNavigate} />}
        {isTyping && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Loader2 className="h-3 w-3 animate-spin" /></div>
            <div className="rounded-2xl bg-muted px-3 py-1.5 rounded-bl-sm"><div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" /></div></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-2 py-2 shrink-0">
        <div className="flex items-end gap-1.5">
          <button type="button" onClick={onFileUpload} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><Paperclip className="h-3.5 w-3.5" /></button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
            className="flex-1 resize-none rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-16" rows={1} />
          {thread.type === "bot" && !isEscalated && (
            <button type="button" onClick={() => onMenuClick("escalate")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"><Headset className="h-3.5 w-3.5" /></button>
          )}
          <button type="button" onClick={handleSend} disabled={!input.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Hub ────────────────────────────────────────────────────
export default function MessagingHub({ onClose, onUnreadChange, user, locale }: MessagingHubProps) {
  const router = useRouter();
  const tradeRole = user?.tradeRole || "BUYER";
  const userName = user?.firstName || "";

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState("bot");
  const [view, setView] = useState<"list" | "new_chat_type" | "user_search">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const nextId = useRef(1);

  // Init support conversation
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
            lastMessage: lastMsg?.content?.slice(0, 40) ?? (locale === "ar" ? "ابدأ محادثة" : "Start a chat"),
            lastTime: lastMsg?.createdAt ?? new Date().toISOString(),
            unread: 0,
            conversationId: data.conversationId,
          };
          setThreads((prev) => {
            const filtered = prev.filter((t) => !t.id.startsWith("support-"));
            return [thread, ...filtered];
          });

          if (hasMessages) {
            const existing = data.messages.map((m: any) => ({
              id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType,
              metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
              feedbackScore: m.feedbackScore, createdAt: m.createdAt,
            }));
            setMessages([GREETING(userName, locale), ...existing]);
            nextId.current = Math.max(...existing.map((m: any) => m.id), 0) + 1;
            setShowMenu(false);
          } else {
            setMessages([GREETING(userName, locale)]);
          }
        }
      }).catch(() => {});
  }, []);

  // Poll
  useEffect(() => {
    if (!conversationId || conversationStatus === "resolved") return;
    const interval = setInterval(() => {
      getSupportHistory(conversationId).then((res) => {
        const conv = res.data;
        if (!conv?.messages) return;
        const localIds = new Set(messages.filter((m) => m.id > 0).map((m) => m.id));
        const newMsgs = conv.messages.filter((m: any) => m.id > 0 && !localIds.has(m.id));
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs.map((m: any) => ({ id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType, metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined, createdAt: m.createdAt }))]);
          const adminNew = newMsgs.filter((m: any) => m.senderType === "admin");
          if (adminNew.length > 0) onUnreadChange(adminNew.length);
        }
        if (conv.status && conv.status !== conversationStatus) {
          setConversationStatus(conv.status);
          setThreads((prev) => prev.map((t) => t.conversationId === conversationId ? { ...t, status: conv.status, type: conv.status === "open" || conv.status === "assigned" ? "admin" : "bot", name: conv.status === "open" || conv.status === "assigned" ? "Support Team" : "AI Assistant" } : t));
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, conversationStatus, messages, onUnreadChange]);

  const addMessage = useCallback((msg: Partial<ChatMessage>) => {
    const id = msg.id ?? nextId.current++;
    setMessages((prev) => [...prev, { id, senderType: "customer", content: "", contentType: "text", createdAt: new Date().toISOString(), ...msg }]);
  }, []);

  const openChat = useCallback((threadId: string) => {
    setOpenChats((prev) => prev.includes(threadId) ? prev : [...prev, threadId]);
    setMinimizedChats((prev) => prev.filter((id) => id !== threadId));
    setView("list");
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
    addMessage({ senderType: "customer", content: text });
    setShowMenu(false);
    if (conversationStatus === "open" || conversationStatus === "assigned") {
      sendSupportMessage({ conversationId, content: text, metadata: { locale } }).catch(() => {});
      addMessage({ senderType: "bot", content: locale === "ar" ? "تم إرسال رسالتك." : "Sent to support.", contentType: "status" });
    } else {
      setIsTyping(true);
      sendSupportMessage({ conversationId, content: text, metadata: { locale } })
        .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMessage({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConversationStatus(res.data.status); })
        .catch(() => { setIsTyping(false); });
    }
  }, [conversationId, conversationStatus, locale, addMessage]);

  const handleMenuClick = useCallback((menuId: string) => {
    if (!conversationId) return;
    setShowMenu(false);
    const icons: Record<string, string> = { escalate: "🛟", product_search: "🔍", order_tracker: "📦", faq: "❓" };
    addMessage({ senderType: "customer", content: icons[menuId] || menuId });
    setIsTyping(true);
    sendMenuClick({ conversationId, menuId, locale })
      .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMessage({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConversationStatus(res.data.status); })
      .catch(() => setIsTyping(false));
  }, [conversationId, locale, addMessage]);

  const handleNavigate = useCallback((url: string) => { router.push(url); onClose(); }, [router, onClose]);
  const handleFeedback = useCallback((mid: number, positive: boolean) => { setMessages((prev) => prev.map((m) => m.id === mid ? { ...m, feedbackScore: positive ? 5 : 1 } : m)); submitFeedback({ messageId: mid, positive }).catch(() => {}); }, []);
  const handleFileUpload = useCallback(() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"; inp.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) addMessage({ senderType: "customer", content: `📎 ${f.name}`, contentType: "file", metadata: { fileName: f.name, fileSize: f.size, fileType: f.type } }); }; inp.click(); }, [addMessage]);

  // Start new chat by type
  const startBotChat = useCallback(() => {
    const existing = threads.find((t) => t.type === "bot" || t.type === "admin");
    if (existing) { openChat(existing.id); } else { openChat("support-new"); }
    setShowMenu(true);
    setView("list");
  }, [threads, openChat]);

  const startAdminChat = useCallback(() => {
    const existing = threads.find((t) => t.type === "bot" || t.type === "admin");
    if (existing) { openChat(existing.id); }
    setTimeout(() => handleMenuClick("escalate"), 300);
    setView("list");
  }, [threads, openChat, handleMenuClick]);

  // User search
  const searchUsers = useCallback((term: string) => {
    setUserSearchTerm(term);
    if (term.length < 2) { setUserSearchResults([]); return; }
    setSearchingUsers(true);
    http({ method: "GET", url: "/user/search", params: { term, limit: 10 } })
      .then((res) => { setUserSearchResults(res.data?.data ?? res.data ?? []); setSearchingUsers(false); })
      .catch(() => { setUserSearchResults([]); setSearchingUsers(false); });
  }, []);

  const startUserChat = useCallback((otherUser: any) => {
    const threadId = `user-${otherUser.id}`;
    const existing = threads.find((t) => t.id === threadId);
    if (existing) { openChat(threadId); setView("list"); return; }

    const newThread: ChatThread = {
      id: threadId, type: "user", name: `${otherUser.firstName ?? ""} ${otherUser.lastName ?? ""}`.trim() || "User",
      status: "active", lastMessage: locale === "ar" ? "ابدأ محادثة" : "Start chatting", lastTime: new Date().toISOString(),
      unread: 0, otherUserId: otherUser.id,
    };
    setThreads((prev) => [newThread, ...prev]);
    openChat(threadId);
    setView("list");
  }, [threads, openChat, locale]);

  const activeThreads = threads.filter((t) => t.status !== "resolved");
  const historyThreads = threads.filter((t) => t.status === "resolved");
  const filteredThreads = searchTerm ? activeThreads.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase())) : activeThreads;

  return (
    <>
      {/* ═══ LIST PANEL ═══ */}
      <div className="fixed bottom-20 end-6 z-50 w-[320px] max-h-[520px] flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground shrink-0">
          {view !== "list" ? (
            <button type="button" onClick={() => setView("list")} className="p-1 rounded hover:bg-primary-foreground/10"><ChevronLeft className="h-4 w-4" /></button>
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          <span className="text-sm font-semibold flex-1 ms-2">
            {view === "list" ? (locale === "ar" ? "الرسائل" : "Messages")
              : view === "new_chat_type" ? (locale === "ar" ? "محادثة جديدة" : "New Chat")
              : (locale === "ar" ? "بحث عن مستخدم" : "Find User")}
          </span>
          <div className="flex items-center gap-1">
            {view === "list" && (
              <button type="button" onClick={() => setView("new_chat_type")} className="p-1 rounded hover:bg-primary-foreground/10"><Plus className="h-3.5 w-3.5" /></button>
            )}
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto">
            {/* Search */}
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={locale === "ar" ? "بحث..." : "Search..."} className="w-full rounded-lg border bg-muted/50 ps-7 pe-2 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            {/* Chat Type Buttons (compact) */}
            <div className="px-3 py-2 flex gap-2 border-b">
              <button type="button" onClick={startBotChat} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">
                <Bot className="h-4 w-4" />
                <span className="text-[10px] font-medium">{locale === "ar" ? "المساعد" : "AI Bot"}</span>
              </button>
              <button type="button" onClick={startAdminChat} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                <Shield className="h-4 w-4" />
                <span className="text-[10px] font-medium">{locale === "ar" ? "الدعم" : "Support"}</span>
              </button>
              <button type="button" onClick={() => setView("user_search")} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors">
                <User className="h-4 w-4" />
                <span className="text-[10px] font-medium">{locale === "ar" ? "مستخدم" : "User"}</span>
              </button>
            </div>

            {/* Active Threads */}
            {filteredThreads.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">{locale === "ar" ? "نشطة" : "Active"}</div>
                {filteredThreads.map((t) => {
                  const isOpen = openChats.includes(t.id);
                  const iconBg = t.type === "bot" ? "bg-blue-500/10 text-blue-600" : t.type === "admin" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600";
                  const Icon = t.type === "bot" ? Bot : t.type === "admin" ? Shield : User;
                  return (
                    <button key={t.id} type="button" onClick={() => openChat(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-start transition-colors border-b last:border-0 ${isOpen ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}><Icon className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{t.name}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">{t.lastTime ? timeAgo(t.lastTime) : ""}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{t.lastMessage}</p>
                      </div>
                      {t.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1 shrink-0">{t.unread}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* History */}
            {historyThreads.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" />{locale === "ar" ? "السابقة" : "History"}</div>
                {historyThreads.map((t) => (
                  <button key={t.id} type="button" onClick={() => openChat(t.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-start hover:bg-muted/50 opacity-50 border-b last:border-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground"><Bot className="h-3.5 w-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate">{t.name}</span>
                      <p className="text-[10px] text-muted-foreground truncate">{t.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="border-t max-h-[180px] overflow-y-auto">
              <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={(id) => { startBotChat(); setTimeout(() => handleMenuClick(id), 300); }} onNavigate={handleNavigate} />
            </div>
          </div>
        )}

        {/* ── NEW CHAT TYPE VIEW ── */}
        {view === "new_chat_type" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm text-muted-foreground">{locale === "ar" ? "اختر نوع المحادثة:" : "Choose chat type:"}</p>

            <button type="button" onClick={startBotChat} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-start">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0"><Bot className="h-5 w-5" /></div>
              <div><div className="text-sm font-medium">{locale === "ar" ? "المساعد الذكي" : "AI Assistant"}</div><div className="text-[10px] text-muted-foreground">{locale === "ar" ? "بحث، تتبع، أسئلة" : "Search, track, FAQ"}</div></div>
            </button>

            <button type="button" onClick={startAdminChat} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-green-50 dark:hover:bg-green-950 transition-colors text-start">
              <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0"><Shield className="h-5 w-5" /></div>
              <div><div className="text-sm font-medium">{locale === "ar" ? "الدعم الفني" : "Support Team"}</div><div className="text-[10px] text-muted-foreground">{locale === "ar" ? "مشاكل، شكاوى، مساعدة" : "Issues, complaints, help"}</div></div>
            </button>

            <button type="button" onClick={() => setView("user_search")} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors text-start">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0"><User className="h-5 w-5" /></div>
              <div><div className="text-sm font-medium">{locale === "ar" ? "محادثة مع مستخدم" : "Chat with User"}</div><div className="text-[10px] text-muted-foreground">{locale === "ar" ? "بائع، مشتري، عضو فريق" : "Seller, buyer, team member"}</div></div>
            </button>
          </div>
        )}

        {/* ── USER SEARCH VIEW ── */}
        {view === "user_search" && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input type="text" value={userSearchTerm} onChange={(e) => searchUsers(e.target.value)}
                  placeholder={locale === "ar" ? "اسم المستخدم أو البريد..." : "Name or email..."} autoFocus
                  className="w-full rounded-lg border bg-muted/50 ps-7 pe-2 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            {searchingUsers && <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>}

            {!searchingUsers && userSearchResults.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">{locale === "ar" ? "النتائج" : "Results"}</div>
                {userSearchResults.map((u: any) => (
                  <button key={u.id} type="button" onClick={() => startUserChat(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/50 border-b last:border-0">
                    <div className="h-9 w-9 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      {u.profilePicture ? <img src={u.profilePicture} className="h-9 w-9 rounded-full object-cover" alt="" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{u.firstName ?? ""} {u.lastName ?? ""}</div>
                      <div className="text-[10px] text-muted-foreground">{u.tradeRole ?? "USER"} · {u.email ?? ""}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searchingUsers && userSearchTerm.length >= 2 && userSearchResults.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">{locale === "ar" ? "لا توجد نتائج" : "No users found"}</div>
            )}

            {!searchingUsers && userSearchTerm.length < 2 && (
              <div className="p-4 text-center text-xs text-muted-foreground">{locale === "ar" ? "اكتب اسم المستخدم للبحث" : "Type a name to search"}</div>
            )}
          </div>
        )}
      </div>

      {/* ═══ POP WINDOWS ═══ */}
      <div className="fixed bottom-0 end-24 z-40 flex items-end gap-2" style={{ direction: "ltr" }}>
        {openChats.map((threadId) => {
          const thread = threads.find((t) => t.id === threadId) || { id: threadId, type: "bot" as const, name: "AI Assistant", status: "bot", unread: 0 };
          return (
            <PopChat key={threadId} thread={thread} messages={messages} isTyping={isTyping} locale={locale}
              tradeRole={tradeRole} conversationId={conversationId} conversationStatus={conversationStatus}
              onSend={handleSend} onMenuClick={handleMenuClick} onNavigate={handleNavigate} onFeedback={handleFeedback}
              onFileUpload={handleFileUpload} onMinimize={() => minimizeChat(threadId)} onClose={() => closeChat(threadId)} showMenu={showMenu} />
          );
        })}
      </div>

      {/* ═══ MINIMIZED TABS ═══ */}
      <div className="fixed bottom-0 end-24 z-30 flex items-end gap-1" style={{ direction: "ltr", marginInlineEnd: `${openChats.length * 328}px` }}>
        {minimizedChats.map((threadId) => {
          const t = threads.find((th) => th.id === threadId);
          if (!t) return null;
          const Icon = t.type === "bot" ? Bot : t.type === "admin" ? Shield : User;
          const bg = t.type === "bot" ? "bg-blue-500" : t.type === "admin" ? "bg-green-500" : "bg-orange-500";
          return (
            <button key={threadId} type="button" onClick={() => openChat(threadId)}
              className="flex items-center gap-2 rounded-t-lg border border-b-0 bg-background px-3 py-1.5 shadow-md hover:shadow-lg transition-shadow">
              <div className={`h-5 w-5 rounded-full ${bg} flex items-center justify-center text-white`}><Icon className="h-3 w-3" /></div>
              <span className="text-xs font-medium max-w-[80px] truncate">{t.name}</span>
              {t.unread > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white px-0.5">{t.unread}</span>}
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); closeChat(threadId); }} />
            </button>
          );
        })}
      </div>
    </>
  );
}
