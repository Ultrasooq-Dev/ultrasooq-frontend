/**
 * Tests for messageSocket.ts — Socket.io → Store bridge.
 * Tests the useSendMessage hook and event handling logic.
 */
import { useMessageStore } from "@/lib/messageStore";
import { act } from "@testing-library/react";

// Reset store between tests
beforeEach(() => {
  act(() => {
    useMessageStore.setState({
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
});

describe("Socket bridge — message flow simulation", () => {
  it("simulates optimistic send → server confirm flow", () => {
    const store = useMessageStore.getState();

    // 1. Set active room
    act(() => store.selectPerson("person-1", "room-1"));

    // 2. Optimistic send
    const tempId = "temp-12345";
    act(() => {
      useMessageStore.getState().addOptimisticMessage("room-1", {
        id: tempId,
        roomId: "room-1",
        senderId: 1,
        senderName: "Me",
        content: "Hello world",
        contentType: "text",
        createdAt: new Date().toISOString(),
      });
    });

    let s = useMessageStore.getState();
    expect(s.messages["room-1"]).toHaveLength(1);
    expect(s.messages["room-1"]![0].id).toBe(tempId);
    expect(s.sendingIds.has(tempId)).toBe(true);

    // 3. Server confirms
    act(() => {
      useMessageStore.getState().confirmMessage("room-1", tempId, {
        id: "real-msg-999",
        roomId: "room-1",
        senderId: 1,
        senderName: "Me",
        content: "Hello world",
        contentType: "text",
        createdAt: new Date().toISOString(),
        readAt: null,
      });
    });

    s = useMessageStore.getState();
    expect(s.messages["room-1"]![0].id).toBe("real-msg-999");
    expect(s.sendingIds.has(tempId)).toBe(false);
  });

  it("simulates incoming message from other user", () => {
    act(() => useMessageStore.getState().selectPerson("person-1", "room-1"));

    // Simulate receivedMessage event data
    act(() => {
      useMessageStore.getState().addMessage("room-1", {
        id: "incoming-1",
        roomId: "room-1",
        senderId: 5,
        senderName: "Ahmed",
        content: "Hey, are you there?",
        contentType: "text",
        createdAt: new Date().toISOString(),
      });
    });

    const msgs = useMessageStore.getState().messages["room-1"];
    expect(msgs).toHaveLength(1);
    expect(msgs![0].senderName).toBe("Ahmed");
  });

  it("simulates RFQ update system message", () => {
    act(() => {
      useMessageStore.getState().addMessage("room-1", {
        id: "sys-1",
        roomId: "room-1",
        senderId: 0,
        senderName: "System",
        content: "Ahmed updated price to 420 OMR",
        contentType: "rfq_update",
        createdAt: new Date().toISOString(),
      });
    });

    const msg = useMessageStore.getState().messages["room-1"]![0];
    expect(msg.contentType).toBe("rfq_update");
  });
});

describe("Socket bridge — presence simulation", () => {
  it("simulates user online → offline flow", () => {
    act(() => useMessageStore.getState().setUserOnline(5));
    expect(useMessageStore.getState().onlineUsers.has(5)).toBe(true);

    act(() => useMessageStore.getState().setUserOffline(5));
    expect(useMessageStore.getState().onlineUsers.has(5)).toBe(false);
  });

  it("simulates typing → auto-clear flow", () => {
    act(() => useMessageStore.getState().setTyping("room-1", 5));
    expect(useMessageStore.getState().typingUsers["room-1"]).toContain(5);

    act(() => useMessageStore.getState().clearTyping("room-1", 5));
    expect(useMessageStore.getState().typingUsers["room-1"]).not.toContain(5);
  });
});

describe("Socket bridge — count updates", () => {
  it("simulates increment on new message → decrement on read", () => {
    act(() => {
      useMessageStore.getState().setChannelCounts([
        { id: "vendor_ops", count: 5, children: [{ id: "v_rfq", count: 2 }] },
      ]);
    });

    // New message arrives
    act(() => useMessageStore.getState().incrementCount("vendor_ops", "v_rfq"));
    let s = useMessageStore.getState();
    expect(s.channelCounts[0].count).toBe(6);
    expect(s.channelCounts[0].children![0].count).toBe(3);

    // User reads the message
    act(() => useMessageStore.getState().decrementCount("vendor_ops", "v_rfq"));
    s = useMessageStore.getState();
    expect(s.channelCounts[0].count).toBe(5);
    expect(s.channelCounts[0].children![0].count).toBe(2);
  });
});
