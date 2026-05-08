"use client";

import { QueueItem } from "@/types";

interface Props {
  nowPlaying: QueueItem | null;
  onSkip: () => void;
}

export default function NowPlaying({ nowPlaying, onSkip }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-pink-400">
        Now Playing
      </h2>
      {nowPlaying ? (
        <div className="flex gap-3 items-start">
          <img
            src={nowPlaying.song.thumbnailUrl}
            alt={nowPlaying.song.title}
            className="w-20 h-14 object-cover rounded flex-shrink-0 ring-2 ring-pink-500 shadow-[0_0_12px_#ff006e]"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-white font-semibold text-sm leading-tight line-clamp-2 animate-pulse">
              {nowPlaying.song.title}
            </p>
            <p className="text-gray-400 text-xs mt-1">{nowPlaying.song.channelTitle}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm italic">Nothing playing</p>
      )}
      {nowPlaying && (
        <button
          onClick={onSkip}
          className="self-start text-xs px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
        >
          Skip ›
        </button>
      )}
    </div>
  );
}
