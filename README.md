# KaraQueue

**Live:** https://karaqueue.party/

A YouTube-powered karaoke queue app. Create a session, share the code with friends, and let everyone add songs to a shared queue — all from any browser.

## Features

- **Session-based rooms** — host creates a room and shares a 6-character code; guests join via the code or a direct URL
- **Role-based controls** — host has full playback control; guests can search, add, remove, and reorder queue items
- **YouTube karaoke search** — scrapes YouTube search results directly; falls back to the YouTube Data API v3 if scraping fails
- **Embeddability filtering** — search results are filtered to only show videos that can actually be embedded and played
- **Shared queue** — all session members see the same queue; state syncs automatically every 2 seconds via polling
- **Now Playing** — compact pill in the header showing the current song thumbnail and title
- **Queue management** — remove songs or jump any queued song to play immediately with Play Now
- **Genre-based recommendations** — suggests similar songs while one is playing (can be disabled via env var)
- **Auto-advance** — host's player automatically advances to the next song when one ends
- **Late-join seek** — guests who join mid-song start at the correct playback position based on when the song started
- **Search result caching** — both the scrape and API paths cache results for 1 hour, reducing repeated network hits
- **Google AdSense** — optional ad unit below the video player, gated by environment variables
- **Google Analytics** — optional analytics, gated by environment variable
- **YouTube ToS compliant** — video titles, channel names, and thumbnails link to YouTube; "Powered by YouTube" attribution displayed in the footer

## Session Roles

| Action | Host | Guest | Solo |
|---|:---:|:---:|:---:|
| Search & add songs | ✅ | ✅ | ✅ |
| Remove songs from queue | ✅ | ✅ | ✅ |
| Play Now (from queue) | ✅ | ✅ | ✅ |
| Play Now (from recommendations) | ✅ | — | ✅ |
| Skip current song | ✅ | — | ✅ |
| Auto-advance on song end | ✅ | — | ✅ |

Guests join by entering the session code on the home screen or opening a shared room URL directly.

## Video Sync

The app syncs **which song is playing** across all session members via 2-second polling. Each client runs its own YouTube IFrame player — there is no central playback clock.

| What is synced | Status | Notes |
|---|:---:|---|
| Current song (which video) | ✅ | Propagates within ~2 seconds |
| Seek position on join | ✅ | Late joiners start at the correct position |
| Skip / song change | ✅ | Propagates within ~2 seconds |
| Pause / resume | ❌ | Not tracked; each player is independent |
| Frame-perfect sync | ❌ | YouTube IFrame API does not expose frame-level control; `seekTo()` has ~1–3s imprecision |
| True real-time lock-step | ❌ | Would require WebSocket + coordinated `seekTo()` calls; not achievable with polling |

For karaoke use this is acceptable — each person watches their own screen. If you need tighter sync, a WebSocket-based architecture with server-side playback state (position + pause flag) is the path forward.

## How to Use

1. Open the app and create a session — you'll get a 6-character room code
2. Share the code (or the URL) with guests so they can join
3. Search for a karaoke song using the search bar
4. Click **Add** to push it to the queue; the video starts playing automatically
5. Use **Skip** in the header or **Play Now** in the queue panel to jump the line
6. Guests can add songs from any device — no account required

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
- **User attribution** — show who added each song in the queue
- **Voting / reordering** — let the crowd vote songs up or bump them down
- **Pause/resume sync** — store pause state server-side so all clients pause together
- **Song history** — log of what was played in a session
- **Lyrics overlay** — fetch and display synced lyrics on top of the video

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request
