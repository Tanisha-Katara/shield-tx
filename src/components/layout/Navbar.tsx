"use client";

import { useState } from "react";
import { GlowButton } from "../ui/GlowButton";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-shieldtx-bg/80 backdrop-blur-md border-b border-shieldtx-border/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 h-20 flex items-center justify-between">
        <span className="font-mono text-base md:text-lg font-bold tracking-[0.2em] text-shieldtx-text">
          SHIELD TX
        </span>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          <button
            onClick={() => scrollTo("how-it-works")}
            className="font-mono text-sm text-shieldtx-muted hover:text-shieldtx-text transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo("trust")}
            className="font-mono text-sm text-shieldtx-muted hover:text-shieldtx-text transition-colors cursor-pointer"
          >
            Trust
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="font-mono text-sm text-shieldtx-muted hover:text-shieldtx-text transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <GlowButton size="md" onClick={() => scrollTo("exposure-checker")}>
            Check Your Exposure
          </GlowButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-shieldtx-muted p-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {menuOpen ? (
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <>
                <path d="M2 5H18" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 10H18" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 15H18" stroke="currentColor" strokeWidth="1.5" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-shieldtx-border bg-shieldtx-bg px-6 py-4 space-y-4">
          <button
            onClick={() => scrollTo("how-it-works")}
            className="block font-mono text-xs text-shieldtx-muted hover:text-shieldtx-text cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo("trust")}
            className="block font-mono text-xs text-shieldtx-muted hover:text-shieldtx-text cursor-pointer"
          >
            Trust
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="block font-mono text-xs text-shieldtx-muted hover:text-shieldtx-text cursor-pointer"
          >
            Pricing
          </button>
          <GlowButton size="md" onClick={() => scrollTo("exposure-checker")} className="w-full">
            Check Your Exposure
          </GlowButton>
        </div>
      )}
    </nav>
  );
}
