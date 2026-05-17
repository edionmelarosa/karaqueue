# KaraQueue

**Live:** https://karaqueue.party/

A YouTube-powered karaoke queue app. Search for karaoke videos, add them to a shared queue, and let the party manage itself — all from any browser on the same network.

## Features

- **YouTube karaoke search** — scrapes YouTube search results directly; falls back to the YouTube Data API v3 if scraping fails
- **Embeddability filtering** — search results are filtered to only show videos that can actually be embedded and played
- **Shared queue** — everyone on the same network can add songs; the queue syncs automatically every 2 seconds
- **Now Playing** — compact pill in the header showing the current song thumbnail, title, and a Skip button
- **Queue management** — remove songs or jump any queued song to play immediately with Play Now
- **Genre-based recommendations** — suggests similar songs while one is playing (can be disabled via env var)
- **Auto-advance** — automatically plays the next song when one ends
- **Search result caching** — both the scrape and API paths cache results for 1 hour, reducing repeated network hits
- **Google AdSense** — optional ad unit below the video player, gated by environment variables
- **Google Analytics** — optional analytics, gated by environment variable
- **YouTube ToS compliant** — video titles, channel names, and thumbnails link to YouTube; "Powered by YouTube" attribution displayed in the footer

## How to Use

1. Open the app in your browser (host it locally or deploy it)
2. Search for a song using the search bar on the right panel
3. Click **Add** on any result to push it to the queue
4. The video plays automatically; use **Skip** in the header or **Play Now** on any queued song to jump the line
5. Anyone on the same network can open the app and add to the queue

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file:

```
# Required for API fallback search and embeddability filtering
YOUTUBE_API_KEY=your_youtube_data_api_v3_key

# Optional features
NEXT_PUBLIC_RECOMMENDATIONS=true        # set to false to disable recommendations
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXX # Google Analytics (omit to disable)
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxx  # Google AdSense publisher ID (omit to disable)
NEXT_PUBLIC_ADSENSE_SLOT=1234567890     # AdSense ad slot (required if AdSense client is set)
```

`YOUTUBE_API_KEY` is optional — if omitted, scraping is the only search path and embeddability filtering is skipped.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- YouTube IFrame API — embedded player
- YouTube Data API v3 — search fallback and embeddability filtering
- Tailwind CSS

## Roadmap / What Could Be Added

- **Persistent queue** — currently in-memory; a database (e.g. Redis, SQLite) would survive server restarts
- **Room/session support** — multiple independent queues for different rooms or events
- **User attribution** — show who added each song in the queue
- **Voting / reordering** — let the crowd vote songs up or bump them down
- **Admin controls** — password-protected host view with full queue override powers
- **Song history** — log of what was played in a session
- **Lyrics overlay** — fetch and display synced lyrics on top of the video

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request
