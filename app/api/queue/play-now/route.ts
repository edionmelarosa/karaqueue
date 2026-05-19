import { NextRequest, NextResponse } from "next/server";
import { playNow } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("X-Session-Id") ?? "";
  const body = await req.json().catch(() => ({})) as { id?: string };
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return NextResponse.json(playNow(sessionId, id));
}
