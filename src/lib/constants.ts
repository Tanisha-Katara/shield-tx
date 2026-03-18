import { PricingTier } from "./types";

export const COLORS = {
  bg: "#0A0A0F",
  surface: "#12121A",
  border: "#2A2A3A",
  text: "#E8E8F0",
  muted: "#8888A0",
  green: "#00FF88",
  red: "#FF3366",
  amber: "#FFB800",
} as const;

export const COPY_TOOLS = [
  "Dexly",
  "HyperDash",
  "CoinGlass",
  "Nansen",
  "Hyperbot",
  "SuperX",
  "Open-source bots",
  "Arkham",
  "Debank",
  "Custom scripts",
  "Telegram bots",
  "Mirror protocols",
];

export const CYCLING_STATS = [
  { value: "12+", label: "copy-trading tools monitor HL wallets" },
  { value: "5-15 bps", label: "average alpha leakage per copied trade" },
  { value: "<2s", label: "average lag before your position is mirrored" },
  { value: "$0", label: "cost for anyone to query your open positions" },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "Free",
    volumeRange: "<$10K/mo",
    features: [
      "Shielded execution on 5 markets",
      "Basic exposure scan",
      "Community Discord",
    ],
  },
  {
    name: "Pro",
    price: "$99/mo",
    volumeRange: "$10K-$500K/mo",
    features: [
      "Shielded execution on all markets",
      "Full correlation scan",
      "Priority fills",
      "Email support",
    ],
    highlighted: true,
  },
  {
    name: "Whale",
    price: "0.15% vol",
    volumeRange: "$500K-$5M/mo",
    features: [
      "Everything in Pro",
      "Dedicated execution path",
      "Custom shielding rules",
      "Direct Telegram support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    volumeRange: "$5M+/mo",
    features: [
      "Everything in Whale",
      "Multi-account shielding",
      "API access",
      "SLA guarantee",
    ],
  },
];

export const VOLUME_RANGES = [
  "< $10K/mo",
  "$10K - $100K/mo",
  "$100K - $500K/mo",
  "$500K - $1M/mo",
  "$1M - $5M/mo",
  "$5M+/mo",
];

export const SOCIAL_PROOF = [
  {
    quote:
      "I'm running 5 wallets just to fragment my signal. It's exhausting.",
    persona: "whale, top 100 PnL",
  },
  {
    quote: "If it feels like HL with ghost mode, I'm in.",
    persona: "top 50 trader",
  },
  {
    quote: "Most privacy tools are clunky or sketchy. Make it easy.",
    persona: "DeFi trader, $2M+ vol",
  },
  {
    quote:
      "I'd pay 0.2-0.3% of volume. The copy-bots cost me more than that.",
    persona: "whale, $5M+ vol",
  },
];
