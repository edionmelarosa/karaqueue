import { NextRequest, NextResponse } from "next/server";
import { createSession, getLocalKV } from "@/lib/session";

async function getKV(): Promise<KVNamespace> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    return getRequestContext().env.QUEUE_KV;
  } catch {
    return getLocalKV();
  }
}

export async function POST(req: NextRequest) {
  const deviceId = req.headers.get("X-Device-Id");
  if (!deviceId) return NextResponse.json({ error: "Missing device ID" }, { status: 400 });
  const session = await createSession(await getKV(), deviceId);
  return NextResponse.json({ sessionId: session.id, memberCount: session.members.length });
}
