export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queue";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionId = req.headers.get("X-Session-Id") ?? "";
  const { id } = await params;
  return NextResponse.json(await removeFromQueue(sessionId, id));
}
