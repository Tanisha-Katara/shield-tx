"use client";

import { SectionWrapper } from "../ui/SectionWrapper";
import { COPY_TOOLS } from "@/lib/constants";

export function ProblemSection() {
  return (
    <SectionWrapper>
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-12">
        The copy-trade ecosystem is bigger than you think.
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
        {COPY_TOOLS.map((tool) => (
          <div
            key={tool}
            className="border border-shieldtx-border bg-shieldtx-surface px-4 py-3 font-mono text-sm text-shieldtx-muted"
          >
            {tool}
          </div>
        ))}
      </div>

      <div className="space-y-6 max-w-3xl">
        <p className="text-lg text-shieldtx-text">
          Every open position on Hyperliquid is queryable by anyone, in real-time, with zero
          authentication.
        </p>
        <p className="text-shieldtx-muted">
          $50K accounts get the same treatment as $5M accounts. If you have open positions,
          someone is watching.
        </p>
      </div>

      {/* Wallet rotation section */}
      <div className="mt-16 border-t border-shieldtx-border pt-14">
        <h3 className="text-2xl md:text-4xl font-bold text-shieldtx-text mb-8">
          Wallet rotation doesn&apos;t work.
        </h3>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="border border-shieldtx-border bg-shieldtx-surface p-6">
            <p className="font-mono text-xs text-shieldtx-muted uppercase tracking-wider mb-4">
              Your 8-wallet setup
            </p>
            <div className="space-y-2">
              {[
                "0x3a7f2c8e1d4b9a6f5e0c8d2b7a4f1e3c9d6b8a2f",
                "0x9e1c4d7b3a8f2e6c0d5b9a4f7e1c3d8b6a2f0e5c",
                "0x5b8a2f4e7c1d9b3a6f0e8c5d2b7a4f1e3c9d6b8a",
                "0x1d6b9a3f7e2c8d4b0a5f1e9c3d7b6a8f2e4c0d5b",
                "0x7e4c0d5b8a2f6e1c9d3b7a4f0e8c5d2b9a6f1e3c",
                "0x2f8c5d1b6a9e3c7d4b0a5f2e8c1d9b3a7f6e4c0d",
                "0x4b0a5f9e2c7d1b6a3f8e4c0d5b9a2f7e1c3d8b6a",
                "0x8d3b7a6f1e4c9d2b5a0f8e3c7d1b6a4f9e2c0d5b",
              ].map((addr) => (
                <div key={addr} className="font-mono text-xs text-shieldtx-muted/60 truncate">
                  {addr}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-shieldtx-red/30 bg-shieldtx-red/5 p-6">
            <p className="font-mono text-xs text-shieldtx-red uppercase tracking-wider mb-4">
              What Arkham sees
            </p>
            <div className="flex items-center justify-center h-full min-h-[120px]">
              <div className="text-center">
                <p className="font-mono text-4xl font-bold text-shieldtx-red">1</p>
                <p className="font-mono text-sm text-shieldtx-red/70 mt-2">
                  clustered entity
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-shieldtx-muted max-w-2xl">
          Multi-wallet workarounds break down against clustering tools. Arkham, Nansen, and
          open-source heuristics group your wallets by funding patterns, trade timing, and
          shared gas sources. 7 out of 10 traders we interviewed had tried some version of
          this. None of them thought it was working.
        </p>
      </div>
    </SectionWrapper>
  );
}
