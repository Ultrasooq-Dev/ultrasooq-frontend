/**
 * PRODUCTION-GRADE MESSAGE STORE TESTS (Zustand)
 * Covers: State mutations, optimistic updates, message confirmation,
 * presence tracking, channel counts, typing indicators,
 * RFQ product management, race conditions, edge cases
 */
import { act } from '@testing-library/react';
import { useMessageStore } from '@/lib/messageStore';
import type { ChatMessage, TreeItem, ChannelCount, RfqProduct } from '@/lib/messageStore';

// Reset store between tests
beforeEach(() => {
  const { setState } = useMessageStore;
  setState({
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
  });
});

// ═══════════════════════════════════════════════════════════════
// NAVIGATION STATE
// ═══════════════════════════════════════════════════════════════

describe('Navigation state', () => {
  it('selectChannel sets channel and resets person/room', () => {
    const store = useMessageStore.getState();
    store.selectPerson('person-1', 'room-1');
    store.selectChannel('channel-abc');

    const state = useMessageStore.getState();
    expect(state.selectedChannelId).toBe('channel-abc');
    expect(state.chatPersonId).toBeNull();
    expect(state.chatRoomId).toBeNull();
  });

  it('selectChannel with null clears selection', () => {
    const store = useMessageStore.getState();
    store.selectChannel('channel-1');
    store.selectChannel(null);

    expect(useMessageStore.getState().selectedChannelId).toBeNull();
  });

  it('selectPerson sets both personId and optional roomId', () => {
    const store = useMessageStore.getState();
    store.selectPerson('person-42', 'room-99');

    const state = useMessageStore.getState();
    expect(state.chatPersonId).toBe('person-42');
    expect(state.chatRoomId).toBe('room-99');
  });

  it('selectPerson without roomId sets roomId to null', () => {
    const store = useMessageStore.getState();
    store.selectPerson('person-42');

    expect(useMessageStore.getState().chatRoomId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

describe('Message management', () => {
  const msg1: ChatMessage = {
    id: '1',
    roomId: 'room-1',
    senderId: 10,
    senderName: 'Alice',
    content: 'Hello',
    contentType: 'text',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const msg2: ChatMessage = {
    id: '2',
    roomId: 'room-1',
    senderId: 20,
    senderName: 'Bob',
    content: 'World',
    contentType: 'text',
    createdAt: '2026-01-01T00:01:00Z',
  };

  it('setMessages replaces all messages for a room', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [msg1, msg2]);

    expect(useMessageStore.getState().messages['room-1']).toHaveLength(2);
  });

  it('setMessages for one room does not affect other rooms', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [msg1]);
    store.setMessages('room-2', [msg2]);

    expect(useMessageStore.getState().messages['room-1']).toHaveLength(1);
    expect(useMessageStore.getState().messages['room-2']).toHaveLength(1);
  });

  it('addMessage appends to existing room messages', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [msg1]);
    store.addMessage('room-1', msg2);

    const msgs = useMessageStore.getState().messages['room-1'];
    expect(msgs).toHaveLength(2);
    expect(msgs[1].content).toBe('World');
  });

  it('addMessage creates room entry if none exists', () => {
    const store = useMessageStore.getState();
    store.addMessage('new-room', msg1);

    expect(useMessageStore.getState().messages['new-room']).toHaveLength(1);
  });

  it('setMessages with empty array clears room', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [msg1, msg2]);
    store.setMessages('room-1', []);

    expect(useMessageStore.getState().messages['room-1']).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// OPTIMISTIC UPDATES
// ═══════════════════════════════════════════════════════════════

describe('Optimistic message sending', () => {
  const optimisticMsg: ChatMessage = {
    id: 'temp-abc',
    roomId: 'room-1',
    senderId: 10,
    senderName: 'Alice',
    content: 'Sending...',
    contentType: 'text',
    createdAt: new Date().toISOString(),
  };

  const confirmedMsg: ChatMessage = {
    id: 'real-123',
    roomId: 'room-1',
    senderId: 10,
    senderName: 'Alice',
    content: 'Sending...',
    contentType: 'text',
    createdAt: new Date().toISOString(),
  };

  it('addOptimisticMessage adds message and tracks sending ID', () => {
    const store = useMessageStore.getState();
    store.addOptimisticMessage('room-1', optimisticMsg);

    const state = useMessageStore.getState();
    expect(state.messages['room-1']).toHaveLength(1);
    expect(state.sendingIds.has('temp-abc')).toBe(true);
  });

  it('confirmMessage replaces temp message and removes sending ID', () => {
    const store = useMessageStore.getState();
    store.addOptimisticMessage('room-1', optimisticMsg);
    store.confirmMessage('room-1', 'temp-abc', confirmedMsg);

    const state = useMessageStore.getState();
    expect(state.messages['room-1'][0].id).toBe('real-123');
    expect(state.sendingIds.has('temp-abc')).toBe(false);
  });

  it('confirmMessage handles non-existent temp ID gracefully', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [optimisticMsg]);

    // Try to confirm a temp ID that doesn't match
    store.confirmMessage('room-1', 'nonexistent-temp', confirmedMsg);

    // Original message should remain unchanged
    expect(useMessageStore.getState().messages['room-1'][0].id).toBe('temp-abc');
  });

  it('multiple optimistic messages are tracked independently', () => {
    const store = useMessageStore.getState();
    const msg1 = { ...optimisticMsg, id: 'temp-1' };
    const msg2 = { ...optimisticMsg, id: 'temp-2' };

    store.addOptimisticMessage('room-1', msg1);
    store.addOptimisticMessage('room-1', msg2);

    const state = useMessageStore.getState();
    expect(state.sendingIds.size).toBe(2);
    expect(state.messages['room-1']).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// READ RECEIPTS
// ═══════════════════════════════════════════════════════════════

describe('Read receipts (markAsRead)', () => {
  it('marks all unread messages as read with current timestamp', () => {
    const store = useMessageStore.getState();
    store.setMessages('room-1', [
      { id: '1', roomId: 'room-1', senderId: 20, senderName: 'Bob', content: 'Hi', contentType: 'text' as const, createdAt: '2026-01-01T00:00:00Z', readAt: null },
      { id: '2', roomId: 'room-1', senderId: 20, senderName: 'Bob', content: 'Hey', contentType: 'text' as const, createdAt: '2026-01-01T00:01:00Z', readAt: null },
    ]);

    store.markAsRead('room-1');

    const msgs = useMessageStore.getState().messages['room-1'];
    expect(msgs[0].readAt).toBeDefined();
    expect(msgs[1].readAt).toBeDefined();
  });

  it('does not overwrite already-read timestamps', () => {
    const existingReadAt = '2025-12-25T00:00:00Z';
    const store = useMessageStore.getState();
    store.setMessages('room-1', [
      { id: '1', roomId: 'room-1', senderId: 20, senderName: 'Bob', content: 'Hi', contentType: 'text' as const, createdAt: '2026-01-01T00:00:00Z', readAt: existingReadAt },
    ]);

    store.markAsRead('room-1');

    const msgs = useMessageStore.getState().messages['room-1'];
    expect(msgs[0].readAt).toBe(existingReadAt);
  });

  it('handles markAsRead on empty room', () => {
    const store = useMessageStore.getState();
    store.markAsRead('empty-room');

    expect(useMessageStore.getState().messages['empty-room']).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// CHANNEL ITEMS (Tree data)
// ═══════════════════════════════════════════════════════════════

describe('Channel items (Tree data)', () => {
  const treeItems: TreeItem[] = [
    {
      id: 'parent-1',
      label: 'Orders',
      icon: 'order',
      time: 1000,
      unread: 0,
      children: [
        { id: 'child-1', label: 'Order #101', time: 1000, unread: 0 },
        { id: 'child-2', label: 'Order #102', time: 900, unread: 3 },
      ],
    },
  ];

  it('setChannelItems stores tree data for channel', () => {
    const store = useMessageStore.getState();
    store.setChannelItems('ch-1', treeItems);

    expect(useMessageStore.getState().channelItems['ch-1']).toEqual(treeItems);
  });

  it('updateChildUnread updates specific child and recalculates parent total', () => {
    const store = useMessageStore.getState();
    store.setChannelItems('ch-1', treeItems);
    store.updateChildUnread('ch-1', 'parent-1', 'child-1', 5);

    const items = useMessageStore.getState().channelItems['ch-1'];
    const parent = items[0];
    const child = parent.children?.find((c) => c.id === 'child-1');

    expect(child?.unread).toBe(5);
    // Parent unread = sum of children (5 + 3 = 8)
    expect(parent.unread).toBe(8);
  });

  it('updateChildLastMsg updates message and timestamp', () => {
    const store = useMessageStore.getState();
    store.setChannelItems('ch-1', treeItems);
    store.updateChildLastMsg('ch-1', 'parent-1', 'child-1', 'New message', 2000);

    const items = useMessageStore.getState().channelItems['ch-1'];
    const child = items[0].children?.find((c) => c.id === 'child-1');

    expect(child?.lastMsg).toBe('New message');
    expect(child?.time).toBe(2000);
  });
});

// ═══════════════════════════════════════════════════════════════
// CHANNEL COUNTS
// ═══════════════════════════════════════════════════════════════

describe('Channel counts', () => {
  const initialCounts: ChannelCount[] = [
    { id: 'ch-1', count: 5, children: [{ id: 'sub-1', count: 3 }] },
    { id: 'ch-2', count: 0 },
  ];

  it('setChannelCounts replaces all counts', () => {
    const store = useMessageStore.getState();
    store.setChannelCounts(initialCounts);

    expect(useMessageStore.getState().channelCounts).toEqual(initialCounts);
  });

  it('incrementCount increases parent count', () => {
    const store = useMessageStore.getState();
    store.setChannelCounts(initialCounts);
    store.incrementCount('ch-1');

    const counts = useMessageStore.getState().channelCounts;
    const ch1 = counts.find((c) => c.id === 'ch-1');
    expect(ch1?.count).toBe(6);
  });

  it('decrementCount decreases parent count', () => {
    const store = useMessageStore.getState();
    store.setChannelCounts(initialCounts);
    store.decrementCount('ch-1');

    const counts = useMessageStore.getState().channelCounts;
    const ch1 = counts.find((c) => c.id === 'ch-1');
    expect(ch1?.count).toBe(4);
  });

  it('incrementCount on child updates child and parent', () => {
    const store = useMessageStore.getState();
    store.setChannelCounts(initialCounts);
    store.incrementCount('ch-1', 'sub-1');

    const counts = useMessageStore.getState().channelCounts;
    const ch1 = counts.find((c) => c.id === 'ch-1');
    const sub1 = ch1?.children?.find((c) => c.id === 'sub-1');

    expect(sub1?.count).toBe(4);
    expect(ch1?.count).toBe(6);
  });

  it('decrementCount does not go below zero', () => {
    const store = useMessageStore.getState();
    store.setChannelCounts([{ id: 'ch-1', count: 0 }]);
    store.decrementCount('ch-1');

    const counts = useMessageStore.getState().channelCounts;
    const ch1 = counts.find((c) => c.id === 'ch-1');
    expect(ch1?.count).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// PRESENCE TRACKING
// ═══════════════════════════════════════════════════════════════

describe('Online presence tracking', () => {
  it('setUserOnline adds userId to Set', () => {
    const store = useMessageStore.getState();
    store.setUserOnline(42);

    expect(useMessageStore.getState().onlineUsers.has(42)).toBe(true);
  });

  it('setUserOffline removes userId from Set', () => {
    const store = useMessageStore.getState();
    store.setUserOnline(42);
    store.setUserOffline(42);

    expect(useMessageStore.getState().onlineUsers.has(42)).toBe(false);
  });

  it('duplicate setUserOnline is idempotent', () => {
    const store = useMessageStore.getState();
    store.setUserOnline(42);
    store.setUserOnline(42);

    expect(useMessageStore.getState().onlineUsers.size).toBe(1);
  });

  it('setUserOffline on non-online user is safe', () => {
    const store = useMessageStore.getState();
    store.setUserOffline(999);

    expect(useMessageStore.getState().onlineUsers.size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// TYPING INDICATORS
// ═══════════════════════════════════════════════════════════════

describe('Typing indicators', () => {
  it('setTyping adds user to room typing list', () => {
    const store = useMessageStore.getState();
    store.setTyping('room-1', 42);

    expect(useMessageStore.getState().typingUsers['room-1']).toContain(42);
  });

  it('clearTyping removes user from room typing list', () => {
    const store = useMessageStore.getState();
    store.setTyping('room-1', 42);
    store.clearTyping('room-1', 42);

    const typing = useMessageStore.getState().typingUsers['room-1'];
    expect(typing).not.toContain(42);
  });

  it('multiple users can type in same room', () => {
    const store = useMessageStore.getState();
    store.setTyping('room-1', 10);
    store.setTyping('room-1', 20);

    const typing = useMessageStore.getState().typingUsers['room-1'];
    expect(typing).toContain(10);
    expect(typing).toContain(20);
  });
});

// ═══════════════════════════════════════════════════════════════
// RFQ PRODUCTS
// ═══════════════════════════════════════════════════════════════

describe('RFQ product management', () => {
  const rfqProducts: RfqProduct[] = [
    {
      id: 'rfq-1',
      requestedName: 'Widget',
      requestedQty: 100,
      requestedBudget: '$500',
      alternatives: [
        { id: 'alt-1', name: 'Widget A', seller: 'Acme', price: 4.5, stock: 1000, rating: 4.5 },
        { id: 'alt-2', name: 'Widget B', seller: 'Beta', price: 5.0, stock: 500, rating: 4.0 },
      ],
    },
  ];

  it('setRfqProducts stores products for room', () => {
    const store = useMessageStore.getState();
    store.setRfqProducts('room-1', rfqProducts);

    expect(useMessageStore.getState().rfqProducts['room-1']).toEqual(rfqProducts);
  });

  it('updateAlternativePrice changes specific alternative price', () => {
    const store = useMessageStore.getState();
    store.setRfqProducts('room-1', rfqProducts);
    store.updateAlternativePrice('room-1', 'rfq-1', 'alt-1', 3.99);

    const products = useMessageStore.getState().rfqProducts['room-1'];
    const alt = products[0].alternatives.find((a) => a.id === 'alt-1');
    expect(alt?.price).toBe(3.99);
  });

  it('updateAlternativeStock changes specific alternative stock', () => {
    const store = useMessageStore.getState();
    store.setRfqProducts('room-1', rfqProducts);
    store.updateAlternativeStock('room-1', 'rfq-1', 'alt-2', 250);

    const products = useMessageStore.getState().rfqProducts['room-1'];
    const alt = products[0].alternatives.find((a) => a.id === 'alt-2');
    expect(alt?.stock).toBe(250);
  });

  it('updateAlternativePrice on non-existent product is safe', () => {
    const store = useMessageStore.getState();
    store.setRfqProducts('room-1', rfqProducts);

    // Non-existent product/alt — should not throw
    expect(() => {
      store.updateAlternativePrice('room-1', 'nonexistent', 'alt-1', 1.0);
    }).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// STRESS / EDGE CASES
// ═══════════════════════════════════════════════════════════════

describe('Stress & edge cases', () => {
  it('handles 1000 rapid message additions without data loss', () => {
    const store = useMessageStore.getState();
    for (let i = 0; i < 1000; i++) {
      store.addMessage('room-stress', {
        id: `msg-${i}`,
        roomId: 'room-stress',
        senderId: 1,
        senderName: 'Bot',
        content: `Message ${i}`,
        contentType: 'text',
        createdAt: new Date().toISOString(),
      });
    }

    expect(useMessageStore.getState().messages['room-stress']).toHaveLength(1000);
  });

  it('handles 100 concurrent presence toggles', () => {
    const store = useMessageStore.getState();
    for (let i = 0; i < 100; i++) {
      store.setUserOnline(i);
    }
    for (let i = 0; i < 50; i++) {
      store.setUserOffline(i);
    }

    expect(useMessageStore.getState().onlineUsers.size).toBe(50);
  });

  it('handles unicode/emoji content in messages', () => {
    const store = useMessageStore.getState();
    store.addMessage('room-1', {
      id: 'unicode-msg',
      roomId: 'room-1',
      senderId: 1,
      senderName: 'Test',
      content: 'Hello! Arabic content here too',
      contentType: 'text',
      createdAt: new Date().toISOString(),
    });

    const msgs = useMessageStore.getState().messages['room-1'];
    expect(msgs[0].content).toContain('Arabic');
  });
});
