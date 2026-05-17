import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  try {
    const results = await searchYouTube(q);
    return NextResponse.json(results);
  } catch (err: any) {
    const isQuota = err.message?.toLowerCase().includes("quota");
    if (isQuota) {
      return NextResponse.json(
        { error: "quota_exceeded", message: "Search is temporarily unavailable. Please try again in a few hours." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
