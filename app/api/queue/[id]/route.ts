export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queue";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  const { env } = getRequestContext();
  const { id } = await params;
  const state = await removeFromQueue(env.QUEUE_KV, deviceId, id);
  return NextResponse.json(state);
}
