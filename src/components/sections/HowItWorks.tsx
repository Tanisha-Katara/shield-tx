"use client";

import { SectionWrapper } from "../ui/SectionWrapper";

const STEPS = [
  {
    number: "01",
    title: "Connect",
    description:
      "Link your HL wallet. No private keys, no signing. Read-only connection to verify your account.",
  },
  {
    number: "02",
    title: "Trade",
    description:
      "Execute through Shield TX. Your orders go to Hyperliquid's matching engine directly. Same orderbook, same liquidity.",
  },
  {
    number: "03",
    title: "Fill",
    description:
      "Your fills land on-chain. But your pre-trade intent, your position sizing, your entry timing — none of that broadcasts to the public feed until after execution.",
  },
];

export function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works">
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-4">
        Same fills. No footprint.
      </h2>
      <p className="text-lg text-shieldtx-muted mb-12 max-w-2xl">
        Three steps between you and shielded execution.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="border border-shieldtx-border bg-shieldtx-surface p-6 md:p-8">
            <span className="font-mono text-shieldtx-green text-sm">{step.number}</span>
            <h3 className="text-xl font-bold text-shieldtx-text mt-3 mb-4">{step.title}</h3>
            <p className="text-sm text-shieldtx-muted leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <p className="font-mono text-xs text-shieldtx-muted mt-12">
        Powered by Hyperliquid&apos;s execution engine. Not a wrapper. Not a bridge.
      </p>
    </SectionWrapper>
  );
}
