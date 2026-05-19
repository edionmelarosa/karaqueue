export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSession, localKV } from "@/lib/session";

async function getKV(): Promise<KVNamespace> {
  if (process.env.KV_STORE === "memory") return localKV;
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env.QUEUE_KV;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deviceId = req.headers.get("X-Device-Id");
  const session = await getSession(await getKV(), id);
  if (!session) return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });

  return NextResponse.json({
    sessionId: session.id,
    hostDeviceId: session.hostDeviceId,
    memberCount: session.members.length,
    isHost: deviceId === session.hostDeviceId,
  });
}
