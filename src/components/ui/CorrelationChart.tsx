"use client";

import { FollowerInfo } from "@/lib/types";

interface CorrelationChartProps {
  followers: FollowerInfo[];
}

export function CorrelationChart({ followers }: CorrelationChartProps) {
  if (followers.length === 0) return null;

  const maxTrades = Math.max(...followers.map((f) => f.correlatedTrades));

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-wider text-shieldtx-muted">
        Top correlated wallets
      </p>
      {followers.map((f, i) => {
        const width = (f.correlatedTrades / maxTrades) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="font-mono text-xs text-shieldtx-muted w-28 shrink-0 truncate">
              {f.address.slice(0, 6)}...{f.address.slice(-4)}
            </span>
            <div className="flex-1 h-5 bg-shieldtx-surface border border-shieldtx-border relative overflow-hidden">
              <div
                className="h-full bg-shieldtx-red/30 border-r border-shieldtx-red/60 transition-all duration-700"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="font-mono text-xs text-shieldtx-red w-20 text-right shrink-0">
              {f.correlatedTrades} trades
            </span>
          </div>
        );
      })}
    </div>
  );
}
