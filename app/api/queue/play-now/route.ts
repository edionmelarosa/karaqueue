export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { playNow } from "@/lib/queue";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(req: NextRequest) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  const { env } = getRequestContext();
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return NextResponse.json(await playNow(env.QUEUE_KV, deviceId, id));
}
