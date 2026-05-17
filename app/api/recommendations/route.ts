export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";
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

async function getGenres(artist: string): Promise<string[]> {
  const url = new URL("https://musicbrainz.org/ws/2/artist/");
  url.searchParams.set("query", artist);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "KaraQueue/1.0 (karaqueue-app)" },
  });
  if (!res.ok) return [];

  const data = await res.json() as { artists?: { tags?: { name: string; count: number }[] }[] };
  const topArtist = data.artists?.[0];
  if (!topArtist) return [];

  const tags: { name: string; count: number }[] = topArtist.tags ?? [];
  return tags
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => t.name);
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title")?.trim();
  const excludeId = req.nextUrl.searchParams.get("videoId") ?? "";

  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  try {
    const artist = extractArtist(title);
    let genres: string[] = [];
    if (artist) genres = await getGenres(artist);

    let queries: string[];
    if (genres.length > 0) {
      queries = genres.slice(0, 2).map((g) => `${g} songs`);
    } else if (artist) {
      queries = [`${artist} songs`];
    } else {
      queries = [title];
    }

    const batches = await Promise.all(
      queries.map((q) => searchYouTube(q, 10).catch(() => [] as Song[]))
    );

    const seen = new Set<string>([excludeId].filter(Boolean));
    const songs = [];
    const maxPerBatch = Math.ceil(10 / batches.length);
    for (const batch of batches) {
      let taken = 0;
      for (const song of batch) {
        if (taken >= maxPerBatch) break;
        if (!seen.has(song.videoId)) {
          seen.add(song.videoId);
          songs.push(song);
          taken++;
        }
      }
    }

    return NextResponse.json(songs.slice(0, 10));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
