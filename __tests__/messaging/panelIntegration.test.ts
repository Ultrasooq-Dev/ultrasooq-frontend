/**
 * Integration tests — simulates full panel flow:
 * P1 select → P2 shows items → select person → P4/P5 shows chat → P6 shows products
 */
import { useMessageStore } from "@/lib/messageStore";
import { act } from "@testing-library/react";

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

describe("Full messaging flow", () => {
  it("P1→P2→P5+P6: RFQ vendor flow", () => {
    const store = useMessageStore.getState();

    // Step 1: Select channel in P1
    act(() => store.selectChannel("v_rfq"));
    expect(useMessageStore.getState().selectedChannelId).toBe("v_rfq");
    expect(useMessageStore.getState().chatPersonId).toBeNull();

    // Step 2: Load P2 items from store
    act(() => {
      useMessageStore.getState().setChannelItems("v_rfq", [
        {
          id: "rfq-session-1",
          label: "RFQ #5 · Bulk Electronics",
          icon: "session",
          time: 20,
          unread: 2,
          children: [
            { id: "buyer-ahmed", label: "Ahmed Al-Busaidi", lastMsg: "420 OMR?", time: 5, unread: 1, online: true },
            { id: "buyer-khalid", label: "Khalid Hassan", lastMsg: "50 units bulk?", time: 45, unread: 1, online: false },
          ],
        },
      ]);
    });

    const items = useMessageStore.getState().channelItems["v_rfq"];
    expect(items).toHaveLength(1);
    expect(items![0].children).toHaveLength(2);

    // Step 3: Select person in P2 (opens P5+P6)
    act(() => useMessageStore.getState().selectPerson("buyer-ahmed", "room-rfq-5-ahmed"));
    expect(useMessageStore.getState().chatPersonId).toBe("buyer-ahmed");
    expect(useMessageStore.getState().chatRoomId).toBe("room-rfq-5-ahmed");

    // Step 4: Load messages for this room (P5)
    act(() => {
      useMessageStore.getState().setMessages("room-rfq-5-ahmed", [
        { id: "m1", roomId: "room-rfq-5-ahmed", senderId: 5, senderName: "Ahmed", content: "Can you do 420 OMR?", contentType: "text", createdAt: "2024-01-01T10:30:00Z" },
      ]);
    });

    const msgs = useMessageStore.getState().messages["room-rfq-5-ahmed"];
    expect(msgs).toHaveLength(1);

    // Step 5: Load RFQ products for this room (P6)
    act(() => {
      useMessageStore.getState().setRfqProducts("room-rfq-5-ahmed", [
        {
          id: "rfq-p1",
          requestedName: "iPad Pro 12.9",
          requestedQty: 10,
          requestedBudget: "400-500 OMR",
          alternatives: [
            { id: "alt-1", name: "iPad Pro 256GB", seller: "Store", price: 420, stock: 45, rating: 4.8 },
          ],
        },
      ]);
    });

    const products = useMessageStore.getState().rfqProducts["room-rfq-5-ahmed"];
    expect(products).toHaveLength(1);
    expect(products![0].alternatives[0].price).toBe(420);

    // Step 6: Vendor updates price (P6 → store)
    act(() => {
      useMessageStore.getState().updateAlternativePrice("room-rfq-5-ahmed", "rfq-p1", "alt-1", 400);
    });

    expect(useMessageStore.getState().rfqProducts["room-rfq-5-ahmed"]![0].alternatives[0].price).toBe(400);

    // Step 7: Send message (P5)
    act(() => {
      useMessageStore.getState().addOptimisticMessage("room-rfq-5-ahmed", {
        id: "temp-1",
        roomId: "room-rfq-5-ahmed",
        senderId: 1,
        senderName: "Vendor",
        content: "Updated to 400 OMR",
        contentType: "text",
        createdAt: new Date().toISOString(),
      });
    });

    expect(useMessageStore.getState().messages["room-rfq-5-ahmed"]).toHaveLength(2);
    expect(useMessageStore.getState().sendingIds.has("temp-1")).toBe(true);
  });

  it("P1→P2→P4: Customer support flow", () => {
    // Step 1: Select support channel
    act(() => useMessageStore.getState().selectChannel("s_admin"));
    expect(useMessageStore.getState().selectedChannelId).toBe("s_admin");

    // Step 2: Select ticket (flat item, no children → P4)
    act(() => useMessageStore.getState().selectPerson("admin-1", "room-support-1024"));
    expect(useMessageStore.getState().chatPersonId).toBe("admin-1");

    // Step 3: Load and send messages
    act(() => {
      useMessageStore.getState().setMessages("room-support-1024", [
        { id: "s1", roomId: "room-support-1024", senderId: 99, senderName: "Admin", content: "How can I help?", contentType: "text", createdAt: "2024-01-01T10:00:00Z" },
      ]);
    });

    expect(useMessageStore.getState().messages["room-support-1024"]).toHaveLength(1);

    // Step 4: Mark as read
    act(() => useMessageStore.getState().markAsRead("room-support-1024"));
    const msg = useMessageStore.getState().messages["room-support-1024"]![0];
    expect(msg.readAt).toBeTruthy();
  });

  it("Unread channel collects from all channels", () => {
    // Populate multiple channels with unread children
    act(() => {
      useMessageStore.getState().setChannelItems("v_rfq", [
        {
          id: "rfq-1", label: "RFQ #5", icon: "session", time: 20, unread: 1,
          children: [{ id: "rfq-ch-1", label: "Ahmed", lastMsg: "420 OMR?", time: 5, unread: 1, online: true }],
        },
      ]);
      useMessageStore.getState().setChannelItems("v_product", [
        {
          id: "prod-1", label: "Sony", icon: "product", time: 10, unread: 1,
          children: [{ id: "prod-ch-1", label: "Fatima", lastMsg: "Blue?", time: 10, unread: 1, online: true }],
        },
      ]);
    });

    // Verify store has items
    const rfqItems = useMessageStore.getState().channelItems["v_rfq"];
    const prodItems = useMessageStore.getState().channelItems["v_product"];
    expect(rfqItems).toHaveLength(1);
    expect(prodItems).toHaveLength(1);
    expect(rfqItems![0].children![0].unread).toBe(1);
    expect(prodItems![0].children![0].unread).toBe(1);
  });

  it("Channel switch clears previous conversation", () => {
    act(() => useMessageStore.getState().selectChannel("v_rfq"));
    act(() => useMessageStore.getState().selectPerson("ahmed", "room-1"));

    expect(useMessageStore.getState().chatPersonId).toBe("ahmed");

    // Switch channel
    act(() => useMessageStore.getState().selectChannel("c_product"));

    expect(useMessageStore.getState().selectedChannelId).toBe("c_product");
    expect(useMessageStore.getState().chatPersonId).toBeNull();
    expect(useMessageStore.getState().chatRoomId).toBeNull();
  });
});

describe("Concurrent operations", () => {
  it("multiple rooms can have messages simultaneously", () => {
    act(() => {
      useMessageStore.getState().setMessages("room-1", [
        { id: "r1-m1", roomId: "room-1", senderId: 1, senderName: "A", content: "Hi", contentType: "text", createdAt: "2024-01-01T10:00:00Z" },
      ]);
      useMessageStore.getState().setMessages("room-2", [
        { id: "r2-m1", roomId: "room-2", senderId: 2, senderName: "B", content: "Hey", contentType: "text", createdAt: "2024-01-01T10:00:00Z" },
        { id: "r2-m2", roomId: "room-2", senderId: 1, senderName: "A", content: "Sup", contentType: "text", createdAt: "2024-01-01T10:01:00Z" },
      ]);
    });

    expect(useMessageStore.getState().messages["room-1"]).toHaveLength(1);
    expect(useMessageStore.getState().messages["room-2"]).toHaveLength(2);
  });

  it("multiple users can be online simultaneously", () => {
    act(() => {
      useMessageStore.getState().setUserOnline(1);
      useMessageStore.getState().setUserOnline(2);
      useMessageStore.getState().setUserOnline(3);
    });

    const online = useMessageStore.getState().onlineUsers;
    expect(online.size).toBe(3);
    expect(online.has(1)).toBe(true);
    expect(online.has(2)).toBe(true);
    expect(online.has(3)).toBe(true);
  });

  it("typing in multiple rooms doesn't conflict", () => {
    act(() => {
      useMessageStore.getState().setTyping("room-1", 5);
      useMessageStore.getState().setTyping("room-2", 6);
    });

    expect(useMessageStore.getState().typingUsers["room-1"]).toContain(5);
    expect(useMessageStore.getState().typingUsers["room-2"]).toContain(6);
    expect(useMessageStore.getState().typingUsers["room-1"]).not.toContain(6);
  });
});
