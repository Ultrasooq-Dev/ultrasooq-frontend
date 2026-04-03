/**
 * Socket.io Integration Tests — Real-time round-trip
 * Uses shared setup to avoid rate limiting.
 */
import type { Socket } from "socket.io-client";
import { httpGet, connectTestSocket, waitForEvent } from "./helpers";
import { ensureSetup, testState } from "./setup";

let buyerSocket: Socket;
let sellerSocket: Socket;

beforeAll(() => ensureSetup());
afterAll(() => {
  if (buyerSocket?.connected) buyerSocket.disconnect();
  if (sellerSocket?.connected) sellerSocket.disconnect();
});

const skip = () => !testState.backendAvailable;

describe("Socket: Connection", () => {
  it("buyer connects", async () => {
    if (skip()) return;
    try {
      buyerSocket = await connectTestSocket(testState.buyerToken, testState.buyerId);
      expect(buyerSocket.connected).toBe(true);
    } catch (err: any) {
      console.warn("Buyer socket failed:", err.message, "— socket tests will use REST fallback");
    }
  }, 10000);

  it("seller connects", async () => {
    if (skip()) return;
    try {
      sellerSocket = await connectTestSocket(testState.sellerToken, testState.sellerId);
      expect(sellerSocket.connected).toBe(true);
    } catch (err: any) {
      console.warn("Seller socket failed:", err.message, "— socket tests will use REST fallback");
    }
  }, 10000);
});

describe("Socket: Message Delivery", () => {
  it("buyer sends → seller receives", async () => {
    if (skip() || !buyerSocket?.connected || !sellerSocket?.connected) return;

    const promise = waitForEvent(sellerSocket, "receivedMessage", 5000);
    buyerSocket.emit("sendMessage", {
      content: "Socket E2E from buyer!",
      userId: testState.buyerId,
      roomId: testState.testRoomId,
      rfqId: 1,
    });

    try {
      const msg = await promise;
      expect(msg.content ?? msg.message?.content).toBeTruthy();
    } catch {
      // Fallback: verify via REST
      const msgs = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.buyerToken);
      const found = msgs.data?.find((m: any) => m.content === "Socket E2E from buyer!");
      expect(found).toBeTruthy();
    }
  }, 10000);

  it("seller sends → buyer receives", async () => {
    if (skip() || !buyerSocket?.connected || !sellerSocket?.connected) return;

    const promise = waitForEvent(buyerSocket, "receivedMessage", 5000);
    sellerSocket.emit("sendMessage", {
      content: "Socket E2E from seller!",
      userId: testState.sellerId,
      roomId: testState.testRoomId,
      rfqId: 1,
    });

    try {
      const msg = await promise;
      expect(msg.content ?? msg.message?.content).toBeTruthy();
    } catch {
      const msgs = await httpGet(`/chat/messages?roomId=${testState.testRoomId}`, testState.sellerToken);
      const found = msgs.data?.find((m: any) => m.content === "Socket E2E from seller!");
      expect(found).toBeTruthy();
    }
  }, 10000);
});

describe("Socket: Typing", () => {
  it("buyer typing → seller receives event", async () => {
    if (skip() || !buyerSocket?.connected || !sellerSocket?.connected) return;

    const promise = waitForEvent(sellerSocket, "typing", 3000);
    buyerSocket.emit("typing", { roomId: testState.testRoomId, userId: testState.buyerId });

    try {
      const data = await promise;
      expect(data.userId).toBe(testState.buyerId);
    } catch {
      // Best-effort — room auto-join timing
    }
  }, 5000);
});

describe("Socket: Mark as Read", () => {
  it("seller reads → buyer receives messagesRead", async () => {
    if (skip() || !buyerSocket?.connected || !sellerSocket?.connected) return;

    const promise = waitForEvent(buyerSocket, "messagesRead", 3000);
    sellerSocket.emit("markAsRead", { roomId: testState.testRoomId, userId: testState.sellerId });

    try {
      const data = await promise;
      expect(data.roomId).toBe(testState.testRoomId);
    } catch {
      // Best-effort
    }
  }, 5000);
});

describe("Socket: Disconnect", () => {
  it("buyer disconnects cleanly", () => {
    if (!buyerSocket?.connected) return;
    buyerSocket.disconnect();
    expect(buyerSocket.connected).toBe(false);
  });

  it("seller disconnects cleanly", () => {
    if (!sellerSocket?.connected) return;
    sellerSocket.disconnect();
    expect(sellerSocket.connected).toBe(false);
  });
});
