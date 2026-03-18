"use client";

import { SectionWrapper } from "../ui/SectionWrapper";
import { SOCIAL_PROOF } from "@/lib/constants";

export function SocialProof() {
  return (
    <SectionWrapper>
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-12">
        From traders, not from us.
      </h2>

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
        {SOCIAL_PROOF.map((item, i) => (
          <div
            key={i}
            className="border border-shieldtx-border bg-shieldtx-surface p-6 md:p-8 min-w-[300px] md:min-w-[360px] shrink-0 snap-start"
          >
            <p className="font-mono text-shieldtx-green text-xs mb-4">{"> _"}</p>
            <p className="text-shieldtx-text text-lg leading-relaxed mb-6">
              &ldquo;{item.quote}&rdquo;
            </p>
            <p className="font-mono text-xs text-shieldtx-muted">
              — {item.persona}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
