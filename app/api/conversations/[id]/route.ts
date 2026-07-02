// ============================================================
// GET    /api/conversations/[id] — Get conversation with messages
// PATCH  /api/conversations/[id] — Update conversation
// DELETE /api/conversations/[id] — Delete conversation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import { mockConversations, mockMessages } from "@/lib/mock/conversations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Demo mode: return mock conversation with messages
  if (!isSupabaseConfigured()) {
    const conv = mockConversations.find((c) => c.id === params.id);
    if (!conv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const messages = mockMessages[params.id] || [];
    return NextResponse.json({ ...conv, messages });
  }

  try {
    const conversation = await db.getConversation(params.id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const messages = await db.listMessages(params.id);
    return NextResponse.json({ ...conversation, messages });
  } catch (error) {
    console.error("[conversations/:id] GET error:", error);
    // Fallback to mock
    const conv = mockConversations.find((c) => c.id === params.id);
    if (!conv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const messages = mockMessages[params.id] || [];
    return NextResponse.json({ ...conv, messages });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true }); // No-op in demo mode
  }

  try {
    const updates = await req.json();
    await db.updateConversation(params.id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true }); // No-op in demo mode
  }

  try {
    await db.deleteConversation(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
