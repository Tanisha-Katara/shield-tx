"use client";

import { useEffect, useState } from "react";
import { SectionWrapper } from "../ui/SectionWrapper";
import { useInView } from "@/hooks/useInView";

function PriceConvergence() {
  const [ref, inView] = useInView(0.3);
  const [directPrice, setDirectPrice] = useState(2847.32);
  const [shieldedPrice, setShieldedPrice] = useState(2851.15);
  const targetPrice = 2849.23;

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDirectPrice(targetPrice);
      setShieldedPrice(targetPrice);
      return;
    }

    let frame = 0;
    const totalFrames = 60;
    const startDirect = 2847.32;
    const startShielded = 2851.15;

    function animate() {
      frame++;
      const t = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setDirectPrice(startDirect + (targetPrice - startDirect) * eased);
      setShieldedPrice(startShielded + (targetPrice - startShielded) * eased);

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [inView]);

  return (
    <div ref={ref} className="border border-shieldtx-border bg-shieldtx-surface p-6">
      <p className="font-mono text-xs text-shieldtx-muted uppercase tracking-wider mb-6">
        ETH-PERP fill comparison
      </p>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm text-shieldtx-muted">Direct HL fill</span>
          <span className="font-mono text-lg text-shieldtx-text">
            ${directPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm text-shieldtx-green">Shielded fill</span>
          <span className="font-mono text-lg text-shieldtx-green">
            ${shieldedPrice.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-shieldtx-border pt-3 flex justify-between items-center">
          <span className="font-mono text-xs text-shieldtx-muted">Difference</span>
          <span className="font-mono text-sm text-shieldtx-green">
            ${Math.abs(directPrice - shieldedPrice).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TrustSection() {
  return (
    <SectionWrapper id="trust">
      <h2 className="text-3xl md:text-5xl font-bold text-shieldtx-text mb-4">
        You shouldn&apos;t trust us. Here&apos;s why you can verify.
      </h2>
      <p className="text-lg text-shieldtx-muted mb-12 max-w-2xl">
        Two things matter. Everything else is marketing.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-shieldtx-border bg-shieldtx-surface p-6 md:p-8">
          <h3 className="font-mono text-shieldtx-green text-sm uppercase tracking-wider mb-4">
            Execution Parity
          </h3>
          <p className="text-shieldtx-text text-lg font-bold mb-4">
            Every shielded trade produces the same fill price as a direct HL trade.
          </p>
          <p className="text-sm text-shieldtx-muted leading-relaxed">
            Verify any fill against the HL explorer. Same matching engine, same orderbook, same
            price. If fills aren&apos;t parity, nothing else matters. We know that.
          </p>
        </div>

        <div className="border border-shieldtx-border bg-shieldtx-surface p-6 md:p-8">
          <h3 className="font-mono text-shieldtx-green text-sm uppercase tracking-wider mb-4">
            Compliant by Design
          </h3>
          <p className="text-shieldtx-text text-lg font-bold mb-4">
            Not a mixer. Not obfuscation. Your trades are yours.
          </p>
          <p className="text-sm text-shieldtx-muted leading-relaxed">
            Your orders aren&apos;t broadcast to public feeds before filling. That&apos;s it.
            Post-trade, everything is on-chain and auditable. Compliant by design, not by
            afterthought.
          </p>
        </div>
      </div>

      <div className="mt-10 max-w-md mx-auto">
        <PriceConvergence />
      </div>
    </SectionWrapper>
  );
}
