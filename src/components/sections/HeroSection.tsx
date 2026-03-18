"use client";

import { useState, useEffect, useCallback } from "react";
import { TerminalText } from "../ui/TerminalText";
import { GlowButton } from "../ui/GlowButton";
import { CYCLING_STATS } from "@/lib/constants";

export function HeroSection() {
  const [statIndex, setStatIndex] = useState(0);
  const [headlineDone, setHeadlineDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatIndex((prev) => (prev + 1) % CYCLING_STATS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onHeadlineComplete = useCallback(() => {
    setHeadlineDone(true);
  }, []);

  function scrollToChecker() {
    document.getElementById("exposure-checker")?.scrollIntoView({ behavior: "smooth" });
  }

  const stat = CYCLING_STATS[statIndex];

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pt-16">
      <div className="max-w-3xl">
        <p className="font-mono text-sm text-shieldtx-green mb-4">
          {"> scanning hyperliquid mempool..."}
        </p>

        <h1 className="text-5xl md:text-7xl font-bold text-shieldtx-text leading-[1.1] mb-6">
          <TerminalText text="Your edge is leaking." speed={40} onComplete={onHeadlineComplete} />
        </h1>

        {headlineDone && (
          <div className="animate-fade-in">
            <p className="text-lg md:text-xl text-shieldtx-muted leading-relaxed mb-8 max-w-2xl">
              12+ copy-trading tools broadcast your positions in real-time. Every fill you get,
              they get seconds later. That costs you 5-15 bps per trade.
            </p>

            <div className="mb-8 h-12 flex items-center">
              <span className="font-mono text-2xl md:text-3xl font-bold text-shieldtx-green">
                {stat.value}
              </span>
              <span className="font-mono text-sm text-shieldtx-muted ml-3">
                {stat.label}
              </span>
            </div>

            <GlowButton size="lg" onClick={scrollToChecker}>
              See your exposure
            </GlowButton>
          </div>
        )}
      </div>
    </section>
  );
}
