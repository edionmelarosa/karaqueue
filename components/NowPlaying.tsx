"use client";

import { QueueItem } from "@/types";

interface Props {
  nowPlaying: QueueItem | null;
  onSkip?: () => void;
  compact?: boolean;
}

export default function NowPlaying({ nowPlaying, onSkip, compact }: Props) {
  if (compact) {
    if (!nowPlaying) return null;
    return (
      <div className="flex items-center gap-2 min-w-0 flex-shrink overflow-hidden">
        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 flex-shrink-0 hidden sm:block">
          Now Playing
        </span>
        <img
          src={nowPlaying.song.thumbnailUrl}
          alt={nowPlaying.song.title}
          className="w-10 h-7 object-cover rounded ring-1 ring-pink-500 flex-shrink-0"
        />
        <span className="text-white text-xs font-medium truncate max-w-[160px] md:max-w-[260px] animate-pulse">
          {nowPlaying.song.title}
        </span>
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
          >
            Skip ›
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-pink-400">
        Now Playing
      </h2>
      {nowPlaying ? (
        <div className="flex gap-3 items-start">
          <a
            href={`https://www.youtube.com/watch?v=${nowPlaying.song.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img
              src={nowPlaying.song.thumbnailUrl}
              alt={nowPlaying.song.title}
              className="w-20 h-14 object-cover rounded ring-2 ring-pink-500 shadow-[0_0_12px_#ff006e] hover:ring-pink-400 transition-shadow"
            />
          </a>
          <div className="overflow-hidden flex-1">
            <a
              href={`https://www.youtube.com/watch?v=${nowPlaying.song.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold text-sm leading-tight line-clamp-2 animate-pulse hover:underline block"
            >
              {nowPlaying.song.title}
            </a>
            <a
              href={`https://www.youtube.com/@${encodeURIComponent(nowPlaying.song.channelTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-xs mt-1 hover:text-gray-200 hover:underline block"
            >
              {nowPlaying.song.channelTitle}
            </a>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm italic">Nothing playing</p>
      )}
      {nowPlaying && onSkip && (
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
