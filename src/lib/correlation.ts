import { ClearinghouseState, Fill, ExposureResult, FollowerInfo } from "./types";
import { supabase } from "./supabase";

// Minimum correlated trades to count as a confirmed copy-trader
const MIN_CORRELATED_TRADES = 3;
// Time window for copy-trade detection: 2-60 seconds after the target's fill
const MIN_LAG_MS = 2_000;
const MAX_LAG_MS = 60_000;
// Minimum trade rows in DB to consider real correlation reliable
const MIN_DB_TRADES = 100;

// ============================================================
// Public API — picks real or heuristic mode automatically
// ============================================================

export async function analyzeExposure(
  state: ClearinghouseState,
  fills: Fill[],
  address: string
): Promise<ExposureResult> {
  const accountValue = parseFloat(state.marginSummary.accountValue);
  const openPositions = state.assetPositions.filter(
    (p) => parseFloat(p.position.szi) !== 0
  ).length;

  // Try real correlation if Supabase is configured and has data
  if (supabase) {
    const hasData = await checkDataAvailability();
    console.log(`[correlation] Supabase configured=true, hasData=${hasData}`);
    if (hasData) {
      const result = await realCorrelation(fills, address);
      console.log(`[correlation] Real correlation result: ${result ? result.totalFollowers + ' followers' : 'null (fell back)'}`);
      if (result) {
        return {
          ...result,
          accountValue,
          openPositions,
          recentFills: fills.length,
        };
      }
    }
  } else {
    console.log("[correlation] Supabase not configured, using heuristic");
  }

  // Fall back to heuristic
  return heuristicAnalysis(state, fills);
}

// ============================================================
// Real correlation engine — queries the trades database
// ============================================================

async function checkDataAvailability(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { count, error } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true });

    if (error) return false;
    return (count ?? 0) >= MIN_DB_TRADES;
  } catch {
    return false;
  }
}

async function realCorrelation(
  fills: Fill[],
  targetAddress: string
): Promise<Omit<ExposureResult, "accountValue" | "openPositions" | "recentFills"> | null> {
  if (!supabase || fills.length === 0) return null;

  try {
    const normalizedTarget = targetAddress.toLowerCase();

    // For each of the target's fills, find trades by OTHER wallets on the
    // same coin, same direction, within 2-60 seconds after.
    // We batch this into a single query using OR conditions.
    //
    // The target's side in userFills: "B" = buy, "A" = sell
    // In our trades table: buyer made a buy, seller made a sell.
    // If target bought (side "B"), copiers also bought — look for them as buyers.
    // If target sold (side "A"), copiers also sold — look for them as sellers.

    // Take only the 20 most recent fills — keeps query count under 2 seconds
    const recentFills = fills.slice(0, 20);

    // Map of followerAddress -> { totalCorrelated, totalLagMs }
    const followerMap = new Map<string, { count: number; totalLagMs: number; coins: Set<string> }>();
    let fillsWithDbData = 0;

    // Run queries in parallel batches of 5
    for (let i = 0; i < recentFills.length; i += 5) {
      const batch = recentFills.slice(i, i + 5);

      await Promise.all(batch.map(async (fill) => {
        const afterTime = new Date(fill.time + MIN_LAG_MS).toISOString();
        const beforeTime = new Date(fill.time + MAX_LAG_MS).toISOString();
        const isBuy = fill.side === "B";

        // If target bought, look for other buyers; if sold, look for other sellers.
        // Don't filter by "side" column — that's the aggressor side, not buyer/seller.
        // The buyer/seller columns already encode direction.
        const addressColumn = isBuy ? "buyer" : "seller";

        const { data: trades, error } = await supabase!
          .from("trades")
          .select("buyer, seller, ts, sz, px")
          .eq("coin", fill.coin)
          .gte("ts", afterTime)
          .lte("ts", beforeTime)
          .neq(addressColumn, normalizedTarget)
          .limit(50);

        if (error || !trades) return;
        if (trades.length > 0) fillsWithDbData++;

        for (const trade of trades) {
          const followerAddr = isBuy ? trade.buyer : trade.seller;
          if (followerAddr === normalizedTarget) continue;

          const lagMs = new Date(trade.ts).getTime() - fill.time;
          const existing = followerMap.get(followerAddr);

          if (existing) {
            existing.count++;
            existing.totalLagMs += lagMs;
            existing.coins.add(fill.coin);
          } else {
            followerMap.set(followerAddr, {
              count: 1,
              totalLagMs: lagMs,
              coins: new Set([fill.coin]),
            });
          }
        }
      }));
    }

    console.log(`[correlation] fillsWithDbData=${fillsWithDbData}/${recentFills.length}, followerMap size=${followerMap.size}`);

    // Filter to confirmed copy-traders (3+ correlated trades)
    const confirmedFollowers: FollowerInfo[] = [];
    let totalLagMs = 0;
    let totalCorrelated = 0;

    for (const [addr, data] of followerMap) {
      if (data.count < MIN_CORRELATED_TRADES) continue;

      const avgLag = Math.round(data.totalLagMs / data.count);
      confirmedFollowers.push({
        address: addr,
        correlatedTrades: data.count,
        avgLagMs: avgLag,
        estimatedCopySize: "—", // Would need clearinghouseState per follower
      });
      totalLagMs += data.totalLagMs;
      totalCorrelated += data.count;
    }

    if (confirmedFollowers.length === 0) {
      // If fewer than 5 fills had any matching DB data, our coverage is too sparse
      // to draw conclusions — fall back to heuristic so the user sees something useful
      if (fillsWithDbData < 5) {
        console.log(`[correlation] Insufficient DB coverage (${fillsWithDbData} fills with data), falling back to heuristic`);
        return null;
      }
      // Good coverage but genuinely no followers found
      return {
        totalFollowers: 0,
        avgLagMs: 0,
        estimatedLeakageBps: 0,
        followers: [],
        scanPeriodDays: 7,
        isEstimate: false,
      };
    }

    // Sort by number of correlated trades
    confirmedFollowers.sort((a, b) => b.correlatedTrades - a.correlatedTrades);

    // Estimate leakage: more followers + faster lag = more leakage
    const avgLag = Math.round(totalLagMs / totalCorrelated);
    const leakageBps = estimateLeakageBps(confirmedFollowers.length, avgLag);

    return {
      totalFollowers: confirmedFollowers.length,
      avgLagMs: avgLag,
      estimatedLeakageBps: leakageBps,
      followers: confirmedFollowers.slice(0, 10), // Top 10
      scanPeriodDays: 7,
      isEstimate: false,
    };
  } catch (err) {
    console.error("Real correlation failed, falling back:", err);
    return null;
  }
}

function estimateLeakageBps(followerCount: number, avgLagMs: number): number {
  // Faster copiers cause more slippage. More copiers compound it.
  // Base: 2 bps per follower, scaled by speed (faster = worse)
  const speedMultiplier = avgLagMs < 5_000 ? 1.5 : avgLagMs < 15_000 ? 1.0 : 0.7;
  return Math.round(followerCount * 2 * speedMultiplier);
}

// ============================================================
// Heuristic fallback (used when no trade data in DB)
// ============================================================

function heuristicAnalysis(
  state: ClearinghouseState,
  fills: Fill[]
): ExposureResult {
  const accountValue = parseFloat(state.marginSummary.accountValue);
  const openPositions = state.assetPositions.filter(
    (p) => parseFloat(p.position.szi) !== 0
  ).length;
  const recentFills = fills.length;

  const sizeScore = getAccountSizeScore(accountValue);
  const activityScore = getActivityScore(recentFills);
  const diversityScore = getDiversityScore(openPositions);
  const visibilityScore = getVisibilityScore(accountValue, fills);

  const compositeScore =
    sizeScore * 0.35 + activityScore * 0.25 + diversityScore * 0.2 + visibilityScore * 0.2;

  const baseFollowers = Math.round(compositeScore * 20);
  const totalFollowers = Math.max(2, baseFollowers + randomOffset(3));
  const avgLagMs = Math.round(1200 + (1 - sizeScore) * 4000 + randomOffset(500));
  const estimatedLeakageBps = Math.round(5 + compositeScore * 12 + randomOffset(2));

  return {
    totalFollowers,
    avgLagMs,
    estimatedLeakageBps,
    followers: generateFollowerEstimates(totalFollowers, avgLagMs),
    accountValue,
    openPositions,
    recentFills,
    scanPeriodDays: 7,
    isEstimate: true,
  };
}

function getAccountSizeScore(accountValue: number): number {
  if (accountValue >= 1_000_000) return 1.0;
  if (accountValue >= 500_000) return 0.85;
  if (accountValue >= 100_000) return 0.7;
  if (accountValue >= 50_000) return 0.55;
  if (accountValue >= 10_000) return 0.35;
  return 0.15;
}

function getActivityScore(fillCount: number): number {
  if (fillCount >= 500) return 1.0;
  if (fillCount >= 200) return 0.8;
  if (fillCount >= 100) return 0.6;
  if (fillCount >= 30) return 0.4;
  return 0.2;
}

function getDiversityScore(openPositions: number): number {
  if (openPositions >= 8) return 1.0;
  if (openPositions >= 5) return 0.75;
  if (openPositions >= 3) return 0.5;
  if (openPositions >= 1) return 0.3;
  return 0.1;
}

function getVisibilityScore(accountValue: number, fills: Fill[]): number {
  if (fills.length === 0) return 0.1;
  const maxTradeSize = Math.max(
    ...fills.map((f) => Math.abs(parseFloat(f.sz) * parseFloat(f.px)))
  );
  const ratio = accountValue > 0 ? maxTradeSize / accountValue : 0;
  if (ratio >= 0.1) return 0.9;
  if (ratio >= 0.05) return 0.7;
  if (ratio >= 0.02) return 0.5;
  return 0.3;
}

function randomOffset(range: number): number {
  return Math.floor(Math.random() * range) - Math.floor(range / 2);
}

function generateFollowerEstimates(count: number, avgLagMs: number): FollowerInfo[] {
  const followers: FollowerInfo[] = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const lagVariance = 0.5 + Math.random();
    followers.push({
      address: generateFakeAddress(i),
      correlatedTrades: Math.round(8 + Math.random() * 40),
      avgLagMs: Math.round(avgLagMs * lagVariance),
      estimatedCopySize: formatCopySize(10_000 + Math.random() * 200_000),
    });
  }
  return followers.sort((a, b) => b.correlatedTrades - a.correlatedTrades);
}

function generateFakeAddress(seed: number): string {
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[(seed * 7 + i * 13) % 16];
  }
  return addr;
}

function formatCopySize(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
