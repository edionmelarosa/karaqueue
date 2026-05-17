"use client";

import { useEffect, useState, useCallback } from "react";
import YouTubePlayer from "@/components/YouTubePlayer";
import NowPlaying from "@/components/NowPlaying";
import QueuePanel from "@/components/QueuePanel";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import Recommendations from "@/components/Recommendations";
import AdUnit from "@/components/AdUnit";
import { QueueState, Song } from "@/types";

const EMPTY_STATE: QueueState = { nowPlaying: null, queue: [] };

export default function Home() {
  const [queueState, setQueueState] = useState<QueueState>(EMPTY_STATE);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/queue");
    if (res.ok) setQueueState(await res.json());
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 2000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  async function handleSearch(query: string) {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.status === 429) throw new Error(data.message ?? "quota_exceeded");
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setSearchResults(data);
    } catch (e: any) {
      setSearchError(e.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleClearSearch() {
    setSearchResults([]);
    setSearchError(null);
  }

  async function handleAdd(song: Song) {
    const res = await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song }),
    });
    if (res.ok) {
      setQueueState(await res.json());
      handleClearSearch();
    }
  }

  async function handleAdvance() {
    const res = await fetch("/api/queue/advance", { method: "POST" });
    if (res.ok) setQueueState(await res.json());
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/queue/${id}`, { method: "DELETE" });
    if (res.ok) setQueueState(await res.json());
  }

  async function handlePlayNow(id: string) {
    const res = await fetch("/api/queue/play-now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setQueueState(await res.json());
  }

  async function handlePlaySong(song: Song) {
    const res = await fetch("/api/queue/play-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song }),
    });
    if (res.ok) setQueueState(await res.json());
  }

  const videoId = queueState.nowPlaying?.song.videoId ?? null;
  const hasResults = searchResults.length > 0;

  return (
    <div className="min-h-screen md:h-screen bg-[#0a0a0f] text-white flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 flex-shrink-0 min-w-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_8px_#00d4ff] flex-shrink-0">
          KaraQueue
        </h1>
        <span className="text-gray-600 text-sm flex-shrink-0">•</span>
        <span className="text-gray-500 text-xs md:text-sm truncate min-w-0">
          {queueState.queue.length > 0
            ? `${queueState.queue.length} song${queueState.queue.length !== 1 ? "s" : ""} in queue`
            : "Queue empty"}
        </span>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row md:flex-1 md:min-h-0 md:overflow-hidden">
        {/* Player — top on mobile, left column on desktop */}
        <div className="flex flex-col p-4 gap-3 min-w-0 md:flex-1">
          <YouTubePlayer videoId={videoId} onEnded={handleAdvance} />
          {process.env.NEXT_PUBLIC_ADSENSE_SLOT && (
            <AdUnit
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
              format="horizontal"
              className="w-full"
            />
          )}
          {queueState.nowPlaying && (
            <div className="overflow-hidden whitespace-nowrap bg-gray-900 rounded px-3 py-1.5 border border-gray-800">
              <p className="inline-block animate-[marquee_20s_linear_infinite] text-cyan-400 text-sm font-medium">
                ♪&nbsp;&nbsp;{queueState.nowPlaying.song.title}&nbsp;&nbsp;—&nbsp;&nbsp;{queueState.nowPlaying.song.channelTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — below player on mobile, right column on desktop */}
        <aside className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col p-4 gap-4 md:overflow-y-auto">
          {/* Search + results — always at top, no scroll needed */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
              Add to Queue
            </p>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={searchLoading}
              hasResults={hasResults}
            />
            {searchLoading && (
              <p className="text-gray-500 text-xs animate-pulse text-center py-2">
                Searching karaoke videos...
              </p>
            )}
            {searchError && (
              <div className="rounded-lg bg-yellow-950/60 border border-yellow-800/50 px-3 py-2">
                <p className="text-yellow-400 text-xs font-semibold">
                  {searchError.includes("temporarily unavailable") ? "⚠ Search limit reached" : "⚠ Search failed"}
                </p>
                <p className="text-yellow-600 text-xs mt-0.5">{searchError}</p>
              </div>
            )}
            {hasResults && (
              <SearchResults results={searchResults} onAdd={handleAdd} />
            )}
          </div>

          <div className="border-t border-gray-800" />
          <NowPlaying nowPlaying={queueState.nowPlaying} onSkip={handleAdvance} />
          <Recommendations
            nowPlaying={queueState.nowPlaying?.song ?? null}
            onAdd={handleAdd}
            onPlay={handlePlaySong}
          />
          <div className="border-t border-gray-800" />
          <QueuePanel queue={queueState.queue} onRemove={handleRemove} onPlayNow={handlePlayNow} />
        </aside>
      </main>

      {/* YouTube attribution — required by YouTube API ToS */}
      <footer className="flex items-center justify-end gap-2 px-6 py-2 border-t border-gray-800/50 flex-shrink-0">
        <span className="text-gray-600 text-[10px]">Powered by</span>
        <a
          href="https://www.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
          aria-label="YouTube"
        >
          <svg viewBox="0 0 90 20" className="h-3 fill-current text-red-600" aria-hidden="true">
            <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" />
            <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" className="fill-white" />
          </svg>
          <span className="font-medium">YouTube</span>
        </a>
      </footer>
    </div>
  );
}
