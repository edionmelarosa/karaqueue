import { QueueItem, QueueState, Song } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __kqQueues: Map<string, QueueState> | undefined;
}
if (!globalThis.__kqQueues) {
  globalThis.__kqQueues = new Map();
}
const queues = globalThis.__kqQueues;

const EMPTY: QueueState = { nowPlaying: null, queue: [] };

function get(sessionId: string): QueueState {
  return queues.get(sessionId) ?? EMPTY;
}

function set(sessionId: string, state: QueueState): QueueState {
  queues.set(sessionId, state);
  return state;
}

export function getQueue(sessionId: string): QueueState {
  return get(sessionId);
}

export function addToQueue(sessionId: string, song: Song): QueueState {
  const state = get(sessionId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  if (state.nowPlaying === null) {
    return set(sessionId, { ...state, nowPlaying: { ...item, startedAt: Date.now() } });
  }
  return set(sessionId, { ...state, queue: [...state.queue, item] });
}

export function advanceQueue(sessionId: string): QueueState {
  const state = get(sessionId);
  const [next, ...rest] = state.queue;
  const nowPlaying = next ? { ...next, startedAt: Date.now() } : null;
  return set(sessionId, { nowPlaying, queue: rest });
}

export function removeFromQueue(sessionId: string, id: string): QueueState {
  const state = get(sessionId);
  return set(sessionId, { ...state, queue: state.queue.filter((item) => item.id !== id) });
}

export function playNow(sessionId: string, id: string): QueueState {
  const state = get(sessionId);
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  return set(sessionId, { nowPlaying: { ...item, startedAt: Date.now() }, queue: state.queue.filter((i) => i.id !== id) });
}

export function playSongNow(sessionId: string, song: Song): QueueState {
  const state = get(sessionId);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now(), startedAt: Date.now() };
  return set(sessionId, { ...state, nowPlaying: item });
}
