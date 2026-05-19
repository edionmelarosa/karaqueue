"use client";

import { QueueItem } from "@/types";

interface Props {
  queue: QueueItem[];
  deviceId: string | null;
  isHost: boolean;
  isInSession: boolean;
  onRemove: (id: string) => void;
  onPlayNow: (id: string) => void;
}

export default function QueuePanel({ queue, deviceId, isHost, isInSession, onRemove, onPlayNow }: Props) {
  return (
    <div className="flex flex-col gap-2 md:h-full min-h-0">
      <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
        Queue{" "}
        {queue.length > 0 && (
          <span className="ml-1 bg-cyan-900 text-cyan-300 rounded-full px-2 py-0.5 text-[10px]">
            {queue.length}
          </span>
        )}
      </h2>

      {queue.length === 0 ? (
        <p className="text-gray-600 text-xs italic">Queue is empty</p>
      ) : (
        <ol className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
          {queue.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-gray-800/60 transition-colors"
            >
              <span className="text-gray-600 text-xs w-4 flex-shrink-0 text-center">
                {i + 1}
              </span>
              <img
                src={item.song.thumbnailUrl}
                alt={item.song.title}
                className="w-12 h-9 object-cover rounded flex-shrink-0"
              />
              <span className="text-gray-300 text-sm leading-tight line-clamp-2 flex-1 min-w-0">
                {item.song.title}
              </span>
              {isInSession && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onPlayNow(item.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 active:scale-95 transition"
                    title="Play now"
                    aria-label="Play now"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition"
                    title="Remove"
                    aria-label="Remove from queue"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
