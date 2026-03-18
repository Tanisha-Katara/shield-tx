import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/hyperliquid";
import { supabase } from "@/lib/supabase";

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

    const normalizedAddress = address.toLowerCase();

    if (supabase) {
      // Use Supabase
      const { error } = await supabase.from("beta_signups").upsert(
        {
          address: normalizedAddress,
          email: email?.trim() || null,
          volume_range: volumeRange || null,
        },
        { onConflict: "address" }
      );

      if (error) {
        console.error("Signup insert error:", error);
        return NextResponse.json(
          { error: "Something went wrong. Try again." },
          { status: 500 }
        );
      }
    } else {
      // No Supabase — log to console as fallback
      console.log("Beta signup (no DB):", { address: normalizedAddress, email, volumeRange });
    }

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
