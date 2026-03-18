import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// --- Config ---

const HL_WS_URL = "wss://api.hyperliquid.xyz/ws";

const TOP_COINS = [
  "BTC", "ETH", "SOL", "DOGE", "XRP",
  "AVAX", "ARB", "SUI", "LINK", "OP",
];

const FLUSH_INTERVAL_MS = 5_000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const BATCH_SIZE = 500;
const RECONNECT_DELAY_MS = 5_000;
const SUBSCRIBE_DELAY_MS = 300; // stagger subscriptions

// --- Types ---

interface HlWsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
  users: [string, string];
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
let shouldReconnect = true;

const stats = {
  tradesReceived: 0,
  tradesInserted: 0,
  flushCycles: 0,
  errors: 0,
  reconnects: 0,
  startedAt: new Date(),
  lastTradeAt: null as Date | null,
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
      if (!error.message.includes("duplicate")) {
        buffer.unshift(...batch);
      }
      return;
    }

    stats.tradesInserted += batch.length;
    stats.flushCycles++;
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function connect() {
  console.log("[ws] Connecting to", HL_WS_URL);
  ws = new WebSocket(HL_WS_URL);

  ws.on("open", async () => {
    console.log("[ws] Connected");

    // Subscribe to each coin with a small delay to avoid overwhelming the server
    for (const coin of TOP_COINS) {
      if (!ws || ws.readyState !== WebSocket.OPEN) break;

      const sub = JSON.stringify({
        method: "subscribe",
        subscription: { type: "trades", coin },
      });
      ws.send(sub);
      console.log(`[ws] Subscribed to ${coin} trades`);
      await sleep(SUBSCRIBE_DELAY_MS);
    }
  });

  ws.on("message", (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.channel === "trades" && Array.isArray(msg.data)) {
        for (const trade of msg.data as HlWsTrade[]) {
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
          stats.lastTradeAt = new Date();
        }
      }
    } catch (err) {
      console.error("[ws] Parse error:", err);
      stats.errors++;
    }
  });

  ws.on("close", (code: number, reason: Buffer) => {
    console.log(`[ws] Closed: code=${code} reason=${reason.toString()}`);
    ws = null;

    if (shouldReconnect) {
      stats.reconnects++;
      console.log(`[ws] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
      setTimeout(connect, RECONNECT_DELAY_MS);
    }
  });

  ws.on("error", (err: Error) => {
    console.error("[ws] Error:", err.message);
    stats.errors++;
  });
}

// --- Stats ---

function printStats() {
  const uptime = Math.round(
    (Date.now() - stats.startedAt.getTime()) / 1000 / 60
  );
  const lastTrade = stats.lastTradeAt
    ? `${Math.round((Date.now() - stats.lastTradeAt.getTime()) / 1000)}s ago`
    : "none";
  console.log(
    `[stats] uptime=${uptime}m received=${stats.tradesReceived} inserted=${stats.tradesInserted} buffer=${buffer.length} reconnects=${stats.reconnects} errors=${stats.errors} lastTrade=${lastTrade}`
  );
}

// --- Main ---

async function main() {
  console.log("Shield TX Trade Collector starting (WebSocket mode)...");
  console.log(`Tracking ${TOP_COINS.length} coins: ${TOP_COINS.join(", ")}`);

  initSupabase();
  connect();

  // Flush buffer every 5 seconds
  setInterval(flushAll, FLUSH_INTERVAL_MS);

  // Cleanup old trades every hour
  setInterval(cleanupOldTrades, CLEANUP_INTERVAL_MS);

  // Print stats every minute
  setInterval(printStats, 60_000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[shutdown] Closing WebSocket and flushing...");
    shouldReconnect = false;
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
