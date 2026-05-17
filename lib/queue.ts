import { QueueItem, QueueState, Song } from "@/types";

const KV_KEY = "queue_state";

async function readState(kv: KVNamespace): Promise<QueueState> {
  const raw = await kv.get(KV_KEY);
  if (!raw) return { nowPlaying: null, queue: [] };
  return JSON.parse(raw) as QueueState;
}

async function writeState(kv: KVNamespace, state: QueueState): Promise<void> {
  await kv.put(KV_KEY, JSON.stringify(state));
}

export async function getQueue(kv: KVNamespace): Promise<QueueState> {
  return readState(kv);
}

export async function addToQueue(kv: KVNamespace, song: Song): Promise<QueueState> {
  const state = await readState(kv);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const next =
    state.nowPlaying === null
      ? { ...state, nowPlaying: item }
      : { ...state, queue: [...state.queue, item] };
  await writeState(kv, next);
  return next;
}

export async function advanceQueue(kv: KVNamespace): Promise<QueueState> {
  const state = await readState(kv);
  const [next, ...rest] = state.queue;
  const updated = { nowPlaying: next ?? null, queue: rest };
  await writeState(kv, updated);
  return updated;
}

export async function removeFromQueue(kv: KVNamespace, id: string): Promise<QueueState> {
  const state = await readState(kv);
  const updated = { ...state, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, updated);
  return updated;
}

export async function playNow(kv: KVNamespace, id: string): Promise<QueueState> {
  const state = await readState(kv);
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  const updated = { nowPlaying: item, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, updated);
  return updated;
}

export async function playSongNow(kv: KVNamespace, song: Song): Promise<QueueState> {
  const state = await readState(kv);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const updated = { ...state, nowPlaying: item };
  await writeState(kv, updated);
  return updated;
}
