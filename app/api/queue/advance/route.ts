import { NextRequest, NextResponse } from "next/server";
import { advanceQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("X-Session-Id") ?? "";
  return NextResponse.json(advanceQueue(sessionId));
}
