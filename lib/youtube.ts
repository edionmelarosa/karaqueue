import { Song } from "@/types";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function searchYouTube(query: string, maxResults = 10): Promise<Song[]> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set");

  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${query} karaoke`,
    type: "video",
    maxResults: String(maxResults),
    key: API_KEY,
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams}`);

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `YouTube API error ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const items: any[] = searchData.items ?? [];

  return items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
  }));
}
