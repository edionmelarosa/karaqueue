import { NextRequest, NextResponse } from "next/server";
import { playSongNow } from "@/lib/queue";
import { Song } from "@/types";

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("X-Session-Id") ?? "";
  const body = await req.json().catch(() => null) as { song?: Song } | null;
  const song = body?.song;
  if (!song?.videoId || !song?.title) {
    return NextResponse.json({ error: "Invalid song" }, { status: 400 });
  }
  return NextResponse.json(playSongNow(sessionId, song));
}
