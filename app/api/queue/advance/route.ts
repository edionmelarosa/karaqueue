export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { advanceQueue } from "@/lib/queue";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(req: NextRequest) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  const { env } = getRequestContext();
  const state = await advanceQueue(env.QUEUE_KV, deviceId);
  return NextResponse.json(state);
}
