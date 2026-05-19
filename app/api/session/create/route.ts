export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createSession, localKV } from "@/lib/session";

async function getKV(): Promise<KVNamespace> {
  if (process.env.KV_STORE === "memory") return localKV;
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env.QUEUE_KV;
}

export async function POST(req: NextRequest) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  const session = await createSession(await getKV(), deviceId);
  return NextResponse.json({ sessionId: session.id, memberCount: session.members.length });
}
