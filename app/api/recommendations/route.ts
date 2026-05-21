export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { scrapeYouTubeMix, searchYouTube } from "@/lib/youtube";
import type { Song } from "@/types";

function extractArtist(title: string): string | null {
  const cleaned = title.replace(/\s*\([^)]*\)/g, "").trim();
  const idx = cleaned.indexOf(" - ");
  if (idx === -1) return null;
  const left = cleaned.slice(0, idx).trim();
  const right = cleaned.slice(idx + 3).trim();
  const leftIsAllCaps = left === left.toUpperCase() && /[A-Z]/.test(left);
  return leftIsAllCaps ? right : left;
}

// Normalize a title for dedup: lowercase, strip punctuation, collapse spaces
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, "")        // remove parenthetical suffixes
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId")?.trim();
  const title = req.nextUrl.searchParams.get("title")?.trim();

  if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

  try {
    let songs: Song[] = [];

    // Primary: scrape YouTube's auto-generated mix for the current video
    songs = await scrapeYouTubeMix(videoId, 15).catch((err: Error) => {
      console.warn("[recommendations] mix scrape failed:", err.message, { videoId });
      return [] as Song[];
    });

    // Fallback: search by artist name so we get different songs, not the same song
    if (songs.length === 0 && title) {
      const artist = extractArtist(title);
      const query = artist ? `${artist} karaoke` : `${title} similar songs karaoke`;
      console.log("[recommendations] falling back to search query:", query);
      songs = await searchYouTube(query, 15).catch((err: Error) => {
        console.warn("[recommendations] search fallback failed:", err.message, { query });
        return [] as Song[];
      });
    }

    // Exclude the currently playing video
    songs = songs.filter((s) => s.videoId !== videoId);

    // Deduplicate by normalized title (removes same-song variants)
    const currentNorm = title ? normalizeTitle(title) : "";
    const seenTitles = new Set<string>();
    const deduped: Song[] = [];
    for (const song of songs) {
      const norm = normalizeTitle(song.title);
      // Skip if same base title as currently playing
      if (currentNorm && norm.includes(currentNorm.slice(0, 20))) continue;
      if (seenTitles.has(norm)) continue;
      seenTitles.add(norm);
      deduped.push(song);
      if (deduped.length >= 10) break;
    }

    return NextResponse.json(deduped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
