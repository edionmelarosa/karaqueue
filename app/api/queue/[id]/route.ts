import { NextRequest, NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queue";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = removeFromQueue(id);
  return NextResponse.json(state);
}
