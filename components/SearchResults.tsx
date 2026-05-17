"use client";

import { Song } from "@/types";

interface Props {
  results: Song[];
  onAdd: (song: Song) => void;
}

export default function SearchResults({ results, onAdd }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {results.map((song) => (
        <button
          key={song.videoId}
          onClick={() => onAdd(song)}
          className="flex items-center gap-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-600 hover:bg-gray-800 transition-colors p-2 text-left group w-full"
        >
          <img
            src={song.thumbnailUrl}
            alt={song.title}
            className="w-20 aspect-video object-cover rounded flex-shrink-0"
          />
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <a
              href={`https://www.youtube.com/watch?v=${song.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-200 text-sm leading-tight line-clamp-2 group-hover:text-white hover:underline"
            >
              {song.title}
            </a>
            <a
              href={`https://www.youtube.com/@${encodeURIComponent(song.channelTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-500 text-xs truncate hover:text-gray-300 hover:underline"
            >
              {song.channelTitle}
            </a>
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 rounded bg-pink-700 text-white text-xs font-semibold group-hover:bg-pink-600 transition-colors mr-1">
            + Add
          </span>
        </button>
      ))}
    </div>
  );
}
