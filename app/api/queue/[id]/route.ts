import { NextRequest, NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queue";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = req.headers.get("X-Session-Id") ?? "";
  return NextResponse.json(removeFromQueue(sessionId, id));
}
