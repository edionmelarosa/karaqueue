import { NextRequest, NextResponse } from "next/server";
import { playNow } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return NextResponse.json(playNow(id));
}
