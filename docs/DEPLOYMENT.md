# Cloudflare deployment guide

Deploy ChapterCraft to **Cloudflare Workers** (via OpenNext) with **D1 (SQLite)** for all application data — users, projects, and settings. No R2 required.

## Architecture

```
Browser → Workers (Next.js) → D1 (SQLite)
                ↓
         Built-in app auth (signup / login)
```

- **users** table — accounts (email, password hash)
- **documents** table — JSON blobs keyed by path:
  - `users/{userId}/projects/{id}.json`
  - `users/{userId}/settings.json`
- Local dev uses the `data/` folder on disk (same key layout)

OpenNext incremental cache runs in **dummy** mode (no R2/KV billing for framework cache).

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (Workers Paid plan recommended — free tier has 3 MiB Worker size limit)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) logged in: `npx wrangler login`
- Node.js 20+

## 1. Create the D1 database

```bash
npx wrangler d1 create chaptercraft-db
```

Copy the `database_id` into `wrangler.jsonc` (replace the placeholder).

Apply migrations:

```bash
npx wrangler d1 migrations apply chaptercraft-db --remote
```

For local Wrangler preview:

```bash
npx wrangler d1 migrations apply chaptercraft-db --local
```

## 2. Set secrets

```bash
npx wrangler secret put AUTH_SECRET
```

Use a long random string (32+ characters). Required in production for session signing.

## 3. Deploy the Worker

```bash
npm install
npm run deploy
```

First deploy prints your `*.workers.dev` URL (e.g. `https://chaptercraft.<subdomain>.workers.dev`).

### Optional: custom domain

In Cloudflare dashboard → Workers & Pages → chaptercraft → Settings → Domains → add e.g. `chaptercraft.example.com`.

## 4. Migrate local data to D1 (optional)

If you have existing projects in `data/`:

1. Sign up on the deployed app (or note your user id from `data/auth/users.json` in local dev).
2. Run:

```bash
node scripts/upload-local-to-d1.mjs YOUR_USER_ID --remote
```

## 5. Local development

### Standard (filesystem)

```bash
npm run dev
```

Data stays in `data/` — no D1 needed.

### With D1 bindings (closer to production)

```bash
npm run preview
```

Uses Wrangler local D1 emulation on `http://localhost:8787`.

## 6. CI/CD (GitHub)

Connect your repo in Cloudflare dashboard:

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Deploy command | `npx opennextjs-cloudflare build && npx wrangler deploy` |

Or use `npm run deploy` from CLI.

## 7. Optional API key secrets

Store sensitive defaults as Worker secrets instead of per-user settings:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

## D1 limits to know

| Limit | Value |
|-------|--------|
| Free tier | 5 GB storage, 5M reads/day, 100K writes/day |
| Max row size | ~2 MB per document |

A typical book project JSON is well under 1 MB. Very large manuscripts with many long chapters could approach the row limit — split chapters or normalize the schema if needed.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Worker too large (free plan) | Upgrade to Workers Paid |
| Empty project list after deploy | Sign up / log in; migrate data with upload script |
| `DB` undefined locally | Use `npm run preview` or plain `npm run dev` (filesystem) |
| Internal Server Error after build | Stop dev server before `npm run build`; use `npm run dev:clean` |
| Signup fails on preview | Run `wrangler d1 migrations apply chaptercraft-db --local` |

## Why D1 only?

- Predictable free-tier quotas (reads/writes), no object-storage egress surprises
- Single SQLite database for users + projects + settings
- Simpler ops: one binding, one migration path
