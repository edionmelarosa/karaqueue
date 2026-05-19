// Local-dev KV proxy. Shares in-memory state across edge-sandboxed route
// modules in `next dev` via a module-level Map (the edge sandbox reuses
// the same module instance per dev-server process). Never called in
// production — real Cloudflare KV bindings are used there (KV_STORE is unset).
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";

type Entry = { value: string; expiresAt: number };

// Module-level store: survives across requests within the same dev-server
// process because Next.js edge mode reuses module instances in development.
const store = new Map<string, Entry>();

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return NextResponse.json({ value: null });
  }
  return NextResponse.json({ value: entry.value });
}

export async function PUT(req: NextRequest) {
  const { key, value, expirationTtl } = await req.json() as {
    key: string;
    value: string;
    expirationTtl?: number;
  };
  if (!key || value === undefined) return NextResponse.json({ error: "Missing key/value" }, { status: 400 });
  const ttlMs = (expirationTtl ?? 86400) * 1000;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  store.delete(key);
  return NextResponse.json({ ok: true });
}
