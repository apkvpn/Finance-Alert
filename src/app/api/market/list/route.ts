import { NextRequest, NextResponse } from "next/server";
import { searchAssets } from "@/lib/market/catalog";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const type = (searchParams.get("type") || "all") as "all" | "crypto" | "forex";
    const category = searchParams.get("category") || undefined;
    const sortBy = (searchParams.get("sortBy") || "rank") as any;
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = searchAssets({
      query,
      type,
      category,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.assets,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      },
    });
  } catch (error) {
    console.error("API /api/market/list error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch market assets" }, { status: 500 });
  }
}
