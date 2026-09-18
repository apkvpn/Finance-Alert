import { NextRequest, NextResponse } from "next/server";
import { searchAssets } from "@/lib/market/catalog";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const result = searchAssets({
      query,
      limit,
      page: 1,
    });

    return NextResponse.json({
      success: true,
      data: result.assets,
    });
  } catch (error) {
    console.error("API /api/market/search error:", error);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
