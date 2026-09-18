import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, alertHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAssetBySymbolOrId } from "@/lib/market/catalog";
import { MarketDataProvider } from "@/lib/market/providers";

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
    const status = searchParams.get("status"); // 'ACTIVE' | 'TRIGGERED' | 'DISABLED'

    let query = db.select().from(alerts).where(eq(alerts.anonUserId, anonUserId)).orderBy(desc(alerts.createdAt));

    const userAlerts = await query;

    // Fetch live market price for each alert asset to calculate real-time distance
    const symbols = userAlerts.map((a) => a.assetSymbol);
    const livePrices = await MarketDataProvider.getBatchLiveAssets(symbols);

    const enriched = userAlerts.map((alert) => ({
      ...alert,
      currentPrice: livePrices.get(alert.assetSymbol.toUpperCase()) || alert.currentPrice || alert.initialPrice,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("API GET /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();

    const {
      assetSymbol,
      condition, // 'ABOVE' | 'BELOW' | 'REACHES'
      targetPrice,
      soundId = "classic_bell",
      soundVolume = 0.8,
      note = "",
    } = body;

    if (!assetSymbol || !condition || !targetPrice) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: assetSymbol, condition, targetPrice" },
        { status: 400 }
      );
    }

    const baseAsset = getAssetBySymbolOrId(assetSymbol);
    const liveAsset = baseAsset ? await MarketDataProvider.getLiveAsset(baseAsset.symbol) : null;
    const currentPrice = liveAsset?.price || baseAsset?.price || targetPrice;

    const newAlertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(alerts)
      .values({
        id: newAlertId,
        anonUserId,
        assetSymbol: baseAsset?.symbol || assetSymbol.toUpperCase(),
        assetName: baseAsset?.name || assetSymbol,
        assetLogo: baseAsset?.logo || "",
        assetType: baseAsset?.type || "crypto",
        condition,
        targetPrice: parseFloat(targetPrice),
        initialPrice: currentPrice,
        previousPrice: currentPrice,
        currentPrice: currentPrice,
        soundId,
        soundVolume: parseFloat(soundVolume),
        status: "ACTIVE",
        internalState: "EVALUATING",
        triggerCount: 0,
        note: note || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("API POST /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to create alert" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const body = await req.json();
    const { id, status, targetPrice, condition, soundId, soundVolume, note, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Alert ID required" }, { status: 400 });
    }

    // Handle RE-ARM action
    if (action === "rearm") {
      const [existing] = await db.select().from(alerts).where(and(eq(alerts.id, id), eq(alerts.anonUserId, anonUserId)));
      if (!existing) {
        return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
      }

      const liveAsset = await MarketDataProvider.getLiveAsset(existing.assetSymbol);
      const currentP = liveAsset?.price || existing.currentPrice || existing.targetPrice;

      const [updated] = await db
        .update(alerts)
        .set({
          status: "ACTIVE",
          internalState: "EVALUATING",
          previousPrice: currentP,
          currentPrice: currentP,
          updatedAt: new Date(),
        })
        .where(and(eq(alerts.id, id), eq(alerts.anonUserId, anonUserId)))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    }

    // General Alert Update
    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (targetPrice) updateData.targetPrice = parseFloat(targetPrice);
    if (condition) updateData.condition = condition;
    if (soundId) updateData.soundId = soundId;
    if (soundVolume !== undefined) updateData.soundVolume = parseFloat(soundVolume);
    if (note !== undefined) updateData.note = note;

    const [updated] = await db
      .update(alerts)
      .set(updateData)
      .where(and(eq(alerts.id, id), eq(alerts.anonUserId, anonUserId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("API PUT /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Alert ID required" }, { status: 400 });
    }

    await db.delete(alerts).where(and(eq(alerts.id, id), eq(alerts.anonUserId, anonUserId)));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("API DELETE /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete alert" }, { status: 500 });
  }
}
