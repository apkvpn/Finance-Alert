import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, alertHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { MarketDataProvider } from "@/lib/market/providers";
import { processAlertEvaluation } from "@/lib/alerts/engine";

function getAnonUserId(req: NextRequest): string {
  return (
    req.headers.get("x-anon-user-id") ||
    req.headers.get("anon-user-id") ||
    req.cookies.get("finance_alert_anon_id")?.value ||
    "default_anon_user"
  );
}

export async function POST(req: NextRequest) {
  try {
    const anonUserId = getAnonUserId(req);

    // Get all ACTIVE alerts for user
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.anonUserId, anonUserId), eq(alerts.status, "ACTIVE")));

    if (activeAlerts.length === 0) {
      return NextResponse.json({ success: true, triggeredCount: 0, triggeredAlerts: [] });
    }

    // Collect symbols and fetch live market prices
    const symbols = activeAlerts.map((a) => a.assetSymbol);
    const livePrices = await MarketDataProvider.getBatchLiveAssets(symbols);

    const newlyTriggeredAlerts: any[] = [];

    for (const alertRec of activeAlerts) {
      const livePrice = livePrices.get(alertRec.assetSymbol.toUpperCase());
      if (!livePrice) continue;

      const evalResult = processAlertEvaluation(
        {
          ...alertRec,
          assetType: (alertRec.assetType === "forex" ? "forex" : "crypto") as "crypto" | "forex",
          condition: alertRec.condition as any,
          status: alertRec.status as any,
          internalState: alertRec.internalState as any,
          createdAt: alertRec.createdAt,
          updatedAt: alertRec.updatedAt,
        },
        livePrice
      );

      // Update evaluation state in DB
      if (evalResult.isTriggered) {
        newlyTriggeredAlerts.push({
          ...alertRec,
          triggeredPrice: livePrice,
          triggeredAt: new Date().toISOString(),
        });

        // Mark as TRIGGERED
        await db
          .update(alerts)
          .set({
            status: "TRIGGERED",
            internalState: "NOTIFICATION_DELIVERED",
            previousPrice: evalResult.previousPrice,
            currentPrice: livePrice,
            triggeredAt: new Date(),
            lastEvaluatedAt: new Date(),
            triggerCount: alertRec.triggerCount + 1,
            idempotencyKey: evalResult.idempotencyKey,
            updatedAt: new Date(),
          })
          .where(eq(alerts.id, alertRec.id));

        // Insert into alert history
        await db.insert(alertHistory).values({
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          alertId: alertRec.id,
          anonUserId: alertRec.anonUserId,
          triggerPrice: livePrice,
          targetPrice: alertRec.targetPrice,
          condition: alertRec.condition,
          triggeredAt: new Date(),
          message: evalResult.message || "Alert condition met",
        });
      } else {
        // Just update price and evaluation timestamp
        await db
          .update(alerts)
          .set({
            previousPrice: livePrice,
            currentPrice: livePrice,
            lastEvaluatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(alerts.id, alertRec.id));
      }
    }

    return NextResponse.json({
      success: true,
      evaluatedCount: activeAlerts.length,
      triggeredCount: newlyTriggeredAlerts.length,
      triggeredAlerts: newlyTriggeredAlerts,
    });
  } catch (error) {
    console.error("API POST /api/alerts/evaluate error:", error);
    return NextResponse.json({ success: false, error: "Alert evaluation failed" }, { status: 500 });
  }
}
