import { Session } from "@/types";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous O/0/I/1

export function generateSessionId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

// In-memory fallback used in local dev (no Cloudflare KV available).
// Uses globalThis so the store survives hot-module reloads and is shared
// across all route modules within the same Node.js process.
declare global {
  // eslint-disable-next-line no-var
  var __kqMemStore: Map<string, { value: string; expiresAt: number }> | undefined;
}
if (!globalThis.__kqMemStore) {
  globalThis.__kqMemStore = new Map();
}
const memStore = globalThis.__kqMemStore;

export const localKV: KVNamespace = {
  async get(key: string) {
    const entry = memStore.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      memStore.delete(key);
      return null;
    }
    return entry.value;
  },
  async put(key: string, value: string, opts?: { expirationTtl?: number }) {
    const ttlMs = (opts?.expirationTtl ?? SESSION_TTL_MS / 1000) * 1000;
    memStore.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  async delete(key: string) { memStore.delete(key); },
  async list() { return { keys: [], list_complete: true, cacheStatus: null }; },
  async getWithMetadata(key: string) {
    const value = await localKV.get(key);
    return { value, metadata: null, cacheStatus: null };
  },
} as unknown as KVNamespace;

/** @deprecated Use localKV directly */
export function getLocalKV(): KVNamespace { return localKV; }

function sessionKey(id: string) {
  return `session:${id}`;
}

export async function createSession(kv: KVNamespace, hostDeviceId: string): Promise<Session> {
  const id = generateSessionId();
  const now = Date.now();
  const session: Session = {
    id,
    hostDeviceId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    members: [hostDeviceId],
  };
  await kv.put(sessionKey(id), JSON.stringify(session), { expirationTtl: SESSION_TTL_MS / 1000 });
  return session;
}

export async function getSession(kv: KVNamespace, id: string): Promise<Session | null> {
  const raw = await kv.get(sessionKey(id));
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  if (Date.now() > session.expiresAt) return null;
  return session;
}

export async function joinSession(kv: KVNamespace, id: string, deviceId: string): Promise<Session | null> {
  const session = await getSession(kv, id);
  if (!session) return null;
  if (!session.members.includes(deviceId)) {
    session.members.push(deviceId);
    const ttlMs = session.expiresAt - Date.now();
    if (ttlMs <= 0) return null;
    await kv.put(sessionKey(id), JSON.stringify(session), { expirationTtl: Math.floor(ttlMs / 1000) });
  }
  return session;
}
