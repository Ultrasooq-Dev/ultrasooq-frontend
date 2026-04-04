/**
 * E2E setup — reads state from globalSetup file.
 * No login calls — avoids rate limiting.
 */
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(__dirname, ".e2e-state.json");

export const testState = {
  backendAvailable: false,
  buyerToken: "",
  buyerId: 0,
  sellerToken: "",
  sellerId: 0,
  testRoomId: 0,
};

let loaded = false;

export function ensureSetup(): typeof testState {
  if (loaded) return testState;
  loaded = true;

  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    Object.assign(testState, data);
  } catch {
    console.warn("⚠️  No E2E state file — run with globalSetup or backend not available");
  }

  return testState;
}
