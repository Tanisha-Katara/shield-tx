import { NextRequest, NextResponse } from "next/server";
import { getClearinghouseState, getUserFills, isValidAddress } from "@/lib/hyperliquid";
import { analyzeExposure } from "@/lib/correlation";

const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { address } = body;

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: "Invalid address. Expected 0x followed by 40 hex characters." },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // Check cache
    const cached = cache.get(normalizedAddress);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Fetch data from HL in parallel
    const [state, fills] = await Promise.all([
      getClearinghouseState(normalizedAddress),
      getUserFills(normalizedAddress),
    ]);

    // Run heuristic analysis
    const result = analyzeExposure(state, fills);

    // Cache the result
    cache.set(normalizedAddress, {
      data: result,
      expires: Date.now() + CACHE_TTL,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Wallet check error:", error);
    return NextResponse.json(
      { error: "Failed to analyze wallet. The address may not have HL activity." },
      { status: 500 }
    );
  }
}
