export interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  leverage: { type: string; value: number };
}

export interface Fill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
}

export interface ClearinghouseState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  assetPositions: Array<{
    type: string;
    position: Position;
  }>;
}

export interface FollowerInfo {
  address: string;
  correlatedTrades: number;
  avgLagMs: number;
  estimatedCopySize: string;
}

export interface ExposureResult {
  totalFollowers: number;
  avgLagMs: number;
  estimatedLeakageBps: number;
  followers: FollowerInfo[];
  accountValue: number;
  openPositions: number;
  recentFills: number;
  scanPeriodDays: number;
  isEstimate: boolean;
}

export interface PricingTier {
  name: string;
  price: string;
  volumeRange: string;
  features: string[];
  highlighted?: boolean;
}

export interface SignupData {
  address: string;
  email?: string;
  volumeRange: string;
}

export interface DbTrade {
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
