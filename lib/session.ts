import { Session } from "@/types";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous O/0/I/1

export function generateSessionId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

// HTTP-proxy KV for local dev (KV_STORE=memory). All calls go to /api/dev-kv
// which is a plain Node.js route with a shared globalThis store — the only way
// to share state across Next.js edge-sandbox route modules in dev.
const DEV_KV_BASE = `${process.env.DEV_SERVER_URL ?? "http://localhost:3000"}/api/dev-kv`;

export const localKV: KVNamespace = {
  async get(key: string) {
    const res = await fetch(`${DEV_KV_BASE}?key=${encodeURIComponent(key)}`);
    const { value } = await res.json() as { value: string | null };
    return value;
  },
  async put(key: string, value: string, opts?: { expirationTtl?: number }) {
    await fetch(DEV_KV_BASE, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, expirationTtl: opts?.expirationTtl }),
    });
  },
  async delete(key: string) {
    await fetch(`${DEV_KV_BASE}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  },
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
