"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function LobbyClient() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | "solo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_ROLE_KEY);
  }, []);

  async function handleCreate() {
    setLoading("create");
    setError(null);
    try {
      const did = getOrCreateDeviceId();
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "X-Device-Id": did },
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json() as { sessionId: string };
      localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      localStorage.setItem(SESSION_ROLE_KEY, "host");
      router.push(`/room/${data.sessionId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      joinInputRef.current?.focus();
      return;
    }
    setLoading("join");
    setError(null);
    try {
      const did = getOrCreateDeviceId();
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "X-Device-Id": did, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: code }),
      });
      if (!res.ok) throw new Error("Session not found or has expired");
      const data = await res.json() as { sessionId: string; hostDeviceId: string };
      localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      localStorage.setItem(SESSION_ROLE_KEY, data.hostDeviceId === did ? "host" : "guest");
      router.push(`/room/${data.sessionId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  function handleSolo() {
    setLoading("solo");
    const roomId = crypto.randomUUID().slice(0, 8).toUpperCase();
    localStorage.setItem(SESSION_ID_KEY, roomId);
    localStorage.setItem(SESSION_ROLE_KEY, "solo");
    router.push(`/room/${roomId}`);
  }

  const busy = loading !== null;

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      {/* Create Session */}
      <button
        onClick={handleCreate}
        disabled={busy}
        className="group relative w-full rounded-2xl border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-950/50 hover:border-cyan-600 transition-all p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">
              {loading === "create" ? "Creating session…" : "Create a session"}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Host a room and invite friends with a code</p>
          </div>
        </div>
      </button>

      {/* Join Session */}
      <div className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-700/40 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300" aria-hidden="true">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Join a session</p>
            <p className="text-gray-500 text-xs mt-0.5">Enter a room code to join a friend's session</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={joinInputRef}
            type="text"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Enter code"
            maxLength={8}
            disabled={busy}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-700 font-mono tracking-widest uppercase disabled:opacity-50"
          />
          <button
            onClick={handleJoin}
            disabled={busy || !joinCode.trim()}
            className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "join" ? "…" : "Join"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 border-t border-gray-800" />
        <span className="text-gray-700 text-xs">or</span>
        <div className="flex-1 border-t border-gray-800" />
      </div>

      {/* Solo Mode */}
      <button
        onClick={handleSolo}
        disabled={busy}
        className="w-full rounded-2xl border border-gray-800 bg-transparent hover:bg-gray-900/60 transition-all p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-300 text-sm">
              {loading === "solo" ? "Starting…" : "Solo mode"}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">Just you — queue songs for yourself</p>
          </div>
        </div>
      </button>

      {/* Ko-fi support card */}
      <div className="rounded-2xl border border-[#FF5E5B]/25 bg-[#FF5E5B]/5 p-5 flex flex-col gap-3">
        <p className="text-gray-300 text-xs leading-relaxed">
          KaraQueue is developed and maintained by an independent developer during free time. If the app has made your karaoke sessions more fun, consider supporting its continued development with a small tip. Every contribution helps keep the app improving and growing. ❤️
        </p>
        <a
          href="https://ko-fi.com/edionlarosa"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5E5B] hover:bg-[#ff4744] active:bg-[#e03a38] transition-colors text-white text-sm font-bold shadow-[0_0_16px_#ff5e5b40]"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" aria-hidden="true">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
          </svg>
          Buy me a coffee
        </a>
      </div>
    </div>
  );
}
