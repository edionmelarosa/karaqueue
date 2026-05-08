import { NextResponse } from "next/server";
import { advanceQueue } from "@/lib/queue";

export async function POST() {
  const state = advanceQueue();
  return NextResponse.json(state);
}
