# Deploying KaraQueue to Cloudflare Pages

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Critical: Fix In-Memory Queue](#2-critical-fix-in-memory-queue)
3. [Install Cloudflare Adapter](#3-install-cloudflare-adapter)
4. [Configure Next.js for Edge Runtime](#4-configure-nextjs-for-edge-runtime)
5. [Wrangler Configuration](#5-wrangler-configuration)
6. [Set Up Cloudflare KV for Queue State](#6-set-up-cloudflare-kv-for-queue-state)
7. [Migrate Queue Logic to KV](#7-migrate-queue-logic-to-kv)
8. [Google OAuth Setup](#8-google-oauth-setup)
9. [Deploy to Cloudflare Pages](#9-deploy-to-cloudflare-pages)
10. [Set Environment Variables](#10-set-environment-variables)
11. [Custom Domain (Optional)](#11-custom-domain-optional)
12. [Verify the Deployment](#12-verify-the-deployment)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- Node.js 18.17+ and npm installed locally
- The app running locally without errors (`npm run dev`)
- Your environment variables ready:
  - `YOUTUBE_API_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_SECRET`

Install the Wrangler CLI globally:

```bash
npm install -g wrangler
wrangler login
```

`wrangler login` opens a browser — authorize it with your Cloudflare account.

---

## 2. Critical: Fix In-Memory Queue

**This step is mandatory.** The current `lib/queue.ts` uses a module-level singleton:

```ts
let state: QueueState = { nowPlaying: null, queue: [] };
```

Cloudflare Workers are **stateless** — each incoming request may land on a different isolate with no shared memory. The in-memory singleton will silently reset between requests, meaning the queue will appear to be always empty.

**Solution: Cloudflare KV** — a key-value store that persists across requests and Workers.

See [Section 6](#6-set-up-cloudflare-kv-for-queue-state) and [Section 7](#7-migrate-queue-logic-to-kv) for the full migration.

---

## 3. Install Cloudflare Adapter

```bash
npm install -D @cloudflare/next-on-pages
npm install -D wrangler
```

Add the build script to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:preview": "npm run pages:build && wrangler pages dev .vercel/output/static",
    "pages:deploy": "npm run pages:build && wrangler pages deploy .vercel/output/static"
  }
}
```

---

## 4. Configure Next.js for Edge Runtime

### 4a. Add the compatibility comment to `next.config.ts`

The `@cloudflare/next-on-pages` ESLint plugin enforces that every route file declares its runtime. Add the plugin:

```bash
npm install -D eslint-plugin-next-on-pages
```

Create or update `.eslintrc.json`:

```json
{
  "extends": ["next"],
  "plugins": ["eslint-plugin-next-on-pages"],
  "rules": {
    "next-on-pages/no-unsupported-configs": "warn"
  }
}
```

### 4b. Declare Edge runtime in every API route

Add this line to the **top** of each file under `app/api/`:

```ts
export const runtime = 'edge';
```

Files to update:
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/queue/route.ts`
- `app/api/queue/[id]/route.ts`
- `app/api/queue/advance/route.ts`
- `app/api/queue/play-now/route.ts`
- `app/api/queue/play-song/route.ts`
- `app/api/recommendations/route.ts`
- `app/api/search/route.ts`

### 4c. Update `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
```

> **Note:** Remove any `output: 'standalone'` if present — `@cloudflare/next-on-pages` handles its own output format.

---

## 5. Wrangler Configuration

Create `wrangler.toml` at the project root:

```toml
name = "karaqueue"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[kv_namespaces]]
binding = "QUEUE_KV"
id = "REPLACE_WITH_YOUR_KV_ID"          # filled in Section 6
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"  # filled in Section 6
```

The `nodejs_compat` flag is required for `next-auth` (it uses Node.js crypto internally).

---

## 6. Set Up Cloudflare KV for Queue State

### Create the KV namespace

```bash
# Production namespace
wrangler kv:namespace create QUEUE_KV

# Preview namespace (for local testing with wrangler)
wrangler kv:namespace create QUEUE_KV --preview
```

Both commands output a namespace ID. Copy them into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "QUEUE_KV"
id = "abc123..."          # production ID
preview_id = "def456..."  # preview ID
```

### TypeScript types for KV binding

Create `types/cloudflare.d.ts`:

```ts
export interface CloudflareEnv {
  QUEUE_KV: KVNamespace;
}
```

---

## 7. Migrate Queue Logic to KV

Replace `lib/queue.ts` with a KV-backed implementation. The key change: every function now accepts a `kv: KVNamespace` parameter and reads/writes state from KV instead of a module variable.

```ts
// lib/queue.ts
import { QueueItem, QueueState, Song } from "@/types";

const KV_KEY = "queue_state";

async function readState(kv: KVNamespace): Promise<QueueState> {
  const raw = await kv.get(KV_KEY);
  if (!raw) return { nowPlaying: null, queue: [] };
  return JSON.parse(raw) as QueueState;
}

async function writeState(kv: KVNamespace, state: QueueState): Promise<void> {
  await kv.put(KV_KEY, JSON.stringify(state));
}

export async function getQueue(kv: KVNamespace): Promise<QueueState> {
  return readState(kv);
}

export async function addToQueue(kv: KVNamespace, song: Song): Promise<QueueState> {
  const state = await readState(kv);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const next = state.nowPlaying === null
    ? { ...state, nowPlaying: item }
    : { ...state, queue: [...state.queue, item] };
  await writeState(kv, next);
  return next;
}

export async function advanceQueue(kv: KVNamespace): Promise<QueueState> {
  const state = await readState(kv);
  const [next, ...rest] = state.queue;
  const updated = { nowPlaying: next ?? null, queue: rest };
  await writeState(kv, updated);
  return updated;
}

export async function removeFromQueue(kv: KVNamespace, id: string): Promise<QueueState> {
  const state = await readState(kv);
  const updated = { ...state, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, updated);
  return updated;
}

export async function playNow(kv: KVNamespace, id: string): Promise<QueueState> {
  const state = await readState(kv);
  const item = state.queue.find((i) => i.id === id);
  if (!item) return state;
  const updated = { nowPlaying: item, queue: state.queue.filter((i) => i.id !== id) };
  await writeState(kv, updated);
  return updated;
}

export async function playSongNow(kv: KVNamespace, song: Song): Promise<QueueState> {
  const state = await readState(kv);
  const item: QueueItem = { id: crypto.randomUUID(), song, addedAt: Date.now() };
  const updated = { ...state, nowPlaying: item };
  await writeState(kv, updated);
  return updated;
}
```

### Update API routes to pass KV

In each route file that calls queue functions, get the KV binding from the Cloudflare environment:

```ts
// Example: app/api/queue/route.ts
export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getQueue, addToQueue } from "@/lib/queue";
import { Song } from "@/types";
import { getCloudflareContext } from "@cloudflare/next-on-pages";

export async function GET() {
  const { env } = getCloudflareContext();
  return NextResponse.json(await getQueue(env.QUEUE_KV));
}

export async function POST(req: NextRequest) {
  const { env } = getCloudflareContext();
  const body = await req.json().catch(() => null);
  const song: Song = body?.song;

  if (!song?.videoId || !song?.title) {
    return NextResponse.json({ error: "Invalid song" }, { status: 400 });
  }

  const state = await addToQueue(env.QUEUE_KV, song);
  return NextResponse.json(state);
}
```

Apply the same `getCloudflareContext()` pattern to all other queue-related routes.

---

## 8. Google OAuth Setup

NextAuth requires a **callback URL** registered in Google Cloud Console.

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Open your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://karaqueue.pages.dev/api/auth/callback/google
   ```
   Replace `karaqueue.pages.dev` with your actual Pages URL or custom domain.
4. Save.

> You can find your Pages URL after the first deploy in the Cloudflare dashboard under **Pages → karaqueue → Deployments**.

---

## 9. Deploy to Cloudflare Pages

### Option A: Git-connected deploy (recommended)

1. Push your code to GitHub (or GitLab).
2. In Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**
3. Select your repository.
4. Set build settings:
   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Build command | `npx @cloudflare/next-on-pages` |
   | Build output directory | `.vercel/output/static` |
   | Root directory | `/` |
5. Click **Save and Deploy**.

Every push to `main` will trigger an automatic redeploy.

### Option B: Manual CLI deploy

```bash
npm run pages:deploy
```

This builds locally and pushes to Cloudflare. Useful for one-off deploys without a git connection.

---

## 10. Set Environment Variables

In Cloudflare dashboard: **Workers & Pages → karaqueue → Settings → Environment Variables**

Add the following for **Production** (and optionally **Preview**):

| Variable | Value |
|---|---|
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 key |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `NEXTAUTH_SECRET` | A random 32-char string (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://karaqueue.pages.dev` (your Pages URL) |

> **Mark `GOOGLE_CLIENT_SECRET` and `NEXTAUTH_SECRET` as Encrypted** using the lock icon — they'll be write-only after saving.

After adding variables, trigger a redeploy:
```bash
wrangler pages deploy .vercel/output/static
```
or push a new commit if using the git-connected approach.

---

## 11. Custom Domain (Optional)

1. In Cloudflare dashboard: **Workers & Pages → karaqueue → Custom Domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g. `kara.yourdomain.com`)
4. If your domain is on Cloudflare DNS, the CNAME record is added automatically. Otherwise add it manually.
5. Update `NEXTAUTH_URL` to your custom domain.
6. Update the Google OAuth redirect URI to `https://kara.yourdomain.com/api/auth/callback/google`.

---

## 12. Verify the Deployment

After deploy completes, open your Pages URL and check each feature:

- [ ] App loads without a blank screen or 500 error
- [ ] Google Sign-In button appears and OAuth flow completes
- [ ] YouTube search returns results
- [ ] Adding a song to the queue persists across page refreshes (confirms KV is working)
- [ ] Skip / Play Now / Remove all update the queue correctly
- [ ] Recommendations appear while a song is playing
- [ ] Queue syncs in a second browser tab on the same URL

Check the **Functions** logs in the Cloudflare dashboard for any runtime errors:
**Workers & Pages → karaqueue → Functions → Logs**

---

## 13. Troubleshooting

### `Error: KVNamespace is not defined` or `env.QUEUE_KV is undefined`
- Confirm the KV namespace IDs in `wrangler.toml` match the ones created by `wrangler kv:namespace create`.
- Confirm the KV binding is also added in the Cloudflare dashboard under **Settings → KV namespace bindings**.

### `next-auth` callback errors / `NEXTAUTH_URL` mismatch
- Ensure `NEXTAUTH_URL` exactly matches the URL you're visiting (no trailing slash, correct protocol).
- Ensure the redirect URI in Google Console matches `NEXTAUTH_URL + /api/auth/callback/google`.

### Build fails: `Edge runtime does not support ...`
- A dependency uses a Node.js API unavailable on the Edge. Check the build log for the specific module.
- Try adding `nodejs_compat` to `compatibility_flags` in `wrangler.toml` (already included above).
- As a last resort, switch the offending route to `export const runtime = 'nodejs'` — but note this forces full Node.js isolation and may increase cold-start time.

### Queue resets unexpectedly
- Verify the KV write is completing. Add `console.log` in `writeState` and check Function Logs.
- KV is **eventually consistent** — reads immediately after a write may return stale data for a brief moment. This is usually imperceptible but can cause a visible flash on page load.

### `next: { revalidate }` fetch caching not working
- The `next: { revalidate }` option in `lib/youtube.ts` is a Next.js Data Cache feature and is not supported on the Cloudflare edge runtime. Remove it or replace it with a KV-based cache if quota usage is a concern.

### Images not loading (`lh3.googleusercontent.com`)
- Cloudflare Pages uses Cloudflare's Image Resizing for `next/image`. The `remotePatterns` config in `next.config.ts` is respected, but Image Resizing must be enabled on your zone. If images 404, use a plain `<img>` tag for Google profile photos as a workaround.
