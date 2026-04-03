/**
 * Store Integration Tests — API response → Zustand store → correct shapes
 * Uses shared setup to avoid rate limiting.
 */
import { useMessageStore, type ChatMessage, type TreeItem } from "@/lib/messageStore";
import { httpGet, resetStore } from "./helpers";
import { ensureSetup, testState } from "./setup";
import { act } from "@testing-library/react";

beforeAll(() => ensureSetup());
beforeEach(() => resetStore());

const skip = () => !testState.backendAvailable;

describe("Store: Channel Summary → channelCounts", () => {
  it("pushes API summary into store", async () => {
    if (skip()) return;
    const api = await httpGet("/chat/channels/summary", testState.buyerToken);
    act(() => useMessageStore.getState().setChannelCounts(api.data));

    const { channelCounts } = useMessageStore.getState();
    expect(channelCounts.length).toBe(api.data.length);
    for (const cc of channelCounts) {
      expect(typeof cc.id).toBe("string");
      expect(typeof cc.count).toBe("number");
    }
  });
});

describe("Store: Conversations → channelItems", () => {
  it("maps API rooms to TreeItem[] in store", async () => {
    if (skip()) return;
    const api = await httpGet("/chat/channels/v_rfq/conversations", testState.buyerToken);
    if (!api.data?.length) return;

    const items: TreeItem[] = api.data.map((r: any) => ({
      id: String(r.id),
      label: r.name || `Room #${r.id}`,
      sublabel: r.lastMessage?.content ?? "",
      icon: "session" as const,
      time: r.lastMessageAt ? Math.floor((Date.now() - new Date(r.lastMessageAt).getTime()) / 60000) : 999,
      unread: r.unreadCount ?? 0,
      online: false,
    }));

    act(() => useMessageStore.getState().setChannelItems("v_rfq", items));

    const stored = useMessageStore.getState().channelItems["v_rfq"]!;
    expect(stored.length).toBe(items.length);
    for (const item of stored) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.unread).toBe("number");
    }
  });
});

describe("Store: Messages → messages[roomId]", () => {
  it("maps API messages to ChatMessage[] in store", async () => {
    if (skip()) return;
    const api = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.buyerToken);
    if (!api.data?.length) return;

    const messages: ChatMessage[] = api.data.map((m: any) => ({
      id: String(m.id),
      roomId: String(m.roomId),
      senderId: m.userId ?? m.user?.id ?? 0,
      senderName: m.user?.firstName ?? "User",
      content: m.content ?? "",
      contentType: m.contentType ?? "text",
      createdAt: m.createdAt ?? new Date().toISOString(),
      readAt: m.status === "READ" ? m.updatedAt : null,
    }));

    const key = String(testState.testRoomId);
    act(() => useMessageStore.getState().setMessages(key, messages));

    const stored = useMessageStore.getState().messages[key]!;
    expect(stored.length).toBe(messages.length);
    for (const msg of stored) {
      expect(typeof msg.senderId).toBe("number");
      expect(typeof msg.content).toBe("string");
    }
  });

  it("identifies own vs other messages", async () => {
    if (skip()) return;
    const api = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.buyerToken);
    const own = (api.data ?? []).filter((m: any) => (m.userId ?? m.user?.id) === testState.buyerId);
    expect(own.length).toBeGreaterThan(0);
  });
});

describe("Store: Count increment/decrement flow", () => {
  it("simulates new message → increment → read → decrement", async () => {
    if (skip()) return;
    const api = await httpGet("/chat/channels/summary", testState.buyerToken);
    act(() => useMessageStore.getState().setChannelCounts(api.data ?? []));

    const rfqBefore = useMessageStore.getState().channelCounts.find((c) => c.id === "v_rfq");
    const before = rfqBefore?.count ?? 0;

    act(() => useMessageStore.getState().incrementCount("v_rfq"));
    expect(useMessageStore.getState().channelCounts.find((c) => c.id === "v_rfq")?.count).toBe(before + 1);

    act(() => useMessageStore.getState().decrementCount("v_rfq"));
    expect(useMessageStore.getState().channelCounts.find((c) => c.id === "v_rfq")?.count).toBe(before);
  });
});
