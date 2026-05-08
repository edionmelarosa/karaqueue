import { NextRequest, NextResponse } from "next/server";
import { getQueue, addToQueue } from "@/lib/queue";
import { Song } from "@/types";

export async function GET() {
  return NextResponse.json(getQueue());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const song: Song = body?.song;

  if (!song?.videoId || !song?.title) {
    return NextResponse.json({ error: "Invalid song" }, { status: 400 });
  }

  const state = addToQueue(song);
  return NextResponse.json(state);
}
