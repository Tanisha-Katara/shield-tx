"use client";

import { SectionWrapper } from "../ui/SectionWrapper";
import { WalletInput } from "../ui/WalletInput";
import { ExposureResultCard } from "../ui/ExposureResultCard";
import { CorrelationChart } from "../ui/CorrelationChart";
import { GlowButton } from "../ui/GlowButton";
import { useWalletCheck } from "@/hooks/useWalletCheck";

export function ExposureChecker() {
  const { status, result, error, loadingStep, checkWallet } = useWalletCheck();

  function scrollToCTA() {
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <SectionWrapper id="exposure-checker">
      <p className="font-mono text-sm text-shieldtx-green mb-4">{"> exposure_scan"}</p>
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-4">
        Paste your wallet. See who&apos;s copying you.
      </h2>
      <p className="text-lg text-shieldtx-muted mb-10 max-w-2xl">
        Real-time exposure analysis of your Hyperliquid trading activity. No wallet connection required.
      </p>

      <WalletInput onSubmit={checkWallet} loading={status === "loading"} />

      {/* Loading state */}
      {status === "loading" && (
        <div className="mt-8 font-mono text-sm space-y-2">
          <p className="text-shieldtx-green animate-pulse">{loadingStep}</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="mt-8 font-mono text-sm text-shieldtx-red border border-shieldtx-red/30 bg-shieldtx-red/5 px-4 py-3">
          {error}
        </div>
      )}

      {/* Results */}
      {status === "success" && result && (
        <div className="mt-10 space-y-8">
          {result.analysisMode === "spot" && (
            <div className="font-mono text-sm text-shieldtx-amber border border-shieldtx-amber/30 bg-shieldtx-amber/5 px-4 py-3 mb-4">
              No perpetual positions found. Showing how your spot transactions are being copied.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExposureResultCard
              label="Correlated Wallets"
              value={result.totalFollowers}
              color="red"
              delay={0}
            />
            <ExposureResultCard
              label="Avg Lag Time"
              value={`${(result.avgLagMs / 1000).toFixed(1)}s`}
              color="amber"
              delay={0.15}
            />
            <ExposureResultCard
              label="Est. Alpha Leakage"
              value={result.estimatedLeakageBps}
              unit="bps"
              color="red"
              delay={0.3}
            />
          </div>

          {result.followers.length > 0 && (
            <div className="border border-shieldtx-border bg-shieldtx-surface p-6">
              <CorrelationChart followers={result.followers} />
            </div>
          )}

          <p className="font-mono text-xs text-shieldtx-muted">
            Based on {result.recentFills} fills over {result.scanPeriodDays} days.
            Account value: ${result.accountValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}.
            {result.isEstimate && (
              <span className="block mt-1">
                Estimated exposure based on on-chain profile. Full correlation scan available in beta.
              </span>
            )}
          </p>

          <div className="pt-4">
            <GlowButton size="lg" onClick={scrollToCTA}>
              Shield these positions. Request early access.
            </GlowButton>
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}
