import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Config ---

const HL_API_URL = "https://api.hyperliquid.xyz/info";

// Top perp markets by volume
const TOP_COINS = [
  "BTC", "ETH", "SOL", "DOGE", "XRP",
  "AVAX", "ARB", "SUI", "LINK", "OP",
];

// How often to poll each coin's recent trades (seconds)
const POLL_INTERVAL_MS = 10_000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const BATCH_SIZE = 200;

// --- Types ---

interface HlTrade {
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
// Track the last seen trade time per coin to avoid duplicates
const lastSeenTime = new Map<string, number>();
let buffer: TradeRow[] = [];

let stats = {
  tradesReceived: 0,
  tradesInserted: 0,
  pollCycles: 0,
  errors: 0,
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
      // Don't requeue on duplicate key errors
      if (!error.message.includes("duplicate")) {
        buffer.unshift(...batch);
      }
      return;
    }

    stats.tradesInserted += batch.length;
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

// --- HL API Polling ---

async function fetchRecentTrades(coin: string): Promise<HlTrade[]> {
  try {
    const res = await fetch(HL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recentTrades", coin }),
    });

    if (!res.ok) {
      console.error(`[api] ${coin} HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();

    // recentTrades returns an array of trades
    if (!Array.isArray(data)) return [];
    return data as HlTrade[];
  } catch (err) {
    console.error(`[api] ${coin} fetch error:`, err);
    stats.errors++;
    return [];
  }
}

async function pollCoin(coin: string) {
  const trades = await fetchRecentTrades(coin);
  const lastTime = lastSeenTime.get(coin) || 0;
  let maxTime = lastTime;

  for (const trade of trades) {
    // Skip trades we've already seen
    if (trade.time <= lastTime) continue;
    // Skip trades without user addresses
    if (!trade.users || trade.users.length < 2) continue;

    if (trade.time > maxTime) maxTime = trade.time;

    buffer.push({
      ts: new Date(trade.time).toISOString(),
      coin: trade.coin || coin,
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

  if (maxTime > lastTime) {
    lastSeenTime.set(coin, maxTime);
  }
}

async function pollAll() {
  // Poll coins sequentially with a small gap to respect rate limits
  for (const coin of TOP_COINS) {
    await pollCoin(coin);
    // Small delay between coins to spread out API calls
    await new Promise((r) => setTimeout(r, 200));
  }

  stats.pollCycles++;

  // Flush after each full poll cycle
  await flushAll();
}

// --- Stats ---

function printStats() {
  const uptime = Math.round(
    (Date.now() - stats.startedAt.getTime()) / 1000 / 60
  );
  console.log(
    `[stats] uptime=${uptime}m polls=${stats.pollCycles} received=${stats.tradesReceived} inserted=${stats.tradesInserted} buffer=${buffer.length} errors=${stats.errors}`
  );
}

// --- Main ---

async function main() {
  console.log("Shield TX Trade Collector starting (REST polling mode)...");
  console.log(`Tracking ${TOP_COINS.length} coins: ${TOP_COINS.join(", ")}`);
  console.log(`Poll interval: ${POLL_INTERVAL_MS / 1000}s`);

  initSupabase();

  // Initial poll
  console.log("[poll] Running initial poll...");
  await pollAll();
  console.log(`[poll] Initial poll done. ${stats.tradesReceived} trades found.`);

  // Start polling loop
  const pollLoop = setInterval(pollAll, POLL_INTERVAL_MS);

  // Cleanup old trades every hour
  const cleanupLoop = setInterval(cleanupOldTrades, CLEANUP_INTERVAL_MS);

  // Print stats every minute
  setInterval(printStats, 60_000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[shutdown] Flushing remaining trades...");
    clearInterval(pollLoop);
    clearInterval(cleanupLoop);
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
