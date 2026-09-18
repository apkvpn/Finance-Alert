import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");

    let query = db.select().from(notes).where(eq(notes.anonUserId, anonUserId)).orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    const userNotes = await query;
    let filtered = userNotes;

    if (symbol) {
      filtered = userNotes.filter((n) => n.relatedSymbol?.toUpperCase() === symbol.toUpperCase());
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("API GET /api/notes error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();

    const { title, content, relatedSymbol, relatedAlertId, isPinned = false } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(notes)
      .values({
        id: noteId,
        anonUserId,
        title,
        content,
        relatedSymbol: relatedSymbol ? relatedSymbol.toUpperCase() : null,
        relatedAlertId: relatedAlertId || null,
        isPinned: Boolean(isPinned),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("API POST /api/notes error:", error);
    return NextResponse.json({ success: false, error: "Failed to create note" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();
    const { id, title, content, isPinned, relatedSymbol, relatedAlertId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Note ID is required" }, { status: 400 });
    }

    const updateFields: any = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (isPinned !== undefined) updateFields.isPinned = Boolean(isPinned);
    if (relatedSymbol !== undefined) updateFields.relatedSymbol = relatedSymbol ? relatedSymbol.toUpperCase() : null;
    if (relatedAlertId !== undefined) updateFields.relatedAlertId = relatedAlertId || null;

    const [updated] = await db
      .update(notes)
      .set(updateFields)
      .where(and(eq(notes.id, id), eq(notes.anonUserId, anonUserId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("API PUT /api/notes error:", error);
    return NextResponse.json({ success: false, error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Note ID required" }, { status: 400 });
    }

    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.anonUserId, anonUserId)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("API DELETE /api/notes error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete note" }, { status: 500 });
  }
}
