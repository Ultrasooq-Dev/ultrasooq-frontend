import { useMessageStore } from "@/lib/messageStore";
import { act } from "@testing-library/react";

// Reset store between tests
beforeEach(() => {
  const store = useMessageStore.getState();
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

describe("messageStore — Navigation", () => {
  it("selectChannel sets channel and clears person/room", () => {
    const { selectChannel } = useMessageStore.getState();
    act(() => selectChannel("v_rfq"));

    const s = useMessageStore.getState();
    expect(s.selectedChannelId).toBe("v_rfq");
    expect(s.chatPersonId).toBeNull();
    expect(s.chatRoomId).toBeNull();
  });

  it("selectPerson sets person and optional room", () => {
    const { selectPerson } = useMessageStore.getState();
    act(() => selectPerson("person-1", "room-abc"));

    const s = useMessageStore.getState();
    expect(s.chatPersonId).toBe("person-1");
    expect(s.chatRoomId).toBe("room-abc");
  });

  it("selectChannel after selectPerson clears person", () => {
    const { selectPerson, selectChannel } = useMessageStore.getState();
    act(() => selectPerson("person-1", "room-abc"));
    act(() => selectChannel("c_product"));

    const s = useMessageStore.getState();
    expect(s.selectedChannelId).toBe("c_product");
    expect(s.chatPersonId).toBeNull();
  });
});

describe("messageStore — Messages", () => {
  const mockMsg = {
    id: "msg-1",
    roomId: "room-1",
    senderId: 5,
    senderName: "Ahmed",
    content: "Hello",
    contentType: "text" as const,
    createdAt: new Date().toISOString(),
  };

  it("setMessages replaces messages for a room", () => {
    act(() => useMessageStore.getState().setMessages("room-1", [mockMsg]));
    expect(useMessageStore.getState().messages["room-1"]).toHaveLength(1);
    expect(useMessageStore.getState().messages["room-1"]![0].content).toBe("Hello");
  });

  it("addMessage appends to existing room", () => {
    act(() => useMessageStore.getState().setMessages("room-1", [mockMsg]));
    const msg2 = { ...mockMsg, id: "msg-2", content: "World" };
    act(() => useMessageStore.getState().addMessage("room-1", msg2));
    expect(useMessageStore.getState().messages["room-1"]).toHaveLength(2);
  });

  it("addMessage creates room if doesn't exist", () => {
    act(() => useMessageStore.getState().addMessage("room-new", mockMsg));
    expect(useMessageStore.getState().messages["room-new"]).toHaveLength(1);
  });

  it("addOptimisticMessage adds to sendingIds", () => {
    const tempMsg = { ...mockMsg, id: "temp-123" };
    act(() => useMessageStore.getState().addOptimisticMessage("room-1", tempMsg));

    const s = useMessageStore.getState();
    expect(s.messages["room-1"]).toHaveLength(1);
    expect(s.sendingIds.has("temp-123")).toBe(true);
  });

  it("confirmMessage replaces temp message and clears sendingId", () => {
    const tempMsg = { ...mockMsg, id: "temp-123" };
    act(() => useMessageStore.getState().addOptimisticMessage("room-1", tempMsg));

    const realMsg = { ...mockMsg, id: "real-456" };
    act(() => useMessageStore.getState().confirmMessage("room-1", "temp-123", realMsg));

    const s = useMessageStore.getState();
    expect(s.messages["room-1"]![0].id).toBe("real-456");
    expect(s.sendingIds.has("temp-123")).toBe(false);
  });

  it("markAsRead sets readAt on all unread messages", () => {
    const unread = { ...mockMsg, readAt: null };
    act(() => useMessageStore.getState().setMessages("room-1", [unread]));
    act(() => useMessageStore.getState().markAsRead("room-1"));

    const msg = useMessageStore.getState().messages["room-1"]![0];
    expect(msg.readAt).toBeTruthy();
  });
});

describe("messageStore — Channel Counts", () => {
  it("setChannelCounts replaces all counts", () => {
    const counts = [
      { id: "support", count: 3, children: [{ id: "s_bot", count: 1 }, { id: "s_admin", count: 2 }] },
    ];
    act(() => useMessageStore.getState().setChannelCounts(counts));
    expect(useMessageStore.getState().channelCounts).toHaveLength(1);
    expect(useMessageStore.getState().channelCounts[0].count).toBe(3);
  });

  it("incrementCount increases parent and child count", () => {
    const counts = [
      { id: "support", count: 1, children: [{ id: "s_bot", count: 0 }, { id: "s_admin", count: 1 }] },
    ];
    act(() => useMessageStore.getState().setChannelCounts(counts));
    act(() => useMessageStore.getState().incrementCount("support", "s_bot"));

    const s = useMessageStore.getState();
    expect(s.channelCounts[0].count).toBe(2);
    expect(s.channelCounts[0].children![0].count).toBe(1);
  });

  it("decrementCount won't go below 0", () => {
    const counts = [{ id: "team", count: 0 }];
    act(() => useMessageStore.getState().setChannelCounts(counts));
    act(() => useMessageStore.getState().decrementCount("team"));

    expect(useMessageStore.getState().channelCounts[0].count).toBe(0);
  });
});

describe("messageStore — Channel Items", () => {
  it("setChannelItems stores tree for channel", () => {
    const items = [
      { id: "vq-1", label: "Sony", sublabel: "3 questions", icon: "product" as const, time: 30, unread: 2, children: [
        { id: "vq1-q1", label: "Ahmed", time: 5, unread: 1 },
      ]},
    ];
    act(() => useMessageStore.getState().setChannelItems("v_questions", items));
    expect(useMessageStore.getState().channelItems["v_questions"]).toHaveLength(1);
    expect(useMessageStore.getState().channelItems["v_questions"]![0].children).toHaveLength(1);
  });

  it("updateChildUnread changes unread count and recalculates parent", () => {
    const items = [
      { id: "vq-1", label: "Sony", icon: "product" as const, time: 30, unread: 2, children: [
        { id: "ch-1", label: "Ahmed", time: 5, unread: 1 },
        { id: "ch-2", label: "Sara", time: 10, unread: 1 },
      ]},
    ];
    act(() => useMessageStore.getState().setChannelItems("v_questions", items));
    act(() => useMessageStore.getState().updateChildUnread("v_questions", "vq-1", "ch-1", 0));

    const updated = useMessageStore.getState().channelItems["v_questions"]![0];
    expect(updated.children![0].unread).toBe(0);
    expect(updated.unread).toBe(1); // recalculated: 0 + 1
  });

  it("updateChildLastMsg updates message and time", () => {
    const items = [
      { id: "p-1", label: "Product", icon: "product" as const, time: 60, unread: 0, children: [
        { id: "ch-1", label: "Ahmed", lastMsg: "old msg", time: 60, unread: 0 },
      ]},
    ];
    act(() => useMessageStore.getState().setChannelItems("v_product", items));
    act(() => useMessageStore.getState().updateChildLastMsg("v_product", "p-1", "ch-1", "new msg", 1));

    const ch = useMessageStore.getState().channelItems["v_product"]![0].children![0];
    expect(ch.lastMsg).toBe("new msg");
    expect(ch.time).toBe(1);
  });
});

describe("messageStore — RFQ Products", () => {
  const mockProduct = {
    id: "rfq-p1",
    requestedName: "iPad Pro",
    requestedQty: 10,
    requestedBudget: "400-500 OMR",
    alternatives: [
      { id: "alt-1", name: "iPad Pro 256GB", seller: "Store", price: 420, stock: 45, rating: 4.8 },
    ],
  };

  it("setRfqProducts stores products for room", () => {
    act(() => useMessageStore.getState().setRfqProducts("room-1", [mockProduct]));
    expect(useMessageStore.getState().rfqProducts["room-1"]).toHaveLength(1);
  });

  it("updateAlternativePrice changes price", () => {
    act(() => useMessageStore.getState().setRfqProducts("room-1", [mockProduct]));
    act(() => useMessageStore.getState().updateAlternativePrice("room-1", "rfq-p1", "alt-1", 450));

    const alt = useMessageStore.getState().rfqProducts["room-1"]![0].alternatives[0];
    expect(alt.price).toBe(450);
  });

  it("updateAlternativeStock changes stock", () => {
    act(() => useMessageStore.getState().setRfqProducts("room-1", [mockProduct]));
    act(() => useMessageStore.getState().updateAlternativeStock("room-1", "rfq-p1", "alt-1", 30));

    const alt = useMessageStore.getState().rfqProducts["room-1"]![0].alternatives[0];
    expect(alt.stock).toBe(30);
  });
});

describe("messageStore — Presence", () => {
  it("setUserOnline adds to onlineUsers", () => {
    act(() => useMessageStore.getState().setUserOnline(5));
    expect(useMessageStore.getState().onlineUsers.has(5)).toBe(true);
  });

  it("setUserOffline removes from onlineUsers", () => {
    act(() => useMessageStore.getState().setUserOnline(5));
    act(() => useMessageStore.getState().setUserOffline(5));
    expect(useMessageStore.getState().onlineUsers.has(5)).toBe(false);
  });

  it("setTyping adds user to room typing list", () => {
    act(() => useMessageStore.getState().setTyping("room-1", 5));
    expect(useMessageStore.getState().typingUsers["room-1"]).toContain(5);
  });

  it("clearTyping removes user from room typing list", () => {
    act(() => useMessageStore.getState().setTyping("room-1", 5));
    act(() => useMessageStore.getState().clearTyping("room-1", 5));
    expect(useMessageStore.getState().typingUsers["room-1"]).not.toContain(5);
  });

  it("setTyping doesn't duplicate same user", () => {
    act(() => useMessageStore.getState().setTyping("room-1", 5));
    act(() => useMessageStore.getState().setTyping("room-1", 5));
    expect(useMessageStore.getState().typingUsers["room-1"]!.filter((id) => id === 5)).toHaveLength(1);
  });
});
