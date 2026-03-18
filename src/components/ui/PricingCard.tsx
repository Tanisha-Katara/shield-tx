"use client";

import { PricingTier } from "@/lib/types";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const highlight = tier.highlighted;

  return (
    <div
      className={`border p-6 md:p-8 flex flex-col ${
        highlight
          ? "border-shieldtx-green/40 bg-shieldtx-green/5"
          : "border-shieldtx-border bg-shieldtx-surface"
      }`}
    >
      {highlight && (
        <span className="font-mono text-xs text-shieldtx-green uppercase tracking-widest mb-3">
          Most popular
        </span>
      )}
      <h3 className="font-mono text-lg font-bold text-shieldtx-text">{tier.name}</h3>
      <p className="font-mono text-3xl font-bold text-shieldtx-text mt-2">{tier.price}</p>
      <p className="text-sm text-shieldtx-muted mt-1">{tier.volumeRange}</p>
      <ul className="mt-6 space-y-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-shieldtx-muted">
            <span className="text-shieldtx-green mt-0.5">+</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
