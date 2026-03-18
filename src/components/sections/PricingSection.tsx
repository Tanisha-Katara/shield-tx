"use client";

import { SectionWrapper } from "../ui/SectionWrapper";
import { PricingCard } from "../ui/PricingCard";
import { PRICING_TIERS } from "@/lib/constants";

export function PricingSection() {
  return (
    <SectionWrapper id="pricing">
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-4">
        Copy-bots cost you 5-15 bps per trade. Shield TX costs less.
      </h2>
      <p className="text-lg text-shieldtx-muted mb-12">
        All tiers free during private beta.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_TIERS.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>
    </SectionWrapper>
  );
}
