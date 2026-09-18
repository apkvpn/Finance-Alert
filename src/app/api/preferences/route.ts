import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.anonUserId, anonUserId));

    if (!prefs) {
      return NextResponse.json({
        success: true,
        data: {
          watchlist: [],
          favorites: [],
          theme: "dark",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        watchlist: JSON.parse(prefs.watchlist || "[]"),
        favorites: JSON.parse(prefs.favorites || "[]"),
        theme: prefs.theme || "dark",
      },
    });
  } catch (error) {
    console.error("API GET /api/preferences error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();
    const { watchlist, favorites, theme } = body;

    const existing = await db.select().from(userPreferences).where(eq(userPreferences.anonUserId, anonUserId));

    const watchlistStr = watchlist ? JSON.stringify(watchlist) : "[]";
    const favoritesStr = favorites ? JSON.stringify(favorites) : "[]";
    const themeStr = theme || "dark";

    if (existing.length === 0) {
      await db.insert(userPreferences).values({
        anonUserId,
        watchlist: watchlistStr,
        favorites: favoritesStr,
        theme: themeStr,
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(userPreferences)
        .set({
          watchlist: watchlistStr,
          favorites: favoritesStr,
          theme: themeStr,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.anonUserId, anonUserId));
    }

    return NextResponse.json({
      success: true,
      data: {
        watchlist: watchlist || [],
        favorites: favorites || [],
        theme: themeStr,
      },
    });
  } catch (error) {
    console.error("API POST /api/preferences error:", error);
    return NextResponse.json({ success: false, error: "Failed to save preferences" }, { status: 500 });
  }
}
