import { QueueItem, QueueState, Song } from "@/types";

function kvKey(deviceId: string) {
  return `queue_state:${deviceId}`;
}

async function readState(kv: KVNamespace, deviceId: string): Promise<QueueState> {
  const raw = await kv.get(kvKey(deviceId));
  if (!raw) return { nowPlaying: null, queue: [] };
  return JSON.parse(raw) as QueueState;
}

async function writeState(kv: KVNamespace, deviceId: string, state: QueueState): Promise<void> {
  await kv.put(kvKey(deviceId), JSON.stringify(state));
}

export async function getQueue(kv: KVNamespace, deviceId: string): Promise<QueueState> {
  return readState(kv, deviceId);
}

export async function addToQueue(kv: KVNamespace, deviceId: string, song: Song): Promise<QueueState> {
  const state = await readState(kv, deviceId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const next =
    state.nowPlaying === null
      ? { ...state, nowPlaying: item }
      : { ...state, queue: [...state.queue, item] };
  await writeState(kv, deviceId, next);
  return next;
}

export async function advanceQueue(kv: KVNamespace, deviceId: string): Promise<QueueState> {
  const state = await readState(kv, deviceId);
  const [next, ...rest] = state.queue;
  const updated = { nowPlaying: next ?? null, queue: rest };
  await writeState(kv, deviceId, updated);
  return updated;
}

export async function removeFromQueue(kv: KVNamespace, deviceId: string, id: string): Promise<QueueState> {
  const state = await readState(kv, deviceId);
  const updated = { ...state, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, deviceId, updated);
  return updated;
}

export async function playNow(kv: KVNamespace, deviceId: string, id: string): Promise<QueueState> {
  const state = await readState(kv, deviceId);
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  const updated = { nowPlaying: item, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, deviceId, updated);
  return updated;
}

export async function playSongNow(kv: KVNamespace, deviceId: string, song: Song): Promise<QueueState> {
  const state = await readState(kv, deviceId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const updated = { ...state, nowPlaying: item };
  await writeState(kv, deviceId, updated);
  return updated;
}
