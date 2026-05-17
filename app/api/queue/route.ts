export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getQueue, addToQueue } from "@/lib/queue";
import { Song } from "@/types";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET() {
  const { env } = getRequestContext();
  return NextResponse.json(await getQueue(env.QUEUE_KV));
}

export async function POST(req: NextRequest) {
  const { env } = getRequestContext();
  const body = (await req.json().catch(() => null)) as { song?: Song } | null;
  const song = body?.song as Song | undefined;

  if (!song?.videoId || !song?.title) {
    return NextResponse.json({ error: "Invalid song" }, { status: 400 });
  }

  const state = await addToQueue(env.QUEUE_KV, song);
  return NextResponse.json(state);
}
