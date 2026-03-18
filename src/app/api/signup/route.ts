import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/hyperliquid";

// In-memory store for now. Replace with Supabase in Phase 4.
const signups: Array<{
  address: string;
  email: string | null;
  volumeRange: string;
  createdAt: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, email, volumeRange } = body;

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: "Valid wallet address required." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Check for duplicate
    const exists = signups.some(
      (s) => s.address.toLowerCase() === address.toLowerCase()
    );
    if (exists) {
      return NextResponse.json({
        message: "You're already on the list. We'll be in touch.",
      });
    }

    signups.push({
      address: address.toLowerCase(),
      email: email || null,
      volumeRange: volumeRange || "not specified",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "You're in. We'll reach out when your slot opens.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
