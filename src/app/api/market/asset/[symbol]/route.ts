import { NextRequest, NextResponse } from "next/server";
import { MarketDataProvider } from "@/lib/market/providers";
import { getAssetBySymbolOrId } from "@/lib/market/catalog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawSymbol = resolvedParams.symbol;
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "1D";

    const baseAsset = getAssetBySymbolOrId(rawSymbol);
    if (!baseAsset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const liveAsset = await MarketDataProvider.getLiveAsset(baseAsset.symbol);
    const history = await MarketDataProvider.getHistoricalData(baseAsset.symbol, timeframe);

    return NextResponse.json({
      success: true,
      asset: liveAsset || baseAsset,
      history,
    });
  } catch (error) {
    console.error("API /api/market/asset error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch asset details" }, { status: 500 });
  }
}
