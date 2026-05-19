export type Session = {
  id: string;
  hostDeviceId: string;
  createdAt: number;
  expiresAt: number;
  members: string[];
};

export type Song = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
};

export type QueueItem = {
  id: string;
  song: Song;
  addedAt: number;
  startedAt?: number;
};

export type QueueState = {
  nowPlaying: QueueItem | null;
  queue: QueueItem[];
};
