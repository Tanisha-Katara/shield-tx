"use client";

import { useState } from "react";
import { GlowButton } from "./GlowButton";

interface WalletInputProps {
  onSubmit: (address: string) => void;
  loading?: boolean;
  defaultValue?: string;
}

export function WalletInput({ onSubmit, loading = false, defaultValue = "" }: WalletInputProps) {
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0x..."
        spellCheck={false}
        autoComplete="off"
        className="flex-1 bg-shieldtx-surface border border-shieldtx-border px-4 py-3.5 font-mono text-sm text-shieldtx-text placeholder:text-shieldtx-muted/50 focus:outline-none focus:border-shieldtx-green/50 transition-colors"
      />
      <GlowButton type="submit" disabled={loading || !value.trim()}>
        {loading ? "Scanning..." : "Scan"}
      </GlowButton>
    </form>
  );
}
