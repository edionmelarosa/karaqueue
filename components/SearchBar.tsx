"use client";

import { useState, FormEvent, useRef, useEffect } from "react";

interface Props {
  onSearch: (query: string) => void;
  onClear: () => void;
  loading: boolean;
  hasResults: boolean;
}

export default function SearchBar({ onSearch, onClear, loading, hasResults }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) onSearch(q);
  }

  function handleClear() {
    setQuery("");
    onClear();
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search song title or artist..."
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-4 pr-8 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        />
        {(query || hasResults) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-base leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="px-5 py-2.5 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {loading ? "..." : "Search"}
      </button>
    </form>
  );
}
