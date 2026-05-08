import { Song } from "@/types";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function searchYouTube(query: string): Promise<Song[]> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set");

  // Step 1: search for videos
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${query} karaoke`,
    type: "video",
    maxResults: "10",
    key: API_KEY,
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`);
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `YouTube API error ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const items: any[] = searchData.items ?? [];
  if (items.length === 0) return [];

  // Step 2: check embeddability — filter out videos that can't be embedded
  const videoIds = items.map((item: any) => item.id.videoId).join(",");
  const statusParams = new URLSearchParams({
    part: "status",
    id: videoIds,
    key: API_KEY,
  });

  const statusRes = await fetch(`${BASE_URL}/videos?${statusParams}`);
  const statusData = statusRes.ok ? await statusRes.json() : { items: [] };

  const embeddableIds = new Set<string>(
    (statusData.items ?? [])
      .filter((v: any) => v.status?.embeddable === true)
      .map((v: any) => v.id)
  );

  return items
    .filter((item: any) => embeddableIds.has(item.id.videoId))
    .slice(0, 5)
    .map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
    }));
}
