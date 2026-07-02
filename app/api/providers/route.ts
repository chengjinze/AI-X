// ============================================================
// GET /api/providers — List available AI providers & models
// ============================================================

import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/ai";

export async function GET() {
  try {
    const providers = getAvailableProviders();
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
