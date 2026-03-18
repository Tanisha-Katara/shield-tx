import { ClearinghouseState, Fill } from "./types";

const HL_API_URL = "https://api.hyperliquid.xyz/info";

async function hlPost<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(HL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HL API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getClearinghouseState(
  address: string
): Promise<ClearinghouseState> {
  return hlPost<ClearinghouseState>({
    type: "clearinghouseState",
    user: address,
  });
}

export async function getUserFills(address: string): Promise<Fill[]> {
  return hlPost<Fill[]>({
    type: "userFills",
    user: address,
  });
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
