import { NextResponse } from "next/server";
import { NewsProvider } from "@/lib/market/providers";

export async function GET() {
  try {
    const news = await NewsProvider.getLatestNews();
    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error("API /api/market/news error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}
