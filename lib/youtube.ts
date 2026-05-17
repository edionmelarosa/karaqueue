import { Song } from "@/types";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

async function scrapeYouTube(query: string, maxResults: number): Promise<Song[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " karaoke")}&hl=en`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) throw new Error(`YouTube scrape failed: ${res.status}`);

  const html = await res.text();

  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData not found in page");

  // Find matching closing brace via bracket counting
  let depth = 0;
  let i = start + marker.length;
  const jsonStart = i;
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }

  const data = JSON.parse(html.slice(jsonStart, i + 1));

  const sections: any[] =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents ?? [];

  const videos: Song[] = [];
  for (const section of sections) {
    for (const item of section?.itemSectionRenderer?.contents ?? []) {
      const v = item?.videoRenderer;
      if (!v?.videoId) continue;
      videos.push({
        videoId: v.videoId,
        title: v.title?.runs?.[0]?.text ?? "",
        channelTitle:
          v.ownerText?.runs?.[0]?.text ??
          v.longBylineText?.runs?.[0]?.text ??
          "",
        thumbnailUrl: v.thumbnail?.thumbnails?.at(-1)?.url ?? "",
      });
      if (videos.length >= maxResults) return videos;
    }
  }

  if (videos.length === 0) throw new Error("Scraper returned no results");
  return videos;
}

async function filterEmbeddable(songs: Song[]): Promise<Song[]> {
  if (!API_KEY || songs.length === 0) return songs;

  const videoIds = songs.map((s) => s.videoId).join(",");
  const statusParams = new URLSearchParams({ part: "status", id: videoIds, key: API_KEY });

  const statusRes = await fetch(`${BASE_URL}/videos?${statusParams}`).catch(() => null);
  if (!statusRes?.ok) return songs;

  const statusData = await statusRes.json() as any;
  const embeddableIds = new Set<string>(
    (statusData.items ?? [])
      .filter((v: any) => v.status?.embeddable === true)
      .map((v: any) => v.id as string)
  );

  return songs.filter((s) => embeddableIds.has(s.videoId));
}

async function searchYouTubeAPI(query: string, maxResults: number): Promise<Song[]> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set");

  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${query} karaoke`,
    type: "video",
    maxResults: String(maxResults),
    key: API_KEY,
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`, {
    next: { revalidate: 3600 },
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `YouTube API error ${searchRes.status}`);
  }

  const searchData = await searchRes.json() as any;
  const songs: Song[] = (searchData.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
  }));

  // Step 2: check embeddability — filter out videos that can't be embedded
  return filterEmbeddable(songs);
}

export async function searchYouTube(query: string, maxResults = 10): Promise<Song[]> {
  try {
    const songs = await scrapeYouTube(query, maxResults);
    // Step 2: check embeddability — filter out videos that can't be embedded
    return await filterEmbeddable(songs);
  } catch (scrapeErr) {
    console.warn("YouTube scrape failed, falling back to API:", (scrapeErr as Error).message);
    return searchYouTubeAPI(query, maxResults);
  }
}
