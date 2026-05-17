"use client";

import { useEffect, useState } from "react";
import { Song } from "@/types";

interface Props {
  nowPlaying: Song | null;
  onAdd: (song: Song) => void;
  onPlay: (song: Song) => void;
}

const enabled = process.env.NEXT_PUBLIC_RECOMMENDATIONS !== "false";

export default function Recommendations({ nowPlaying, onAdd, onPlay }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !nowPlaying) { setSongs([]); return; }
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      title: nowPlaying.title,
      videoId: nowPlaying.videoId,
    });
    fetch(`/api/recommendations?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (!cancelled) setSongs(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [nowPlaying?.videoId]); // only re-fetch when the song changes, not on every render

  if (!enabled || !nowPlaying) return null;
  if (loading) return (
    <p className="text-[10px] text-gray-600 animate-pulse py-1">Loading recommendations...</p>
  );
  if (songs.length === 0) return null;

  function handleAdd(song: Song) {
    onAdd(song);
    setAdded((prev) => new Set(prev).add(song.videoId));
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1">
        You Might Also Like
      </p>
      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[420px]">
        {songs.map((song) => {
          const isAdded = added.has(song.videoId);
          return (
            <div
              key={song.videoId}
              className="flex items-center gap-2.5 rounded-lg hover:bg-gray-900 transition-colors px-1.5 py-1 group"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={song.thumbnailUrl}
                  alt={song.title}
                  className="w-16 aspect-video object-cover rounded"
                />
                <button
                  onClick={() => onPlay(song)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title="Play now"
                >
                  <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <a
                  href={`https://www.youtube.com/watch?v=${song.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-xs leading-tight line-clamp-2 group-hover:text-white hover:underline"
                >
                  {song.title}
                </a>
                <a
                  href={`https://www.youtube.com/@${encodeURIComponent(song.channelTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 text-[10px] truncate mt-0.5 hover:text-gray-400 hover:underline"
                >
                  {song.channelTitle}
                </a>
              </div>
              <button
                onClick={() => handleAdd(song)}
                disabled={isAdded}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border border-gray-700 text-gray-500 hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                title="Add to queue"
              >
                {isAdded ? "✓" : "+"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
