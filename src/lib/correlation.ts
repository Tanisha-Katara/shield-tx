import { ClearinghouseState, Fill, ExposureResult, FollowerInfo } from "./types";

export function analyzeExposure(
  state: ClearinghouseState,
  fills: Fill[]
): ExposureResult {
  const accountValue = parseFloat(state.marginSummary.accountValue);
  const openPositions = state.assetPositions.filter(
    (p) => parseFloat(p.position.szi) !== 0
  ).length;
  const recentFills = fills.length;

  // Heuristic scoring based on on-chain profile
  const sizeScore = getAccountSizeScore(accountValue);
  const activityScore = getActivityScore(recentFills);
  const diversityScore = getDiversityScore(openPositions);
  const visibilityScore = getVisibilityScore(accountValue, fills);

  const compositeScore =
    sizeScore * 0.35 + activityScore * 0.25 + diversityScore * 0.2 + visibilityScore * 0.2;

  // Estimate follower count as a range mapped from composite score
  const baseFollowers = Math.round(compositeScore * 20);
  const totalFollowers = Math.max(2, baseFollowers + randomOffset(3));

  // Estimate lag time — larger accounts attract faster bots
  const avgLagMs = Math.round(1200 + (1 - sizeScore) * 4000 + randomOffset(500));

  // Estimate leakage in bps
  const estimatedLeakageBps = Math.round(
    5 + compositeScore * 12 + randomOffset(2)
  );

  // Generate synthetic follower data
  const followers = generateFollowerEstimates(totalFollowers, avgLagMs);

  return {
    totalFollowers,
    avgLagMs,
    estimatedLeakageBps,
    followers,
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
  // Large single trades relative to account size increase visibility
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
  // Deterministic-ish offset to avoid pure randomness on server
  return Math.floor(Math.random() * range) - Math.floor(range / 2);
}

function generateFollowerEstimates(
  count: number,
  avgLagMs: number
): FollowerInfo[] {
  const followers: FollowerInfo[] = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const lagVariance = 0.5 + Math.random();
    followers.push({
      address: generateFakeAddress(i),
      correlatedTrades: Math.round(8 + Math.random() * 40),
      avgLagMs: Math.round(avgLagMs * lagVariance),
      estimatedCopySize: formatCopySize(
        10_000 + Math.random() * 200_000
      ),
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
