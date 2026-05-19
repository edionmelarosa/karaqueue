export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { joinSession, localKV } from "@/lib/session";

async function getKV(): Promise<KVNamespace> {
  if (process.env.KV_STORE === "memory") return localKV;
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env.QUEUE_KV;
}

export async function POST(req: NextRequest) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = body?.sessionId?.trim().toUpperCase();
  if (!sessionId) return NextResponse.json({ error: "Missing session ID" }, { status: 400 });

  const session = await joinSession(await getKV(), sessionId, deviceId);
  if (!session) return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });

  return NextResponse.json({
    sessionId: session.id,
    hostDeviceId: session.hostDeviceId,
    memberCount: session.members.length,
  });
}
