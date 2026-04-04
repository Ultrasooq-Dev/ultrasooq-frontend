/**
 * Shared test helpers for frontend ↔ backend integration tests.
 * These helpers hit the REAL backend at localhost:3000.
 * Uses node:http instead of fetch (not available in jsdom).
 */
import * as http from "http";
import { io, type Socket } from "socket.io-client";
import { useMessageStore } from "@/lib/messageStore";
import { act } from "@testing-library/react";

const API_BASE = "http://localhost:3000/api/v1";
const WS_URL = "http://localhost:3000/ws";

// ─── HTTP via node:http ──────────────────────────

function nodeRequest(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const data = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));

    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); }
        });
      }
    );
    req.on("error", reject);
    if (data && method !== "GET") req.write(data);
    req.end();
  });
}

export const httpPost = (path: string, body: any, token?: string) => nodeRequest("POST", path, body, token);
export const httpGet = (path: string, token: string) => nodeRequest("GET", path, undefined, token);
export const httpPatch = (path: string, body: any, token: string) => nodeRequest("PATCH", path, body, token);
export const httpDelete = (path: string, token: string) => nodeRequest("DELETE", path, undefined, token);

// ─── Auth ────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; userId: number }> {
  const data = await httpPost("/user/login", { email, password });
  if (!data.accessToken) {
    throw new Error(`Login failed for ${email}: ${data.message || JSON.stringify(data)}`);
  }
  return { token: data.accessToken, userId: data.data?.id ?? 0 };
}

// ─── Socket.io ───────────────────────────────────

export function connectTestSocket(token: string, userId: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(WS_URL, {
      auth: { token },
      query: { userId: String(userId) },
      transports: ["websocket"],
      reconnection: false,
      timeout: 5000,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) =>
      reject(new Error(`Socket connect failed: ${err.message}`))
    );
    setTimeout(() => reject(new Error("Socket connect timeout")), 5000);
  });
}

export function waitForEvent(
  socket: Socket,
  event: string,
  timeoutMs = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}" (${timeoutMs}ms)`)),
      timeoutMs
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// ─── Zustand Store ───────────────────────────────

export function resetStore() {
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
}

// ─── Backend Health Check ────────────────────────

export function checkBackendHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "localhost", port: 3000, path: "/health", method: "GET", timeout: 3000 },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try { resolve(JSON.parse(d).status === "ok"); } catch { resolve(false); }
        });
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.end();
  });
}
