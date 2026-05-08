# KaraQueue

A YouTube-powered karaoke queue app. Search for karaoke videos, add them to a shared queue, and let the party manage itself — all from any browser on the same network.

## Features

- **YouTube karaoke search** — find karaoke versions of songs directly from YouTube
- **Shared queue** — everyone on the same network can add songs; the queue syncs automatically every 2 seconds
- **Now Playing** — marquee display of the current song title and channel
- **Queue management** — remove songs or jump any queued song to play immediately
- **Google Sign-In** — authenticate with your Google account to add songs
- **Auto-advance** — automatically plays the next song when one ends

## How to Use

1. Open the app in your browser (host it locally or deploy it)
2. Sign in with Google to unlock adding songs
3. Search for a song using the search bar on the right panel
4. Click **Add** on any result to push it to the queue
5. The video plays automatically; use **Skip** to advance or **Play Now** on any queued song to jump the line
6. Anyone on the same network can open the app and add to the queue

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need the following environment variables in a `.env.local` file:

```
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=http://localhost:3000
```

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [NextAuth.js](https://next-auth.js.org) — Google OAuth
- YouTube Data API v3

## Roadmap / What Could Be Added

- **Persistent queue** — currently in-memory; a database (e.g. Redis, SQLite) would survive server restarts
- **Room/session support** — multiple independent queues for different rooms or events
- **User attribution** — show who added each song in the queue
- **Voting / reordering** — let the crowd vote songs up or bump them down
- **Mobile-optimized UI** — better touch targets and layout for phones used as remotes
- **Admin controls** — password-protected host view with full queue override powers
- **Song history** — log of what was played in a session
- **Lyrics overlay** — fetch and display synced lyrics on top of the video

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request
