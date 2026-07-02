// ============================================================
// GET /api/conversations — List all conversations
// POST /api/conversations — Create new conversation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import { mockConversations } from "@/lib/mock/conversations";

export async function GET() {
  // When Supabase is not configured, return mock data for demo
  if (!isSupabaseConfigured()) {
    return NextResponse.json(mockConversations);
  }

  try {
    const conversations = await db.listConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[conversations] GET error:", error);
    // Fallback to mock data on error
    return NextResponse.json(mockConversations);
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured. Running in demo mode — conversations are read-only." },
      { status: 503 }
    );
  }

  try {
    const { title, mode, provider, model } = await req.json();
    const conversation = await db.createConversation(
      title || "New Research",
      mode || "normal",
      provider || "openai",
      model || "gpt-4o"
    );
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create conversation" },
      { status: 500 }
    );
  }
}
