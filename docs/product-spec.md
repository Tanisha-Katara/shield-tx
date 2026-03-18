# ShadowFi Product Spec

> Version 1.0 — Perps-only launch

ShadowFi (codename Nightshade) lets you trade perpetuals on Hyperliquid with full privacy — your deposits, positions, and withdrawals are invisible to copy-traders, targeted sandwich attacks, and competitors. **The system is non-custodial throughout: your tokens remain under your control at every step, secured by keys only you hold or by on-chain escrow with automatic timeout protection.** This document explains exactly what happens to your tokens at each step and what protections are in place.

---

## How It Works in 30 Seconds

You deposit USDC into a privacy-preserving rollup (deployed on Arbitrum). Your balance becomes **shielded notes** — private UTXOs that only you can see or spend. When you open a position, a fresh, unlinkable Hyperliquid account is created just for that trade. When you close, proceeds return to your shielded balance. No one can connect your trades to your identity.

*Launch supports ETH, BTC, SOL, and HYPE perpetuals. Spot trading support coming soon.*

---

## Token Flow: Step by Step

### Step 1: Deposit (You → Vault Contract → Shielded Notes)

**What happens:** You send USDC to the Nightshade Vault contract on Arbitrum (via Nexus, which accepts funds from any chain). The Vault locks your USDC and the sequencer creates shielded notes credited to your ed25519 public key.

**Your control:**

- You sign the deposit transaction from your own wallet
- The Vault is a smart contract on Arbitrum — your USDC is locked in the Vault and can only be released via ZK-proven withdrawals
- The Vault contract has no access control on core operations (deposits, withdrawals, batch submissions are all permissionless and verified by ZK proofs)
- The sequencer creates notes within milliseconds of your deposit confirming on L1

**Trust:**

- The Vault contract is permissionless — core operations (deposit, withdraw, batch submission) are secured by ZK proofs, not access control
- State transitions require valid SP1 zero-knowledge SNARK (Groth16) proofs verified on-chain

---

### Step 2: Open Position (Shielded Notes → Solver → Fresh HL Account)

**What happens:** You choose a pair (BTC, ETH, SOL, or HYPE perps), direction, size, and leverage (up to 10x). The system creates a brand-new Hyperliquid wallet (secp256k1 key via Privy) just for this position. Your shielded notes are transferred to the Solver on the rollup, and the Solver funds your fresh HL account from its reserves. **You open the trade directly on Hyperliquid** — the Solver never touches your position.

**Your control:**

- You control the HL position account via Privy (your key, your signature on every order)
- The Solver only moves capital — it cannot open, close, or modify your positions
- Each position uses an isolated, unlinkable account — no one can correlate trades

**Trust:**

- Your notes are locked in escrow on the rollup. The Solver's funding action is verified via an MPC attestation mechanism before the escrow releases — this is necessary because Hyperliquid does not expose on-chain proofs of transfers.
- If the Solver fails to act, your notes automatically unlock after a timeout — you get your money back.
- The Solver never has unsecured access to your funds at any point.

---

### Step 3: Trading (You ↔ Hyperliquid Directly)

**What happens:** Your position is live on Hyperliquid's orderbook with real-time P&L. You interact directly with Hyperliquid — same execution, same liquidity, same price feeds.

**Your control:**

- You sign every trade with your own Privy-managed key
- No intermediary can modify or close your position
- Same execution quality as trading on Hyperliquid natively

**Trust:**

- Hyperliquid's orderbook and execution — same trust model as any HL trader
- No additional trust required from Nightshade at this stage

---

### Step 4: Close Position (HL Account → Solver → Shielded Notes)

**What happens:** You close your position directly on Hyperliquid (you sign the close order). You then send the proceeds (USDC) from your HL account to the Solver on Hyperliquid. The Solver detects the incoming transfer and sends equivalent shielded notes to your position account on the rollup.

**Your control:**

- You initiate the close — no one else can close your position
- You sign the USDC transfer to the Solver
- Proceeds return to your shielded balance, unlinkable to the HL position

**Trust:**

- A HyperEVM intermediary contract holds your close proceeds in escrow. The Solver's settlement is verified via MPC attestation before the rollup releases the escrow.
- Timeout protection ensures your funds are never stuck — if the Solver fails to settle, escrow releases funds back to you.

---

### Step 5: Withdraw (Shielded Notes → Vault Contract → Your Wallet)

**What happens:** You burn shielded notes on the rollup, specifying your L1 withdrawal address. The sequencer queues the withdrawal, generates a ZK proof, and submits it on-chain. You then claim your USDC from the Vault contract on Arbitrum using a Merkle inclusion proof.

**Your control:**

- You initiate the withdrawal — no one else can withdraw your notes
- The Vault verifies a ZK proof and Merkle inclusion proof before releasing funds — no human approval needed
- Anyone can submit the L1 claim transaction (permissionless) — funds always go to your specified address
- Double-spend protection: each withdrawal can only be claimed once

**Trust:**

- Fully trustless — the Vault contract verifies ZK proofs on-chain with no admin override
- No one can block or censor your withdrawal once the proof is submitted by the sequencer

---

## Privacy Guarantees

| What's Hidden | From Whom |
| --- | --- |
| Your total shielded balance | Everyone (UTXO model — only you can see your notes) |
| Connection between deposit and trades | Public observers, copy-traders, MEV bots |
| Connection between different positions | Each uses a fresh, unlinkable HL account |
| Your trading P&L and history | External observers |

---

## Safety Mechanisms

| Mechanism | Protection |
| --- | --- |
| **Vault Contract** | Core operations are permissionless and secured by ZK proofs — funds only move when cryptographically verified |
| **UTXO Note Model** | Balances are private commitments; double-spend prevented by nullifiers |
| **ZK Proofs (SP1)** | Every state transition (deposit, transfer, withdrawal) is cryptographically proven |
| **Per-Position Isolation** | Each trade uses a fresh wallet — compromise of one position does not affect others |
| **Privy Key Management** | You authenticate via email/social login; Privy manages keys client-side — the server never sees your private keys |
| **Escrow with Timeout** | Notes locked in escrow auto-release if Solver fails to act — no funds can be permanently stuck |
| **Sequential Batch Enforcement** | On-chain state advances strictly in order — no gaps, no replays |

---

## Trust Summary

| Component | Trust Level |
| --- | --- |
| **Vault Contract** | Permissionless — all core operations (deposit, withdraw, batch submission) are ZK-verified on-chain |
| **Rollup Sequencer** | Verifiable — the sequencer runs the rollup, but every state transition is ZK-proven and verified on-chain before L1 state advances |
| **Solver (funding & settlement)** | Escrow-protected — Solver actions are verified via MPC attestation before escrow releases; automatic timeout refund if Solver fails to act |
| **Privy (key management)** | Non-custodial — Privy generates stealth wallets client-side for rollup and HL accounts; server never sees private keys |
| **Withdrawals** | Trustless — ZK proof + Merkle proof verified on-chain, permissionless claiming |

---

## Key Numbers

| Parameter | Value |
| --- | --- |
| Supported pairs | ETH-PERP, BTC-PERP, SOL-PERP, HYPE-PERP (spot coming soon) |
| Max leverage | 10x |
| Position funding latency | Target under 30 seconds |
| Withdrawal time | 1–2 hours (ZK proving pipeline) |
| Trading fee | 0.05% on open + 0.05% on close |
| Withdrawal fee | $2–5 flat |
| Deposit fee | Free |
