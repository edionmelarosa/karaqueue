// Node.js-only KV proxy for local dev. No `export const runtime = 'edge'` so
// it runs in the Node.js process where globalThis is shared across all routes.
// @cloudflare/next-on-pages skips this file (not edge runtime) so it is never
// deployed to Cloudflare Pages.
import { NextRequest, NextResponse } from "next/server";

type Entry = { value: string; expiresAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __kqDevStore: Map<string, Entry> | undefined;
}
if (!globalThis.__kqDevStore) globalThis.__kqDevStore = new Map();
const store = globalThis.__kqDevStore;

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
