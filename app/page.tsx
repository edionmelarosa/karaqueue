"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import YouTubePlayer from "@/components/YouTubePlayer";
import NowPlaying from "@/components/NowPlaying";
import QueuePanel from "@/components/QueuePanel";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import AuthButton from "@/components/AuthButton";
import { QueueState, Song } from "@/types";

const EMPTY_STATE: QueueState = { nowPlaying: null, queue: [] };

export default function Home() {
  const { data: session } = useSession();
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

  const videoId = queueState.nowPlaying?.song.videoId ?? null;
  const hasResults = searchResults.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_8px_#00d4ff]">
          KaraQueue
        </h1>
        <span className="text-gray-600 text-sm">•</span>
        <span className="text-gray-500 text-sm">
          {queueState.queue.length > 0
            ? `${queueState.queue.length} song${queueState.queue.length !== 1 ? "s" : ""} in queue`
            : "Queue empty"}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {!session && (
            <span className="text-xs text-yellow-600 hidden sm:block">
              Sign in with Google
            </span>
          )}
          {session && (
            <span className="text-xs text-green-500 hidden sm:block">
              ✓ Signed in
            </span>
          )}
          <AuthButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Player — left column, always visible */}
        <div className="flex flex-col flex-1 p-4 gap-3 min-w-0">
          <YouTubePlayer videoId={videoId} onEnded={handleAdvance} />
          {queueState.nowPlaying && (
            <div className="overflow-hidden whitespace-nowrap bg-gray-900 rounded px-3 py-1.5 border border-gray-800">
              <p className="inline-block animate-[marquee_20s_linear_infinite] text-cyan-400 text-sm font-medium">
                ♪&nbsp;&nbsp;{queueState.nowPlaying.song.title}&nbsp;&nbsp;—&nbsp;&nbsp;{queueState.nowPlaying.song.channelTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-800 flex flex-col p-4 overflow-y-auto gap-4">
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
              <p className="text-red-400 text-xs">{searchError}</p>
            )}
            {hasResults && (
              <SearchResults results={searchResults} onAdd={handleAdd} />
            )}
          </div>

          <div className="border-t border-gray-800" />
          <NowPlaying nowPlaying={queueState.nowPlaying} onSkip={handleAdvance} />
          <div className="border-t border-gray-800" />
          <QueuePanel queue={queueState.queue} onRemove={handleRemove} onPlayNow={handlePlayNow} />
        </aside>
      </main>
    </div>
  );
}
