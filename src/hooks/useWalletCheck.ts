"use client";

import { useState } from "react";
import { ExposureResult } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

interface UseWalletCheckReturn {
  status: Status;
  result: ExposureResult | null;
  error: string | null;
  loadingStep: string;
  checkWallet: (address: string) => Promise<void>;
  reset: () => void;
}

const LOADING_STEPS = [
  "Fetching positions...",
  "Analyzing fill patterns...",
  "Cross-referencing follower wallets...",
  "Calculating exposure...",
];

export function useWalletCheck(): UseWalletCheckReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ExposureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState("");

  async function checkWallet(address: string) {
    setStatus("loading");
    setError(null);
    setResult(null);

    // Simulate loading steps for terminal effect
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(LOADING_STEPS[i]);
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    }

    try {
      const res = await fetch("/api/wallet-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      setLoadingStep("");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setLoadingStep("");
  }

  return { status, result, error, loadingStep, checkWallet, reset };
}
