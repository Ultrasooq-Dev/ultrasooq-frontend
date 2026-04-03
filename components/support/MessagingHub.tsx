"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMessageStore } from "@/lib/messageStore";
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
import { track } from "@/lib/analytics";
import {
  Bot, Shield, Headset, Paperclip, Send,
  Plus, History, MessageSquare, Store, ChevronLeft, ChevronDown,
  Loader2, Search, X, Minus, User, Volume2, VolumeX,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
interface MessagingHubProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  user: any;
  locale: string;
}

interface ChatSession {
  id: string;             // "support-{convId}" or "user-{otherUserId}"
  type: "support" | "user";
  name: string;
  status: "active" | "resolved";
  lastMessage?: string;
  lastTime?: string;
  unread: number;
  conversationId?: number; // for support sessions
  otherUserId?: number;    // for user-to-user
  // Support-specific
  botOrAdmin?: "bot" | "admin";
}

function playSound() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; g.gain.value = 0.08;
    o.start(); o.stop(ctx.currentTime + 0.12);
    setTimeout(() => { const o2 = ctx.createOscillator(); const g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination); o2.frequency.value = 1000; g2.gain.value = 0.08; o2.start(); o2.stop(ctx.currentTime + 0.12); }, 120);
  } catch {}
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
}

const GREETING = (name: string, locale: string): ChatMessage => ({
  id: -1, senderType: "bot",
  content: locale === "ar" ? `مرحبا${name ? " " + name : ""}! 👋 كيف يمكنني مساعدتك؟` : `Hi${name ? " " + name : ""}! 👋 How can I help you?`,
  contentType: "text", createdAt: new Date().toISOString(),
});

// ─── Pop Chat Window ─────────────────────────────────────────────
function PopChat({
  session, locale, tradeRole, userId, userName,
  onMinimize, onClose,
}: {
  session: ChatSession; locale: string; tradeRole: string; userId: number; userName: string;
  onMinimize: () => void; onClose: () => void;
}) {
  const router = useRouter();
  const isUserChat = session.type === "user";
  const [messages, setMessages] = useState<ChatMessage[]>(isUserChat ? [] : [GREETING(userName, locale)]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(!isUserChat);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [convId, setConvId] = useState<number | null>(session.conversationId ?? null);
  const [convStatus, setConvStatus] = useState(session.botOrAdmin === "admin" ? "open" : "bot");
  const [userRoomId, setUserRoomId] = useState<number | null>(null);
  const prevCount = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Drag
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const dragging = useRef(false);
  const dragOff = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return;
    dragging.current = true;
    const r = windowRef.current?.getBoundingClientRect();
    dragOff.current = { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; setHasDragged(true); setPos({ x: Math.max(0, e.clientX - dragOff.current.x), y: Math.max(0, e.clientY - dragOff.current.y) }); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ─── USER-TO-USER: Load real messages from room ───
  useEffect(() => {
    if (!isUserChat || !session.otherUserId) return;

    // Find or create room
    http({ method: "GET", url: "/chat/find-room", params: { rfqId: 0, userId: session.otherUserId } })
      .then((res) => {
        const roomId = res.data?.data?.id ?? res.data?.id;
        if (roomId) return roomId;
        // No room exists — create one
        return http({ method: "POST", url: "/chat/createPrivateRoom", data: {
          creatorId: userId, participants: [userId, session.otherUserId], rfqId: 0,
        }}).then((r) => r.data?.id ?? r.data);
      })
      .then((roomId) => {
        if (!roomId) return;
        setUserRoomId(roomId);
        // Load messages
        return http({ method: "GET", url: "/chat/messages", params: { roomId } });
      })
      .then((res) => {
        if (!res?.data?.data) return;
        const msgs: ChatMessage[] = res.data.data.map((m: any) => ({
          id: m.id,
          senderType: m.userId === userId ? "customer" : "bot",
          content: m.content ?? "",
          contentType: "text",
          createdAt: m.createdAt,
          metadata: { userName: m.user?.firstName ?? "User" },
        }));
        setMessages(msgs);
        nextId.current = Math.max(...msgs.map((m) => (typeof m.id === "number" ? m.id : 0)), 0) + 1;
      })
      .catch(() => {});
  }, [isUserChat, session.otherUserId, userId]);

  // USER-TO-USER: Poll for new messages
  useEffect(() => {
    if (!isUserChat || !userRoomId) return;
    const interval = setInterval(() => {
      http({ method: "GET", url: "/chat/messages", params: { roomId: userRoomId } })
        .then((res) => {
          if (!res?.data?.data) return;
          const localIds = new Set(messages.filter((m) => typeof m.id === "number" && m.id > 0).map((m) => m.id));
          const newMsgs = res.data.data.filter((m: any) => !localIds.has(m.id));
          if (newMsgs.length > 0) {
            setMessages((prev) => [...prev, ...newMsgs.map((m: any) => ({
              id: m.id,
              senderType: m.userId === userId ? "customer" : "bot",
              content: m.content ?? "",
              contentType: "text",
              createdAt: m.createdAt,
              metadata: { userName: m.user?.firstName ?? "User" },
            }))]);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [isUserChat, userRoomId, userId, messages]);

  // Init support conversation for this window
  useEffect(() => {
    if (session.type === "support" && !convId) {
      const isNew = session.id.startsWith("support-new");
      initSupportChat({ locale }, isNew).then((res) => {
        const d = res.data;
        if (d?.conversationId) {
          setConvId(d.conversationId);
          setConvStatus(d.status || "bot");
          if (d.messages?.length > 0) {
            const existing = d.messages.map((m: any) => ({
              id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType,
              metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
              createdAt: m.createdAt,
            }));
            setMessages([GREETING(userName, locale), ...existing]);
            nextId.current = Math.max(...existing.map((m: any) => m.id), 0) + 1;
            setShowMenu(false);
          }
        }
      }).catch(() => {});
    }
  }, [session.type, convId, locale, userName]);

  // Poll for new messages
  useEffect(() => {
    if (!convId || convStatus === "resolved") return;
    const interval = setInterval(() => {
      getSupportHistory(convId).then((res) => {
        const conv = res.data;
        if (!conv?.messages) return;
        const localIds = new Set(messages.filter((m) => m.id > 0).map((m) => m.id));
        const newMsgs = conv.messages.filter((m: any) => m.id > 0 && !localIds.has(m.id));
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs.map((m: any) => ({
            id: m.id, senderType: m.senderType, content: m.content, contentType: m.contentType,
            metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : undefined,
            createdAt: m.createdAt,
          }))]);
        }
        if (conv.status && conv.status !== convStatus) setConvStatus(conv.status);
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [convId, convStatus, messages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isTyping]);
  useEffect(() => {
    if (messages.length > prevCount.current && prevCount.current > 0 && soundEnabled) {
      const last = messages[messages.length - 1];
      if (last?.senderType !== "customer") playSound();
    }
    prevCount.current = messages.length;
  }, [messages.length, soundEnabled]);

  const addMsg = useCallback((msg: Partial<ChatMessage>) => {
    setMessages((prev) => [...prev, { id: msg.id ?? nextId.current++, senderType: "customer", content: "", contentType: "text", createdAt: new Date().toISOString(), ...msg }]);
  }, []);

  const sendWithConv = useCallback((text: string, cid: number) => {
    if (convStatus === "open" || convStatus === "assigned") {
      sendSupportMessage({ conversationId: cid, content: text, metadata: { locale } }).catch(() => {});
      addMsg({ senderType: "bot", content: locale === "ar" ? "تم إرسال رسالتك." : "Sent to support.", contentType: "status" });
    } else {
      setIsTyping(true);
      sendSupportMessage({ conversationId: cid, content: text, metadata: { locale } })
        .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMsg({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConvStatus(res.data.status); })
        .catch(() => setIsTyping(false));
    }
  }, [convStatus, locale, addMsg]);

  const handleSend = () => {
    const text = input.trim(); if (!text) return;
    addMsg({ senderType: "customer", content: text }); setInput(""); setShowMenu(false);

    // User-to-user: send via REST API to real room
    if (isUserChat) {
      if (userRoomId) {
        http({ method: "POST", url: "/chat/send-message", data: {
          content: text, userId, roomId: userRoomId, rfqId: 0,
        }}).catch(() => {});
      }
      return;
    }

    // Support: existing flow
    if (convId) {
      sendWithConv(text, convId);
    } else {
      setIsTyping(true);
      initSupportChat({ locale }, true).then((res) => {
        const d = res.data;
        if (d?.conversationId) {
          setConvId(d.conversationId);
          setConvStatus(d.status || "bot");
          sendWithConv(text, d.conversationId);
        } else {
          setIsTyping(false);
        }
      }).catch(() => { setIsTyping(false); });
    }
  };

  const sendMenuWithConv = useCallback((menuId: string, cid: number) => {
    setIsTyping(true);
    sendMenuClick({ conversationId: cid, menuId, locale })
      .then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMsg({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); if (res.data?.status) setConvStatus(res.data.status); })
      .catch(() => setIsTyping(false));
  }, [locale, addMsg]);

  const handleMenuClick = (menuId: string) => {
    setShowMenu(false);
    const icons: Record<string, string> = { escalate: "🛟", product_search: "🔍", order_tracker: "📦", faq: "❓" };
    addMsg({ senderType: "customer", content: icons[menuId] || menuId });

    if (convId) {
      sendMenuWithConv(menuId, convId);
    } else {
      setIsTyping(true);
      initSupportChat({ locale }, true).then((res) => {
        const d = res.data;
        if (d?.conversationId) {
          setConvId(d.conversationId);
          setConvStatus(d.status || "bot");
          sendMenuWithConv(menuId, d.conversationId);
        } else { setIsTyping(false); }
      }).catch(() => { setIsTyping(false); });
    }
  };

  const handleNavigate = (url: string) => { router.push(url); };
  const handleFeedback = (mid: number, positive: boolean) => { setMessages((prev) => prev.map((m) => m.id === mid ? { ...m, feedbackScore: positive ? 5 : 1 } : m)); submitFeedback({ messageId: mid, positive }).catch(() => {}); };
  const handleFileUpload = () => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"; inp.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) addMsg({ senderType: "customer", content: `📎 ${f.name}`, contentType: "file", metadata: { fileName: f.name, fileSize: f.size, fileType: f.type } }); }; inp.click(); };

  const isEscalated = convStatus === "open" || convStatus === "assigned";
  const color = session.type === "support" ? (isEscalated ? "#22c55e" : "#3b82f6") : "#f97316";
  const Icon = session.type === "support" ? (isEscalated ? Shield : Bot) : User;
  const style = hasDragged ? { position: "fixed" as const, left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 50 } : {};

  return (
    <div ref={windowRef} style={style} className="w-[300px] h-[400px] flex flex-col rounded-t-xl border border-b-0 bg-background shadow-xl overflow-hidden">
      <div onMouseDown={onDragStart} className="flex items-center justify-between px-3 py-1.5 text-white shrink-0 cursor-move select-none" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Icon className="h-3 w-3" /></div>
          <div className="text-xs font-semibold truncate">{session.name}</div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => setSoundEnabled(!soundEnabled)} className="p-0.5 rounded hover:bg-white/10">{soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}</button>
          <button type="button" onClick={onMinimize} className="p-0.5 rounded hover:bg-white/10"><Minus className="h-3 w-3" /></button>
          <button type="button" onClick={onClose} className="p-0.5 rounded hover:bg-white/10"><X className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-[200px]">
        {messages.length === 0 && !showMenu && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-xs">{locale === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}</span>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} locale={locale} onFeedback={handleFeedback}
            onButtonClick={(a, v) => { if (a === "navigate") handleNavigate(v); else if (a === "menu_click") handleMenuClick(v); else if (a === "send_text") { addMsg({ senderType: "customer", content: v }); if (convId) { setIsTyping(true); sendSupportMessage({ conversationId: convId, content: v, metadata: { locale } }).then((res) => { setIsTyping(false); const b = res.data?.botResponse; if (b?.content) addMsg({ senderType: "bot", content: b.content, contentType: b.contentType, metadata: b.metadata }); }).catch(() => setIsTyping(false)); } } }}
            onNavigate={handleNavigate} />
        ))}
        {showMenu && !isUserChat && <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={handleMenuClick} onNavigate={handleNavigate} />}
        {isTyping && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Loader2 className="h-3 w-3 animate-spin" /></div>
            <div className="rounded-2xl bg-muted px-2.5 py-1 rounded-bl-sm"><div className="flex gap-1"><span className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-bounce" /><span className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" /><span className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" /></div></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t px-2 py-1.5 shrink-0">
        <div className="flex items-end gap-1">
          <button type="button" onClick={handleFileUpload} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"><Paperclip className="h-3 w-3" /></button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={locale === "ar" ? "اكتب..." : "Type..."} className="flex-1 resize-none rounded border bg-muted/50 px-2 py-1 text-[11px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-12" rows={1} />
          {session.type === "support" && !isEscalated && (
            <button type="button" onClick={() => handleMenuClick("escalate")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-red-500"><Headset className="h-3 w-3" /></button>
          )}
          <button type="button" onClick={handleSend} disabled={!input.trim()} className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground disabled:opacity-30"><Send className="h-3 w-3" /></button>
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
  const userId = user?.id || 0;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "support_list" | "user_list" | "user_search">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const sessionCounter = useRef(1);

  // ─── Unread counts from store (for badge) + fetch user rooms from API ───
  const { channelCounts } = useMessageStore();
  const [userRooms, setUserRooms] = useState<Array<{ id: number; name: string; lastMsg: string; time: string; unread: number; otherUserId?: number; otherUserName?: string }>>([]);

  // Fetch user chat rooms from API when Users tab opens
  useEffect(() => {
    if (view !== "user_list" || !userId) return;
    http({ method: "GET", url: "/chat/channels/summary" })
      .then((res) => {
        // Get all non-support channel conversations
        const channels = (res.data?.data ?? res.data ?? []).filter((c: any) => c.id !== "support" && c.id !== "unread");
        // Fetch conversations for each channel
        const fetches = channels.map((ch: any) =>
          http({ method: "GET", url: `/chat/channels/${ch.id}/conversations` }).catch(() => ({ data: { data: [] } }))
        );
        return Promise.all(fetches);
      })
      .then((results) => {
        const rooms: typeof userRooms = [];
        for (const res of results) {
          const convos = res.data?.data ?? res.data ?? [];
          for (const c of convos) {
            if (c.unreadCount > 0 || c.lastMessage) {
              const otherParticipant = c.participants?.find((p: any) => p.userId !== userId);
              rooms.push({
                id: c.id,
                name: c.name || otherParticipant?.user?.firstName || `Room #${c.id}`,
                lastMsg: c.lastMessage?.content ?? "",
                time: c.lastMessageAt ?? c.createdAt ?? "",
                unread: c.unreadCount ?? 0,
                otherUserId: otherParticipant?.userId,
                otherUserName: otherParticipant?.user?.firstName,
              });
            }
          }
        }
        rooms.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setUserRooms(rooms);
      })
      .catch(() => {});
  }, [view, userId]);
  const supportUnread = useMemo(() => {
    const fromStore = channelCounts.find((c) => c.id === "support");
    if (fromStore) return fromStore.count;
    // Fallback: count from local sessions
    return sessions.filter(s => s.type === "support" && s.unread > 0).reduce((sum, s) => sum + s.unread, 0);
  }, [channelCounts, sessions]);
  const usersUnread = useMemo(() => {
    // From fetched user rooms
    const fromRooms = userRooms.reduce((sum, r) => sum + r.unread, 0);
    if (fromRooms > 0) return fromRooms;
    // From store counts
    const fromStore = channelCounts
      .filter((c) => c.id !== "support" && c.id !== "unread")
      .reduce((sum, c) => sum + c.count, 0);
    if (fromStore > 0) return fromStore;
    // Fallback: local sessions
    return sessions.filter(s => s.type === "user" && s.unread > 0).reduce((sum, s) => sum + s.unread, 0);
  }, [userRooms, channelCounts, sessions]);

  // Push total unread to parent floating button badge
  useEffect(() => {
    onUnreadChange(supportUnread + usersUnread);
  }, [supportUnread, usersUnread, onUnreadChange]);

  // Load existing support sessions
  useEffect(() => {
    initSupportChat({ locale }).then((res) => {
      const d = res.data;
      if (d?.conversationId) {
        const isEscalated = d.status === "open" || d.status === "assigned";
        const lastMsg = d.messages?.length > 0 ? d.messages[d.messages.length - 1] : null;
        setSessions((prev) => {
          if (prev.some((s) => s.conversationId === d.conversationId)) return prev;
          return [{
            id: `support-${d.conversationId}`,
            type: "support", name: `Support #${sessionCounter.current++}`,
            status: d.status === "resolved" ? "resolved" : "active",
            lastMessage: lastMsg?.content?.slice(0, 40) ?? (locale === "ar" ? "محادثة جديدة" : "New chat"),
            lastTime: lastMsg?.createdAt ?? new Date().toISOString(),
            unread: 0, conversationId: d.conversationId,
            botOrAdmin: isEscalated ? "admin" : "bot",
          }, ...prev];
        });
      }
    }).catch(() => {});
  }, [locale]);

  const openChat = useCallback((id: string) => {
    setOpenChats((prev) => prev.includes(id) ? prev : [...prev, id]);
    setMinimizedChats((prev) => prev.filter((x) => x !== id));
    track("support_chat_opened", { threadId: id });
  }, []);

  const minimizeChat = useCallback((id: string) => {
    setOpenChats((prev) => prev.filter((x) => x !== id));
    setMinimizedChats((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const closeChat = useCallback((id: string) => {
    setOpenChats((prev) => prev.filter((x) => x !== id));
    setMinimizedChats((prev) => prev.filter((x) => x !== id));
  }, []);

  // New support session
  const newSupportSession = useCallback(() => {
    const id = `support-new-${Date.now()}`;
    const session: ChatSession = {
      id, type: "support", name: `Support #${sessionCounter.current++}`,
      status: "active", lastMessage: locale === "ar" ? "محادثة جديدة" : "New session",
      lastTime: new Date().toISOString(), unread: 0, botOrAdmin: "bot",
    };
    setSessions((prev) => [session, ...prev]);
    openChat(id);
    setView("list");
    track("support_session_created", { sessionId: id });
  }, [locale, openChat]);

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
    const id = `user-${otherUser.id}`;
    if (!sessions.some((s) => s.id === id)) {
      setSessions((prev) => [{
        id, type: "user", name: `${otherUser.firstName ?? ""} ${otherUser.lastName ?? ""}`.trim() || "User",
        status: "active", lastMessage: locale === "ar" ? "ابدأ محادثة" : "Start chatting",
        lastTime: new Date().toISOString(), unread: 0, otherUserId: otherUser.id,
      }, ...prev]);
    }
    openChat(id); setView("list");
    track("user_chat_started", { otherUserId: otherUser.id, otherUserName: otherUser.firstName });
  }, [sessions, locale, openChat]);

  const active = sessions.filter((s) => s.status === "active");
  const history = sessions.filter((s) => s.status === "resolved");
  const filtered = searchTerm ? active.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase())) : active;

  return (
    <>
      {/* ═══ LIST PANEL ═══ */}
      <div className="fixed bottom-20 end-6 z-50 w-[300px] min-h-[320px] max-h-[480px] flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground shrink-0">
          {view !== "list" && <button type="button" onClick={() => view === "user_search" ? setView("user_list") : setView("list")} className="p-1 rounded hover:bg-primary-foreground/10"><ChevronLeft className="h-4 w-4" /></button>}
          <MessageSquare className="h-4 w-4 ms-1" />
          <span className="text-sm font-semibold flex-1 ms-2">
            {view === "list" ? (locale === "ar" ? "الرسائل" : "Messages")
              : view === "support_list" ? (locale === "ar" ? "جلسات الدعم" : "Support Sessions")
              : view === "user_list" ? (locale === "ar" ? "محادثات المستخدمين" : "User Chats")
              : (locale === "ar" ? "بحث مستخدم" : "Find User")}
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10"><X className="h-3.5 w-3.5" /></button>
        </div>

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

            {/* Chat Type Buttons */}
            <div className="px-3 py-2 flex gap-2 border-b">
              <button type="button" onClick={() => setView("support_list")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-medium transition-colors">
                <Shield className="h-3.5 w-3.5" /> {locale === "ar" ? "الدعم" : "Support"}
                {supportUnread > 0 && (
                  <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[8px] px-0.5">{supportUnread}</span>
                )}
              </button>
              <button type="button" onClick={() => setView("user_list")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-xs font-medium transition-colors">
                <User className="h-3.5 w-3.5" /> {locale === "ar" ? "المستخدمين" : "Users"}
                {usersUnread > 0 && (
                  <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-orange-600 text-white text-[8px] px-0.5">{usersUnread}</span>
                )}
              </button>
            </div>

            {/* Current Sessions */}
            {filtered.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground tracking-wider">
                  {locale === "ar" ? "الجلسات الحالية" : "Current Sessions"} · {filtered.length}
                </div>
                {filtered.map((s) => {
                  const isOpen = openChats.includes(s.id);
                  const Icon = s.type === "support" ? (s.botOrAdmin === "admin" ? Shield : Bot) : User;
                  const color = s.type === "support" ? (s.botOrAdmin === "admin" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600") : "bg-orange-500/10 text-orange-600";
                  return (
                    <button key={s.id} type="button" onClick={() => openChat(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-start transition-colors border-b last:border-0 ${isOpen ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}><Icon className="h-3.5 w-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{s.name}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">{s.lastTime ? timeAgo(s.lastTime) : ""}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{s.lastMessage}</p>
                      </div>
                      {s.unread > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white px-0.5 shrink-0">{s.unread}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-muted-foreground text-xs">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-20" />
                {locale === "ar" ? "لا توجد محادثات نشطة" : "No active chats"}
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <History className="h-3 w-3" /> {locale === "ar" ? "السابقة" : "Past Sessions"}
                </div>
                {history.map((s) => (
                  <button key={s.id} type="button" onClick={() => openChat(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-start hover:bg-muted/50 opacity-50 border-b last:border-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] truncate">{s.name}</span>
                      <p className="text-[9px] text-muted-foreground truncate">{s.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions — collapsed */}
            <div className="border-t">
              <button type="button" onClick={() => setActionsExpanded(!actionsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground hover:bg-muted/50">
                <span>{locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${actionsExpanded ? "rotate-180" : ""}`} />
              </button>
              {actionsExpanded && (
                <div className="max-h-[180px] overflow-y-auto">
                  <MenuGrid tradeRole={tradeRole} locale={locale} onMenuClick={() => { newSupportSession(); }} onNavigate={(url) => { window.location.href = url; onClose(); }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUPPORT SESSIONS LIST ── */}
        {view === "support_list" && (
          <div className="flex-1 overflow-y-auto">
            <button type="button" onClick={newSupportSession}
              className="w-full flex items-center gap-2 px-3 py-3 text-start border-b hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0"><Plus className="h-4 w-4" /></div>
              <div className="text-xs font-semibold text-blue-600">{locale === "ar" ? "جلسة دعم جديدة" : "New Support Session"}</div>
            </button>

            {sessions.filter(s => s.type === "support" && s.status === "active").length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground">{locale === "ar" ? "نشطة" : "Active"}</div>
                {sessions.filter(s => s.type === "support" && s.status === "active").map((s) => {
                  const Icon = s.botOrAdmin === "admin" ? Shield : Bot;
                  const color = s.botOrAdmin === "admin" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600";
                  return (
                    <button key={s.id} type="button" onClick={() => { openChat(s.id); setView("list"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-start hover:bg-muted/50 border-b">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}><Icon className="h-3.5 w-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{s.name}</span>
                          <span className="text-[9px] text-muted-foreground">{s.lastTime ? timeAgo(s.lastTime) : ""}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{s.lastMessage}</p>
                      </div>
                      {s.unread > 0 && <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white px-0.5">{s.unread}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {sessions.filter(s => s.type === "support" && s.status === "resolved").length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" />{locale === "ar" ? "محلولة" : "Resolved"}</div>
                {sessions.filter(s => s.type === "support" && s.status === "resolved").map((s) => (
                  <button key={s.id} type="button" onClick={() => { openChat(s.id); setView("list"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-start hover:bg-muted/50 opacity-50 border-b">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px]">{s.name}</span>
                      <p className="text-[9px] text-muted-foreground truncate">{s.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {sessions.filter(s => s.type === "support").length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                <Shield className="h-6 w-6 mx-auto mb-2 opacity-20" />
                {locale === "ar" ? "لا توجد جلسات دعم" : "No support sessions yet"}
              </div>
            )}
          </div>
        )}

        {/* ── USER CHATS LIST — real rooms from API + local sessions ── */}
        {view === "user_list" && (
          <div className="flex-1 overflow-y-auto">
            {/* Rooms fetched from API */}
            {userRooms.length > 0 && (
              <div>
                <div className="flex items-center px-3 pt-2 pb-1">
                  <span className="flex-1 text-[9px] font-semibold uppercase text-muted-foreground tracking-wider">
                    {locale === "ar" ? "المحادثات" : "Conversations"} · {userRooms.length}
                  </span>
                  {userRooms.filter((r) => r.unread > 0).length > 1 && (
                    <button type="button"
                      onClick={() => {
                        // Open ALL unread rooms as pop chats
                        const unreadRooms = userRooms.filter((r) => r.unread > 0);
                        const newSessions: ChatSession[] = [];
                        const newOpenIds: string[] = [];
                        for (const room of unreadRooms) {
                          const chatId = `user-${room.otherUserId ?? room.id}`;
                          if (!sessions.some((s) => s.id === chatId)) {
                            newSessions.push({
                              id: chatId, type: "user",
                              name: room.otherUserName ?? room.name,
                              status: "active",
                              lastMessage: room.lastMsg,
                              lastTime: room.time,
                              unread: room.unread,
                              otherUserId: room.otherUserId,
                            });
                          }
                          newOpenIds.push(chatId);
                        }
                        if (newSessions.length > 0) setSessions((prev) => [...newSessions, ...prev]);
                        setOpenChats((prev) => [...new Set([...prev, ...newOpenIds])]);
                        setView("list");
                      }}
                      className="text-[9px] font-semibold text-primary hover:underline"
                    >
                      {locale === "ar" ? "فتح الكل" : "Open All"}
                    </button>
                  )}
                </div>
                {userRooms.map((room) => (
                  <button key={room.id} type="button"
                    onClick={() => {
                      // Open as a PopChat inside the widget
                      const chatId = `user-${room.otherUserId ?? room.id}`;
                      if (!sessions.some((s) => s.id === chatId)) {
                        setSessions((prev) => [{
                          id: chatId, type: "user",
                          name: room.otherUserName ?? room.name,
                          status: "active" as const,
                          lastMessage: room.lastMsg,
                          lastTime: room.time,
                          unread: room.unread,
                          otherUserId: room.otherUserId,
                        }, ...prev]);
                      }
                      openChat(chatId);
                      setView("list");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-start hover:bg-muted/50 border-b">
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
                        <span className="text-xs font-bold">{(room.otherUserName ?? room.name).charAt(0)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${room.unread > 0 ? "font-bold" : "font-medium"}`}>{room.otherUserName ?? room.name}</span>
                        <span className="text-[9px] text-muted-foreground shrink-0 ms-1">{room.time ? timeAgo(room.time) : ""}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{room.lastMsg}</p>
                    </div>
                    {room.unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white px-0.5 shrink-0">{room.unread}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* New chat + local sessions */}
            <button type="button" onClick={() => setView("user_search")}
              className="w-full flex items-center gap-2 px-3 py-3 text-start border-b hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0"><Plus className="h-4 w-4" /></div>
              <div className="text-xs font-semibold text-orange-600">{locale === "ar" ? "محادثة مع مستخدم جديد" : "Chat with new user"}</div>
            </button>

            {sessions.filter(s => s.type === "user" && s.status === "active").length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground">{locale === "ar" ? "نشطة" : "Active"}</div>
                {sessions.filter(s => s.type === "user" && s.status === "active").map((s) => (
                  <button key={s.id} type="button" onClick={() => { openChat(s.id); setView("list"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-start hover:bg-muted/50 border-b">
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{s.name}</span>
                        <span className="text-[9px] text-muted-foreground">{s.lastTime ? timeAgo(s.lastTime) : ""}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{s.lastMessage}</p>
                    </div>
                    {s.unread > 0 && <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white px-0.5">{s.unread}</span>}
                  </button>
                ))}
              </div>
            )}

            {sessions.filter(s => s.type === "user" && s.status === "resolved").length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" />{locale === "ar" ? "سابقة" : "Past"}</div>
                {sessions.filter(s => s.type === "user" && s.status === "resolved").map((s) => (
                  <button key={s.id} type="button" onClick={() => { openChat(s.id); setView("list"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-start hover:bg-muted/50 opacity-50 border-b">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-3 w-3 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px]">{s.name}</span>
                      <p className="text-[9px] text-muted-foreground truncate">{s.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {sessions.filter(s => s.type === "user").length === 0 && userRooms.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                <User className="h-6 w-6 mx-auto mb-2 opacity-20" />
                {locale === "ar" ? "لا توجد محادثات" : "No user chats yet"}
              </div>
            )}

            {/* View all in full messages page */}
            <button type="button" onClick={() => { window.location.href = "/messages"; }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-primary border-t hover:bg-primary/5 transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
              {locale === "ar" ? "عرض الكل في الرسائل" : "View all in Messages"}
            </button>
          </div>
        )}

        {/* ── USER SEARCH ── */}
        {view === "user_search" && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input type="text" value={userSearchTerm} onChange={(e) => searchUsers(e.target.value)} autoFocus
                  placeholder={locale === "ar" ? "اسم أو بريد..." : "Name or email..."} className="w-full rounded-lg border bg-muted/50 ps-7 pe-2 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            {searchingUsers && <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>}
            {!searchingUsers && userSearchResults.length > 0 && userSearchResults.map((u: any) => (
              <button key={u.id} type="button" onClick={() => startUserChat(u)} className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/50 border-b">
                <div className="h-8 w-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{u.firstName ?? ""} {u.lastName ?? ""}</div>
                  <div className="text-[10px] text-muted-foreground">{u.tradeRole ?? ""} · {u.email ?? ""}</div>
                </div>
              </button>
            ))}
            {!searchingUsers && userSearchTerm.length >= 2 && userSearchResults.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">{locale === "ar" ? "لا توجد نتائج" : "No users found"}</div>
            )}
          </div>
        )}
      </div>

      {/* ═══ POP WINDOWS ═══ */}
      <div className="fixed bottom-0 end-24 z-40 flex items-end gap-1" style={{ direction: "ltr" }}>
        {openChats.map((id) => {
          const session = sessions.find((s) => s.id === id);
          if (!session) return null;
          return <PopChat key={id} session={session} locale={locale} tradeRole={tradeRole} userId={userId} userName={userName} onMinimize={() => minimizeChat(id)} onClose={() => closeChat(id)} />;
        })}
      </div>

      {/* ═══ MINIMIZED TABS ═══ */}
      <div className="fixed bottom-0 end-24 z-30 flex items-end gap-1" style={{ direction: "ltr", marginInlineEnd: `${openChats.length * 308}px` }}>
        {minimizedChats.map((id) => {
          const s = sessions.find((x) => x.id === id);
          if (!s) return null;
          const Icon = s.type === "support" ? Shield : User;
          const bg = s.type === "support" ? "bg-blue-500" : "bg-orange-500";
          return (
            <button key={id} type="button" onClick={() => openChat(id)} className="flex items-center gap-1.5 rounded-t-lg border border-b-0 bg-background px-2.5 py-1 shadow-md hover:shadow-lg">
              <div className={`h-4 w-4 rounded-full ${bg} flex items-center justify-center text-white`}><Icon className="h-2.5 w-2.5" /></div>
              <span className="text-[10px] font-medium max-w-[70px] truncate">{s.name}</span>
              {s.unread > 0 && <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] text-white px-0.5">{s.unread}</span>}
              <X className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); closeChat(id); }} />
            </button>
          );
        })}
      </div>
    </>
  );
}
