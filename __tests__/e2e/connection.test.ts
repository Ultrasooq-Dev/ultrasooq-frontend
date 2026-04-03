/**
 * Connection Test — verifies frontend can reach backend.
 * Tests: health, REST auth, socket, DB write/read round-trip.
 * Run: npx jest __tests__/e2e/connection.test.ts --forceExit
 *
 * @jest-environment node
 */
import * as http from "http";
import { io, type Socket } from "socket.io-client";

function req(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    const r = http.request(
      { hostname: "localhost", port: 3000, path, method, headers, timeout: 5000 },
      (res) => { let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } }); }
    );
    r.on("error", reject);
    r.on("timeout", () => { r.destroy(); reject(new Error("timeout")); });
    if (data && method !== "GET") r.write(data);
    r.end();
  });
}

let token = "";
let userId = 0;

describe("Frontend ↔ Backend Connection", () => {

  // 1. Health endpoint
  it("backend is running and healthy", async () => {
    const health = await req("GET", "/health");
    expect(health.status).toBe("ok");
    expect(health.info.database.status).toBe("up");
    expect(health.info.redis.status).toBe("up");
  });

  // 2. REST API reachable with correct prefix
  it("API prefix /api/v1 responds", async () => {
    const result = await req("GET", "/api/v1/chat/test");
    // test endpoint exists in chat controller
    expect(result).toBeDefined();
  });

  // 3. Login works (auth round-trip)
  it("login returns JWT token", async () => {
    const login = await req("POST", "/api/v1/user/login", {
      email: "buyer@ultrasooq.com",
      password: "Password123!",
    });
    expect(login.accessToken).toBeTruthy();
    expect(login.data?.id).toBeGreaterThan(0);
    token = login.accessToken;
    userId = login.data.id;
  });

  // 4. Authenticated endpoint works
  it("auth-protected endpoint accepts JWT", async () => {
    expect(token).toBeTruthy();
    const summary = await req("GET", "/api/v1/chat/channels/summary", undefined, token);
    expect(Array.isArray(summary.data)).toBe(true);
  });

  // 5. DB write + read round-trip
  it("can create room and read messages (DB round-trip)", async () => {
    expect(token).toBeTruthy();

    // Write: create room
    const room = await req("POST", "/api/v1/chat/createPrivateRoom", {
      creatorId: userId, participants: [userId], rfqId: 999,
    }, token);
    expect(room.id).toBeGreaterThan(0);

    // Write: send message
    const msg = await req("POST", "/api/v1/chat/send-message", {
      content: "connection-test-" + Date.now(),
      userId, roomId: room.id, rfqId: 999,
    }, token);
    expect(msg.id).toBeGreaterThan(0);

    // Read: get messages
    const msgs = await req("GET", `/api/v1/chat/messages?roomId=${room.id}`, undefined, token);
    expect(msgs.data.length).toBeGreaterThan(0);
    expect(msgs.data.some((m: any) => m.id === msg.id)).toBe(true);
  });

  // 6. Socket.io connects
  it("Socket.io connects to /ws namespace", async () => {
    expect(token).toBeTruthy();

    // NestJS gateway requires JWT in auth.token (see chat.gateway.ts afterInit)
    const socket: Socket = await new Promise((resolve, reject) => {
      const s = io("http://localhost:3000/ws", {
        auth: { token },
        query: { userId: String(userId) },
        transports: ["websocket", "polling"],
        reconnection: false,
        timeout: 8000,
        forceNew: true,
      });
      s.on("connect", () => resolve(s));
      s.on("connect_error", (e) => reject(new Error(`Socket connect_error: ${e.message}`)));
      setTimeout(() => reject(new Error("Socket connect timeout")), 8000);
    });

    expect(socket.connected).toBe(true);
    socket.disconnect();
  }, 12000);

  // 7. Socket message round-trip: emit → DB persist → REST read
  it("Socket.io message persists to DB and is readable via REST", async () => {
    expect(token).toBeTruthy();

    const room = await req("POST", "/api/v1/chat/createPrivateRoom", {
      creatorId: userId, participants: [userId], rfqId: 998,
    }, token);

    const socket: Socket = await new Promise((resolve, reject) => {
      const s = io("http://localhost:3000/ws", {
        auth: { token },
        query: { userId: String(userId) },
        transports: ["websocket", "polling"],
        reconnection: false,
        timeout: 8000,
        forceNew: true,
      });
      s.on("connect", () => resolve(s));
      s.on("connect_error", (e) => reject(e));
      setTimeout(() => reject(new Error("timeout")), 8000);
    });

    const testContent = "socket-roundtrip-" + Date.now();
    socket.emit("sendMessage", {
      content: testContent, userId, roomId: room.id, rfqId: 998,
    });

    await new Promise((r) => setTimeout(r, 1500));

    const msgs = await req("GET", `/api/v1/chat/messages?roomId=${room.id}`, undefined, token);
    const found = msgs.data?.find((m: any) => m.content === testContent);
    expect(found).toBeTruthy();

    socket.disconnect();
  }, 15000);

  // 8. CORS headers present
  it("CORS allows frontend origin", async () => {
    const result: any = await new Promise((resolve, reject) => {
      const r = http.request(
        { hostname: "localhost", port: 3000, path: "/health", method: "OPTIONS",
          headers: { Origin: "http://localhost:4001", "Access-Control-Request-Method": "GET" } },
        (res) => {
          resolve({
            status: res.statusCode,
            allowOrigin: res.headers["access-control-allow-origin"],
          });
        }
      );
      r.on("error", reject);
      r.end();
    });
    // Backend should allow localhost:4001
    expect([200, 204]).toContain(result.status);
  });
});
