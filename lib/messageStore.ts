import { create } from "zustand";

// ─── Types ───────────────────────────────────────

export interface ChatMessage {
  id: string | number;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  contentType: "text" | "file" | "system" | "rfq_update";
  createdAt: string;
  readAt?: string | null;
  attachments?: { url: string; name: string; type: string }[];
}

export interface TreeChild {
  id: string;
  label: string;
  lastMsg?: string;
  time: number; // minutes ago
  unread: number;
  online?: boolean;
}

export interface TreeItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: "product" | "session" | "person" | "review" | "order" | "buygroup";
  time: number;
  unread: number;
  online?: boolean;
  children?: TreeChild[];
}

export interface RfqAlternative {
  id: string;
  name: string;
  seller: string;
  price: number;
  stock: number;
  rating: number;
}

export interface RfqProduct {
  id: string;
  requestedName: string;
  requestedQty: number;
  requestedBudget: string;
  alternatives: RfqAlternative[];
}

export interface ChannelCount {
  id: string;
  count: number;
  children?: { id: string; count: number }[];
}

// ─── Store ───────────────────────────────────────

interface MessageState {
  // Navigation
  selectedChannelId: string | null;
  chatPersonId: string | null;
  chatRoomId: string | null;

  // Messages per room
  messages: Record<string, ChatMessage[]>;
  sendingIds: Set<string>; // optimistic sends in-flight

  // P2 tree data per channel
  channelItems: Record<string, TreeItem[]>;

  // P1 channel counts
  channelCounts: ChannelCount[];

  // P6 RFQ products (per room/conversation)
  rfqProducts: Record<string, RfqProduct[]>;

  // Online users
  onlineUsers: Set<number>;

  // Typing indicators
  typingUsers: Record<string, number[]>; // roomId → userIds typing

  // Actions — Navigation
  selectChannel: (id: string | null) => void;
  selectPerson: (personId: string | null, roomId?: string | null) => void;

  // Actions — Messages
  setMessages: (roomId: string, msgs: ChatMessage[]) => void;
  addMessage: (roomId: string, msg: ChatMessage) => void;
  addOptimisticMessage: (roomId: string, msg: ChatMessage) => void;
  confirmMessage: (roomId: string, tempId: string, realMsg: ChatMessage) => void;
  markAsRead: (roomId: string) => void;

  // Actions — Channel items
  setChannelItems: (channelId: string, items: TreeItem[]) => void;
  updateChildUnread: (channelId: string, parentId: string, childId: string, unread: number) => void;
  updateChildLastMsg: (channelId: string, parentId: string, childId: string, msg: string, time: number) => void;

  // Actions — Counts
  setChannelCounts: (counts: ChannelCount[]) => void;
  incrementCount: (channelId: string, childId?: string) => void;
  decrementCount: (channelId: string, childId?: string) => void;

  // Actions — RFQ
  setRfqProducts: (roomId: string, products: RfqProduct[]) => void;
  updateAlternativePrice: (roomId: string, productId: string, altId: string, price: number) => void;
  updateAlternativeStock: (roomId: string, productId: string, altId: string, stock: number) => void;

  // Actions — Presence
  setUserOnline: (userId: number) => void;
  setUserOffline: (userId: number) => void;
  setTyping: (roomId: string, userId: number) => void;
  clearTyping: (roomId: string, userId: number) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // ─── Initial state ─────────────────────────────
  selectedChannelId: null,
  chatPersonId: null,
  chatRoomId: null,
  messages: {},
  sendingIds: new Set(),
  channelItems: {},
  channelCounts: [],
  rfqProducts: {},
  onlineUsers: new Set(),
  typingUsers: {},

  // ─── Navigation ────────────────────────────────
  selectChannel: (id) => set({ selectedChannelId: id, chatPersonId: null, chatRoomId: null }),
  selectPerson: (personId, roomId) => set({ chatPersonId: personId, chatRoomId: roomId ?? null }),

  // ─── Messages ──────────────────────────────────
  setMessages: (roomId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: msgs } })),

  addMessage: (roomId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] ?? []), msg],
      },
    })),

  addOptimisticMessage: (roomId, msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] ?? []), msg],
      },
      sendingIds: new Set([...s.sendingIds, String(msg.id)]),
    })),

  confirmMessage: (roomId, tempId, realMsg) =>
    set((s) => {
      const msgs = (s.messages[roomId] ?? []).map((m) =>
        String(m.id) === tempId ? realMsg : m
      );
      const sending = new Set(s.sendingIds);
      sending.delete(tempId);
      return { messages: { ...s.messages, [roomId]: msgs }, sendingIds: sending };
    }),

  markAsRead: (roomId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) => ({ ...m, readAt: m.readAt ?? new Date().toISOString() })),
      },
    })),

  // ─── Channel items ─────────────────────────────
  setChannelItems: (channelId, items) =>
    set((s) => ({ channelItems: { ...s.channelItems, [channelId]: items } })),

  updateChildUnread: (channelId, parentId, childId, unread) =>
    set((s) => {
      const items = (s.channelItems[channelId] ?? []).map((item) => {
        if (item.id !== parentId) return item;
        const children = (item.children ?? []).map((ch) =>
          ch.id === childId ? { ...ch, unread } : ch
        );
        const totalUnread = children.reduce((sum, ch) => sum + ch.unread, 0);
        return { ...item, children, unread: totalUnread };
      });
      return { channelItems: { ...s.channelItems, [channelId]: items } };
    }),

  updateChildLastMsg: (channelId, parentId, childId, msg, time) =>
    set((s) => {
      const items = (s.channelItems[channelId] ?? []).map((item) => {
        if (item.id !== parentId) return item;
        const children = (item.children ?? []).map((ch) =>
          ch.id === childId ? { ...ch, lastMsg: msg, time } : ch
        );
        return { ...item, children, time: Math.min(item.time, time) };
      });
      return { channelItems: { ...s.channelItems, [channelId]: items } };
    }),

  // ─── Counts ────────────────────────────────────
  setChannelCounts: (counts) => set({ channelCounts: counts }),

  incrementCount: (channelId, childId) =>
    set((s) => ({
      channelCounts: s.channelCounts.map((c) => {
        if (c.id !== channelId) return c;
        if (childId && c.children) {
          const children = c.children.map((ch) =>
            ch.id === childId ? { ...ch, count: ch.count + 1 } : ch
          );
          return { ...c, count: c.count + 1, children };
        }
        return { ...c, count: c.count + 1 };
      }),
    })),

  decrementCount: (channelId, childId) =>
    set((s) => ({
      channelCounts: s.channelCounts.map((c) => {
        if (c.id !== channelId) return c;
        if (childId && c.children) {
          const children = c.children.map((ch) =>
            ch.id === childId ? { ...ch, count: Math.max(0, ch.count - 1) } : ch
          );
          return { ...c, count: Math.max(0, c.count - 1), children };
        }
        return { ...c, count: Math.max(0, c.count - 1) };
      }),
    })),

  // ─── RFQ ───────────────────────────────────────
  setRfqProducts: (roomId, products) =>
    set((s) => ({ rfqProducts: { ...s.rfqProducts, [roomId]: products } })),

  updateAlternativePrice: (roomId, productId, altId, price) =>
    set((s) => ({
      rfqProducts: {
        ...s.rfqProducts,
        [roomId]: (s.rfqProducts[roomId] ?? []).map((p) =>
          p.id !== productId ? p : {
            ...p,
            alternatives: p.alternatives.map((a) =>
              a.id === altId ? { ...a, price } : a
            ),
          }
        ),
      },
    })),

  updateAlternativeStock: (roomId, productId, altId, stock) =>
    set((s) => ({
      rfqProducts: {
        ...s.rfqProducts,
        [roomId]: (s.rfqProducts[roomId] ?? []).map((p) =>
          p.id !== productId ? p : {
            ...p,
            alternatives: p.alternatives.map((a) =>
              a.id === altId ? { ...a, stock } : a
            ),
          }
        ),
      },
    })),

  // ─── Presence ──────────────────────────────────
  setUserOnline: (userId) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),

  setUserOffline: (userId) =>
    set((s) => {
      const online = new Set(s.onlineUsers);
      online.delete(userId);
      return { onlineUsers: online };
    }),

  setTyping: (roomId, userId) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [roomId]: [...(s.typingUsers[roomId] ?? []).filter((id) => id !== userId), userId],
      },
    })),

  clearTyping: (roomId, userId) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [roomId]: (s.typingUsers[roomId] ?? []).filter((id) => id !== userId),
      },
    })),
}));
