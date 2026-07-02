// ============================================================
// POST /api/files/upload — File upload
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const conversationId = formData.get("conversationId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: "No conversationId provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await db.uploadFile(conversationId, {
      name: file.name,
      size: file.size,
      type: file.type,
      buffer,
    });

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
