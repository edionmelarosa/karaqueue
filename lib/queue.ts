import { QueueItem, QueueState, Song } from "@/types";

// In-memory singleton — resets on server restart (fine for local use)
let state: QueueState = {
  nowPlaying: null,
  queue: [],
};

export function getQueue(): QueueState {
  return state;
}

export function addToQueue(song: Song): QueueState {
  const item: QueueItem = {
    id: crypto.randomUUID(),
    song,
    addedAt: Date.now(),
  };

  if (state.nowPlaying === null) {
    state = { ...state, nowPlaying: item };
  } else {
    state = { ...state, queue: [...state.queue, item] };
  }

  return state;
}

export function advanceQueue(): QueueState {
  const [next, ...rest] = state.queue;
  state = {
    nowPlaying: next ?? null,
    queue: rest,
  };
  return state;
}

export function removeFromQueue(id: string): QueueState {
  state = { ...state, queue: state.queue.filter((item) => item.id !== id) };
  return state;
}

export function playNow(id: string): QueueState {
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  // Put current nowPlaying back at front of queue (if any), then play selected
  const remaining = state.queue.filter((i) => i.id !== id);
  const requeued = state.nowPlaying ? [state.nowPlaying, ...remaining] : remaining;
  state = { nowPlaying: item, queue: requeued };
  return state;
}
