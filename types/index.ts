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
};

export type QueueState = {
  nowPlaying: QueueItem | null;
  queue: QueueItem[];
};
