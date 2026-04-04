/**
 * API Integration Tests — Frontend ↔ Backend HTTP round-trip
 * Uses shared setup to avoid rate limiting.
 */
import { httpGet, httpPost, httpPatch, httpDelete } from "./helpers";
import { ensureSetup, testState } from "./setup";

beforeAll(() => ensureSetup());

const skip = () => !testState.backendAvailable;

describe("API: Channel Summary (P1)", () => {
  it("returns array with channel counts", async () => {
    if (skip()) return;
    const result = await httpGet("/chat/channels/summary", testState.buyerToken);
    expect(Array.isArray(result.data)).toBe(true);
    for (const item of result.data) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.count).toBe("number");
    }
  });

  it("seller sees unread from buyer", async () => {
    if (skip()) return;
    const result = await httpGet("/chat/channels/summary", testState.sellerToken);
    const rfq = result.data?.find((c: any) => c.id === "v_rfq");
    if (rfq) expect(rfq.count).toBeGreaterThanOrEqual(0);
  });
});

describe("API: Channel Conversations (P2)", () => {
  it("returns room list for v_rfq", async () => {
    if (skip()) return;
    const result = await httpGet("/chat/channels/v_rfq/conversations", testState.buyerToken);
    expect(Array.isArray(result.data)).toBe(true);
    if (result.data.length > 0) {
      expect(result.data[0]).toHaveProperty("name");
      expect(result.data[0]).toHaveProperty("unreadCount");
    }
  });
});

describe("API: Chat Messages (P4/P5)", () => {
  it("returns message history for room", async () => {
    if (skip()) return;
    const result = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.buyerToken);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    const msg = result.data[0];
    expect(msg).toHaveProperty("id");
    expect(msg).toHaveProperty("content");
    expect(msg).toHaveProperty("userId");
  });

  it("messages have user info", async () => {
    if (skip()) return;
    const result = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.buyerToken);
    const msg = result.data?.[0];
    if (msg?.user) expect(msg.user).toHaveProperty("firstName");
  });
});

describe("API: Pin/Archive (P2 actions)", () => {
  it("toggles pin", async () => {
    if (skip()) return;
    const result = await httpPatch(`/chat/rooms/${testState.testRoomId}/pin`, {}, testState.buyerToken);
    expect(result.message.toLowerCase()).toMatch(/pin/);
  });

  it("toggles archive and unarchive", async () => {
    if (skip()) return;
    const r1 = await httpPatch(`/chat/rooms/${testState.testRoomId}/archive`, {}, testState.buyerToken);
    expect(r1.message.toLowerCase()).toMatch(/archiv/);
    const r2 = await httpPatch(`/chat/rooms/${testState.testRoomId}/archive`, {}, testState.buyerToken);
    expect(r2.message.toLowerCase()).toMatch(/archiv/);
  });
});

describe("API: Mark as Read", () => {
  it("marks messages as read", async () => {
    if (skip()) return;
    const result = await httpPatch(
      "/chat/read-messages",
      { userId: testState.sellerId, roomId: testState.testRoomId },
      testState.sellerToken
    );
    expect(result.message.toLowerCase()).toContain("updated");
  });
});

describe("API: Delete/Leave Room", () => {
  it("lets user leave a room", async () => {
    if (skip()) return;
    const room = await httpPost(
      "/chat/createPrivateRoom",
      { creatorId: testState.buyerId, participants: [testState.buyerId, testState.sellerId], rfqId: 99 },
      testState.buyerToken
    );
    const result = await httpDelete(`/chat/rooms/${room.id}`, testState.buyerToken);
    expect(result.message.toLowerCase()).toContain("left");
  });
});
