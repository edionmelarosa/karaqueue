import { NextRequest, NextResponse } from "next/server";
import { playSongNow } from "@/lib/queue";
import { Song } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const song: Song = body?.song;
  if (!song?.videoId || !song?.title) {
    return NextResponse.json({ error: "Invalid song" }, { status: 400 });
  }
  return NextResponse.json(playSongNow(song));
}
