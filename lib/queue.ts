import { QueueItem, QueueState, Song } from "@/types";
import { localKV } from "@/lib/session";

async function getKV(): Promise<KVNamespace> {
  if (process.env.KV_STORE === "memory") return localKV;
  const { getRequestContext } = await import("@cloudflare/next-on-pages");
  return getRequestContext().env.QUEUE_KV;
}

function kvKey(sessionId: string) {
  return `queue_state:${sessionId}`;
}

async function readState(kv: KVNamespace, sessionId: string): Promise<QueueState> {
  const raw = await kv.get(kvKey(sessionId));
  if (!raw) return { nowPlaying: null, queue: [] };
  return JSON.parse(raw) as QueueState;
}

async function writeState(kv: KVNamespace, sessionId: string, state: QueueState): Promise<void> {
  await kv.put(kvKey(sessionId), JSON.stringify(state), { expirationTtl: 86400 });
}

export async function getQueue(sessionId: string): Promise<QueueState> {
  return readState(await getKV(), sessionId);
}

export async function addToQueue(sessionId: string, song: Song): Promise<QueueState> {
  const kv = await getKV();
  const state = await readState(kv, sessionId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const next = state.nowPlaying === null
    ? { ...state, nowPlaying: { ...item, startedAt: Date.now() } }
    : { ...state, queue: [...state.queue, item] };
  await writeState(kv, sessionId, next);
  return next;
}

export async function advanceQueue(sessionId: string): Promise<QueueState> {
  const kv = await getKV();
  const state = await readState(kv, sessionId);
  const [next, ...rest] = state.queue;
  const nowPlaying = next ? { ...next, startedAt: Date.now() } : null;
  const updated = { nowPlaying, queue: rest };
  await writeState(kv, sessionId, updated);
  return updated;
}

export async function removeFromQueue(sessionId: string, id: string): Promise<QueueState> {
  const kv = await getKV();
  const state = await readState(kv, sessionId);
  const updated = { ...state, queue: state.queue.filter((item) => item.id !== id) };
  await writeState(kv, sessionId, updated);
  return updated;
}

export async function playNow(sessionId: string, id: string): Promise<QueueState> {
  const kv = await getKV();
  const state = await readState(kv, sessionId);
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  const updated = { nowPlaying: { ...item, startedAt: Date.now() }, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, sessionId, updated);
  return updated;
}

export async function playSongNow(sessionId: string, song: Song): Promise<QueueState> {
  const kv = await getKV();
  const state = await readState(kv, sessionId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now(), startedAt: Date.now() };
  const updated = { ...state, nowPlaying: item };
  await writeState(kv, sessionId, updated);
  return updated;
}
