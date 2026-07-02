// ============================================================
// POST /api/search — Multi-engine search
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSearchAggregator } from "@/lib/search";

export async function POST(req: NextRequest) {
  try {
    const { query, engines, maxResults, searchDepth } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const aggregator = getSearchAggregator();
    const results = await aggregator.search(query, {
      engines,
      maxResults: maxResults || 20,
      searchDepth: searchDepth || "advanced",
    });

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
