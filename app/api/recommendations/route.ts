import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

// Strip parentheticals and extract artist from karaoke title.
// Handles patterns like:
//   "YELLOW - Coldplay (HQ KARAOKE VERSION)"  → "Coldplay"
//   "Coldplay - Yellow (Karaoke Version)"      → "Coldplay"
//   "Minamahal Kita - Aila Santos Karaoke"     → "Aila Santos"
function extractArtist(title: string): string | null {
  const cleaned = title.replace(/\s*\([^)]*\)/g, "").trim();
  const idx = cleaned.indexOf(" - ");
  if (idx === -1) return null;
  const left = cleaned.slice(0, idx).trim();
  const right = cleaned.slice(idx + 3).trim();
  // If left is all-caps it's likely the song title, artist is on the right
  const leftIsAllCaps = left === left.toUpperCase() && /[A-Z]/.test(left);
  return leftIsAllCaps ? right : left;
}

// Fetch genre tags from MusicBrainz — free, no API key needed.
async function getGenres(artist: string): Promise<string[]> {
  const url = new URL("https://musicbrainz.org/ws/2/artist/");
  url.searchParams.set("query", artist);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "KaraQueue/1.0 (karaqueue-app)" },
    next: { revalidate: 86400 }, // cache 24h — genre tags don't change
  });
  if (!res.ok) return [];

  const data = await res.json();
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
    // Try to extract an artist name (works when title is a karaoke video title).
    // Falls back to treating the whole string as a search query.
    const artist = extractArtist(title);
    let genres: string[] = [];
    if (artist) genres = await getGenres(artist);

    // Priority:
    //   1. genre-based queries  ("pop rock songs", "britpop songs")
    //   2. artist-based query   ("Coldplay songs")
    //   3. raw search query     ("minamahal kita") — when no artist/genre found
    let queries: string[];
    if (genres.length > 0) {
      queries = genres.slice(0, 2).map((g) => `${g} songs`);
    } else if (artist) {
      queries = [`${artist} songs`];
    } else {
      queries = [title];
    }

    const batches = await Promise.all(
      queries.map((q) => searchYouTube(q, 10).catch(() => [] as typeof import("@/types").Song[]))
    );

    // Interleave batches, deduplicate, exclude the source video
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
