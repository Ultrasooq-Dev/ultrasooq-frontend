/**
 * Jest globalSetup — runs ONCE before all test files.
 * Logs in users and stores tokens to a temp file.
 */
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const API = "http://localhost:3000/api/v1";
const STATE_FILE = path.join(__dirname, ".e2e-state.json");

function req(method: string, reqPath: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve) => {
    const url = new URL(`${API}${reqPath}`);
    const data = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    const r = http.request(
      { hostname: url.hostname, port: Number(url.port), path: url.pathname + url.search, method, headers, timeout: 5000 },
      (res) => { let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } }); }
    );
    r.on("error", () => resolve({}));
    r.on("timeout", () => { r.destroy(); resolve({}); });
    if (data && method !== "GET") r.write(data);
    r.end();
  });
}

module.exports = async function globalSetup() {
  // Health check — use direct path, not through API prefix
  const health: any = await new Promise((resolve) => {
    const r = http.request({ hostname: "localhost", port: 3000, path: "/health", method: "GET", timeout: 3000 }, (res) => {
      let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    r.on("error", () => resolve({}));
    r.on("timeout", () => { r.destroy(); resolve({}); });
    r.end();
  });
  if (health?.status !== "ok") {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ backendAvailable: false }));
    console.log("⚠️  Backend not running — E2E tests will skip");
    return;
  }

  // Login buyer
  const buyer = await req("POST", "/user/login", { email: "buyer@ultrasooq.com", password: "Password123!" });
  if (!buyer.accessToken) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ backendAvailable: false }));
    return;
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Login seller
  const seller = await req("POST", "/user/login", { email: "seller@ultrasooq.com", password: "Password123!" });
  if (!seller.accessToken) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ backendAvailable: false }));
    return;
  }

  // Create room
  const room = await req("POST", "/chat/createPrivateRoom", {
    creatorId: buyer.data?.id, participants: [buyer.data?.id, seller.data?.id], rfqId: 1,
  }, buyer.accessToken);

  // Set channelId
  if (room.id) {
    try {
      const { Client } = require("pg");
      const pg = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5433/ultrasooq" });
      await pg.connect();
      await pg.query(`UPDATE "Room" SET "channelId"='v_rfq', "type"='rfq', "name"='E2E Room', "lastMessageAt"=NOW() WHERE id=$1`, [room.id]);
      await pg.end();
    } catch {}
  }

  // Send message
  await req("POST", "/chat/send-message", {
    content: "Global setup message", userId: buyer.data?.id, roomId: room.id, rfqId: 1,
  }, buyer.accessToken);

  const state = {
    backendAvailable: true,
    buyerToken: buyer.accessToken,
    buyerId: buyer.data?.id,
    sellerToken: seller.accessToken,
    sellerId: seller.data?.id,
    testRoomId: room.id,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  console.log(`✅ Global E2E setup: buyer=${state.buyerId}, seller=${state.sellerId}, room=${state.testRoomId}`);
};
