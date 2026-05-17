export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { removeFromQueue } from "@/lib/queue";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const { id } = await params;
  const state = await removeFromQueue(env.QUEUE_KV, id);
  return NextResponse.json(state);
}
