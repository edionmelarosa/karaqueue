"use client";

import { QueueItem } from "@/types";

interface Props {
  queue: QueueItem[];
  onRemove: (id: string) => void;
  onPlayNow: (id: string) => void;
}

export default function QueuePanel({ queue, onRemove, onPlayNow }: Props) {
  return (
    <div className="flex flex-col gap-2">
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
        <ol className="flex flex-col gap-1.5">
          {queue.map((item, i) => (
            <li key={item.id} className="group relative">
              <button
                onClick={() => onPlayNow(item.id)}
                className="flex items-center gap-2 w-full rounded-md px-1 py-1 hover:bg-gray-800 transition-colors text-left"
                title="Play now"
              >
                <span className="text-gray-600 text-xs w-4 flex-shrink-0">{i + 1}</span>
                <img
                  src={item.song.thumbnailUrl}
                  alt={item.song.title}
                  className="w-10 h-7 object-cover rounded flex-shrink-0"
                />
                <span className="text-gray-300 text-xs leading-tight line-clamp-2 flex-1">
                  {item.song.title}
                </span>
                {/* play icon on hover */}
                <span className="opacity-0 group-hover:opacity-100 text-cyan-400 text-xs flex-shrink-0 transition-opacity mr-1">
                  ▶
                </span>
              </button>
              {/* remove button — sits on top, stops propagation */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-opacity px-1"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
