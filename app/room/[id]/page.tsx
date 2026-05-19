"use client";

export const runtime = 'edge';

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import YouTubePlayer from "@/components/YouTubePlayer";
import NowPlaying from "@/components/NowPlaying";
import QueuePanel from "@/components/QueuePanel";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import Recommendations from "@/components/Recommendations";
import AdUnit from "@/components/AdUnit";
import { QueueState, Song } from "@/types";

const EMPTY_STATE: QueueState = { nowPlaying: null, queue: [] };
const DEVICE_ID_KEY = "kq_device_id";
const SESSION_ID_KEY = "kq_session_id";
const SESSION_ROLE_KEY = "kq_session_role";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

type SessionInfo = {
  sessionId: string;
  memberCount: number;
  isHost: boolean;
  isSolo: boolean;
};

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<QueueState>(EMPTY_STATE);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => { sessionInfoRef.current = sessionInfo; }, [sessionInfo]);
  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);

  // On mount: resolve deviceId and establish session
  useEffect(() => {
    const did = getOrCreateDeviceId();
    setDeviceId(did);

    const storedSession = localStorage.getItem(SESSION_ID_KEY);
    const storedRole = localStorage.getItem(SESSION_ROLE_KEY);

    if (storedRole === "solo" && storedSession === roomId) {
      // Solo mode: device is its own host, no server session
      setSessionInfo({ sessionId: roomId, memberCount: 1, isHost: true, isSolo: true });
      return;
    }

    // Try to join or verify the session
    async function initSession() {
      if (storedSession === roomId) {
        // Already in this session — verify it still exists
        const res = await fetch(`/api/session/${roomId}`, { headers: { "X-Device-Id": did } });
        if (res.ok) {
          const data = await res.json() as { sessionId: string; memberCount: number; isHost: boolean };
          setSessionInfo({ ...data, isSolo: false });
          return;
        }
      }

      // Not in this session yet — try joining (handles shared URL)
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "X-Device-Id": did, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: roomId }),
      });

      if (res.ok) {
        const data = await res.json() as { sessionId: string; memberCount: number; hostDeviceId: string };
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
        localStorage.setItem(SESSION_ROLE_KEY, data.hostDeviceId === did ? "host" : "guest");
        setSessionInfo({ sessionId: data.sessionId, memberCount: data.memberCount, isHost: data.hostDeviceId === did, isSolo: false });
        return;
      }

      setSessionError("Session not found or has expired.");
    }

    initSession();
  }, [roomId]);

  // Refresh member count every 30s
  useEffect(() => {
    if (!sessionInfo || sessionInfo.isSolo) return;
    const interval = setInterval(async () => {
      const did = deviceIdRef.current;
      if (!did) return;
      const res = await fetch(`/api/session/${sessionInfo.sessionId}`, { headers: { "X-Device-Id": did } });
      if (res.ok) {
        const data = await res.json() as { memberCount: number; isHost: boolean };
        setSessionInfo((prev) => prev ? { ...prev, memberCount: data.memberCount } : prev);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [sessionInfo]);

  function queueHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      "X-Session-Id": sessionInfoRef.current?.sessionId ?? "",
      "X-Device-Id": deviceIdRef.current ?? "",
      ...extra,
    };
  }

  const fetchQueue = useCallback(async () => {
    const info = sessionInfoRef.current;
    const did = deviceIdRef.current;
    if (!info || !did) return;
    const res = await fetch("/api/queue", { headers: { "X-Session-Id": info.sessionId, "X-Device-Id": did } });
    if (res.ok) setQueueState(await res.json() as QueueState);
  }, []);

  useEffect(() => {
    if (!sessionInfo) return;
    fetchQueue();
    const id = setInterval(fetchQueue, 2000);
    return () => clearInterval(id);
  }, [fetchQueue, sessionInfo]);

  async function handleSearch(query: string) {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json() as any;
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
    setDuplicateError(null);
  }

  async function handleAdd(song: Song) {
    const alreadyQueued =
      queueState.nowPlaying?.song.videoId === song.videoId ||
      queueState.queue.some((item) => item.song.videoId === song.videoId);
    if (alreadyQueued) {
      setDuplicateError(`"${song.title}" is already in the queue`);
      return;
    }
    setDuplicateError(null);
    const res = await fetch("/api/queue", {
      method: "POST",
      headers: queueHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ song }),
    });
    if (res.ok) {
      setQueueState(await res.json() as QueueState);
      handleClearSearch();
    }
  }

  async function handleAdvance() {
    const res = await fetch("/api/queue/advance", { method: "POST", headers: queueHeaders() });
    if (res.ok) setQueueState(await res.json() as QueueState);
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/queue/${id}`, { method: "DELETE", headers: queueHeaders() });
    if (res.ok) setQueueState(await res.json() as QueueState);
  }

  async function handlePlayNow(id: string) {
    const res = await fetch("/api/queue/play-now", {
      method: "POST",
      headers: queueHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id }),
    });
    if (res.ok) setQueueState(await res.json() as QueueState);
  }

  async function handlePlaySong(song: Song) {
    const res = await fetch("/api/queue/play-song", {
      method: "POST",
      headers: queueHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ song }),
    });
    if (res.ok) setQueueState(await res.json() as QueueState);
  }

  function handleLeave() {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_ROLE_KEY);
    router.push("/");
  }

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  const videoId = queueState.nowPlaying?.song.videoId ?? null;
  const startedAt = queueState.nowPlaying?.startedAt;
  const hasResults = searchResults.length > 0;
  const isHost = sessionInfo?.isHost ?? false;
  const isSolo = sessionInfo?.isSolo ?? false;

  // Loading state
  if (!sessionInfo && !sessionError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Joining session...</p>
      </div>
    );
  }

  // Error state
  if (sessionError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-semibold">{sessionError}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition text-sm"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen bg-[#0a0a0f] text-white flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_8px_#00d4ff] flex-shrink-0">
          KaraQueue
        </h1>

        {/* Session badge */}
        {!isSolo && (
          <button
            onClick={handleCopyInvite}
            title={copied ? "Copied!" : "Copy invite link"}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-800 hover:bg-gray-700 transition text-[11px] flex-shrink-0 border border-gray-700"
          >
            <span className="text-cyan-400 font-mono font-bold tracking-wider">{roomId}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">
              {sessionInfo!.memberCount} {sessionInfo!.memberCount === 1 ? "person" : "people"}
            </span>
            {copied ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-green-400" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        )}

        {isHost && !isSolo && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-900/60 text-cyan-400 border border-cyan-800 flex-shrink-0">
            Host
          </span>
        )}

        <span className="text-gray-600 text-sm flex-shrink-0">•</span>
        <span className="text-gray-500 text-xs md:text-sm flex-shrink-0">
          {queueState.queue.length > 0
            ? `${queueState.queue.length} song${queueState.queue.length !== 1 ? "s" : ""} in queue`
            : "Queue empty"}
        </span>

        <div className="ml-auto flex items-center gap-1 min-w-0 flex-shrink overflow-hidden">
          <NowPlaying compact nowPlaying={queueState.nowPlaying} onSkip={sessionInfo != null ? handleAdvance : undefined} />
          <button
            onClick={handleLeave}
            className="flex-shrink-0 text-[10px] text-gray-600 hover:text-gray-400 transition px-2 py-1 rounded hover:bg-gray-800"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row md:flex-1 md:min-h-0 md:overflow-hidden">
        {/* Player */}
        <div className="flex flex-col p-4 gap-3 min-w-0 md:flex-1">
          <YouTubePlayer videoId={videoId} startedAt={startedAt} onEnded={isHost ? handleAdvance : undefined} />
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

        {/* Sidebar */}
        <aside className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col p-4 gap-4 md:overflow-hidden">
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
            {duplicateError && (
              <div className="rounded-lg bg-orange-950/60 border border-orange-800/50 px-3 py-2">
                <p className="text-orange-400 text-xs font-semibold">⚠ Already in queue</p>
                <p className="text-orange-600 text-xs mt-0.5">{duplicateError}</p>
              </div>
            )}
            {hasResults && (
              <SearchResults results={searchResults} onAdd={handleAdd} />
            )}
          </div>

          <div className="border-t border-gray-800" />
          <Recommendations
            nowPlaying={queueState.nowPlaying?.song ?? null}
            onAdd={handleAdd}
            onPlay={isHost ? handlePlaySong : undefined}
          />
          <div className="border-t border-gray-800" />
          <div className="md:flex-1 min-h-0 flex flex-col overflow-hidden">
            <QueuePanel
              queue={queueState.queue}
              deviceId={deviceId}
              isHost={isHost}
              isInSession={sessionInfo != null}
              onRemove={handleRemove}
              onPlayNow={handlePlayNow}
            />
          </div>
        </aside>
      </main>

      {/* YouTube attribution */}
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
