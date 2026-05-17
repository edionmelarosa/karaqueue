export const runtime = 'edge';

import { NextResponse } from "next/server";
import { advanceQueue } from "@/lib/queue";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST() {
  const { env } = getRequestContext();
  const state = await advanceQueue(env.QUEUE_KV);
  return NextResponse.json(state);
}
