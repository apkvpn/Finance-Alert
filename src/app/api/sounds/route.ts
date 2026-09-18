import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customSounds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BUILTIN_SOUNDS, validateCustomAudioFile } from "@/lib/alerts/sounds";

function getAnonUserId(req: NextRequest): string {
  return (
    req.headers.get("x-anon-user-id") ||
    req.headers.get("anon-user-id") ||
    req.cookies.get("finance_alert_anon_id")?.value ||
    "default_anon_user"
  );
}

export async function GET(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const userSounds = await db.select().from(customSounds).where(eq(customSounds.anonUserId, anonUserId));

    const formattedCustom = userSounds.map((s) => ({
      id: s.id,
      name: s.name,
      category: "custom" as const,
      description: `${(s.sizeBytes / 1024).toFixed(1)} KB audio file`,
      audioData: s.audioData,
    }));

    return NextResponse.json({
      success: true,
      data: [...BUILTIN_SOUNDS, ...formattedCustom],
    });
  } catch (error) {
    console.error("API GET /api/sounds error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sounds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();
    const { name, mimeType, audioData, sizeBytes } = body;

    if (!name || !audioData || !mimeType) {
      return NextResponse.json({ success: false, error: "Missing audio upload parameters" }, { status: 400 });
    }

    // Size limit check: max 5MB base64
    if (sizeBytes && sizeBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Audio size exceeds 5MB limit" }, { status: 400 });
    }

    const soundId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [created] = await db
      .insert(customSounds)
      .values({
        id: soundId,
        anonUserId,
        name: name.substring(0, 32),
        mimeType,
        audioData,
        sizeBytes: sizeBytes || Math.round(audioData.length * 0.75),
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        name: created.name,
        category: "custom",
        description: `${(created.sizeBytes / 1024).toFixed(1)} KB custom upload`,
        audioData: created.audioData,
      },
    });
  } catch (error) {
    console.error("API POST /api/sounds error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload custom sound" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !id.startsWith("custom_")) {
      return NextResponse.json({ success: false, error: "Invalid custom sound ID" }, { status: 400 });
    }

    await db.delete(customSounds).where(and(eq(customSounds.id, id), eq(customSounds.anonUserId, anonUserId)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("API DELETE /api/sounds error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete sound" }, { status: 500 });
  }
}
