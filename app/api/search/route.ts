import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  try {
    const results = await searchYouTube(q);
    return NextResponse.json(results);
  } catch (err: any) {
    const status = err.message?.includes("quota") ? 429 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
