import WebSocket from "ws";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Config ---

const HL_WS_URL = "wss://api.hyperliquid.xyz/ws";

const TOP_COINS = [
  "BTC", "ETH", "SOL", "DOGE", "XRP", "AVAX", "MATIC", "ARB",
  "OP", "SUI", "APT", "INJ", "TIA", "SEI", "JUP", "WIF",
  "PEPE", "BONK", "ONDO", "LINK", "AAVE", "MKR", "SNX", "GMX",
  "PENDLE", "STX", "NEAR", "FTM", "ATOM", "DOT",
];

const BATCH_SIZE = 200;
const FLUSH_INTERVAL_MS = 5_000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

// --- Types ---

interface WsTrade {
  coin: string;
  side: string; // "B" or "A"
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
  users: [string, string]; // [buyer, seller]
}

interface WsMessage {
  channel: string;
  data: WsTrade[];
}

interface TradeRow {
  ts: string;
  coin: string;
  side: string;
  px: number;
  sz: number;
  hash: string;
  tid: number;
  buyer: string;
  seller: string;
}

// --- State ---

let supabase: SupabaseClient;
let ws: WebSocket | null = null;
let buffer: TradeRow[] = [];
let reconnectAttempts = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

let stats = {
  tradesReceived: 0,
  tradesInserted: 0,
  errors: 0,
  lastFlush: new Date(),
  startedAt: new Date(),
};

// --- Supabase ---

function initSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
    process.exit(1);
  }

  supabase = createClient(url, key);
  console.log("[db] Supabase client initialized");
}

async function flushBuffer() {
  if (buffer.length === 0) return;

  const batch = buffer.splice(0, BATCH_SIZE);

  try {
    const { error } = await supabase.from("trades").insert(batch);

    if (error) {
      console.error("[db] Insert error:", error.message);
      stats.errors++;
      // Put failed rows back at the front of the buffer
      buffer.unshift(...batch);
      return;
    }

    stats.tradesInserted += batch.length;
    stats.lastFlush = new Date();
  } catch (err) {
    console.error("[db] Insert exception:", err);
    stats.errors++;
    buffer.unshift(...batch);
  }
}

async function flushAll() {
  while (buffer.length > 0) {
    await flushBuffer();
  }
}

async function cleanupOldTrades() {
  try {
    const { error } = await supabase.rpc("cleanup_old_trades");
    if (error) {
      console.error("[db] Cleanup error:", error.message);
    } else {
      console.log("[db] Old trades cleaned up");
    }
  } catch (err) {
    console.error("[db] Cleanup exception:", err);
  }
}

// --- WebSocket ---

function connect() {
  console.log("[ws] Connecting to Hyperliquid...");
  ws = new WebSocket(HL_WS_URL);

  ws.on("open", () => {
    console.log("[ws] Connected");
    reconnectAttempts = 0;

    // Subscribe to trades for each coin
    for (const coin of TOP_COINS) {
      ws!.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "trades", coin },
        })
      );
    }
    console.log(`[ws] Subscribed to ${TOP_COINS.length} coins`);

    // Start heartbeat
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);
  });

  ws.on("message", (data: WebSocket.Data) => {
    try {
      const msg: WsMessage = JSON.parse(data.toString());

      if (msg.channel === "trades" && Array.isArray(msg.data)) {
        for (const trade of msg.data) {
          // Skip trades without user addresses
          if (!trade.users || trade.users.length < 2) continue;

          buffer.push({
            ts: new Date(trade.time).toISOString(),
            coin: trade.coin,
            side: trade.side,
            px: parseFloat(trade.px),
            sz: parseFloat(trade.sz),
            hash: trade.hash,
            tid: trade.tid,
            buyer: trade.users[0].toLowerCase(),
            seller: trade.users[1].toLowerCase(),
          });

          stats.tradesReceived++;
        }
      }
    } catch {
      // Ignore parse errors (pong frames, subscription confirmations, etc.)
    }
  });

  ws.on("close", (code: number, reason: Buffer) => {
    console.log(`[ws] Disconnected: ${code} ${reason.toString()}`);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    scheduleReconnect();
  });

  ws.on("error", (err: Error) => {
    console.error("[ws] Error:", err.message);
    stats.errors++;
  });
}

function scheduleReconnect() {
  const delay = Math.min(
    RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY_MS
  );
  reconnectAttempts++;
  console.log(`[ws] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  setTimeout(connect, delay);
}

// --- Stats ---

function printStats() {
  const uptime = Math.round(
    (Date.now() - stats.startedAt.getTime()) / 1000 / 60
  );
  console.log(
    `[stats] uptime=${uptime}m received=${stats.tradesReceived} inserted=${stats.tradesInserted} buffer=${buffer.length} errors=${stats.errors}`
  );
}

// --- Main ---

async function main() {
  console.log("Shield TX Trade Collector starting...");
  console.log(`Tracking ${TOP_COINS.length} coins: ${TOP_COINS.join(", ")}`);

  initSupabase();
  connect();

  // Flush buffer every 5 seconds
  flushTimer = setInterval(flushAll, FLUSH_INTERVAL_MS);

  // Cleanup old trades every hour
  cleanupTimer = setInterval(cleanupOldTrades, CLEANUP_INTERVAL_MS);

  // Print stats every minute
  setInterval(printStats, 60_000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[shutdown] Flushing remaining trades...");
    if (flushTimer) clearInterval(flushTimer);
    if (cleanupTimer) clearInterval(cleanupTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (ws) ws.close();
    await flushAll();
    console.log("[shutdown] Done");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
