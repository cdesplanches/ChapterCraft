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
  - `users/{userId}/projects/{id}/meta.json` — project metadata
  - `users/{userId}/projects/{id}/chapters/{chapterId}.json` — one row per chapter
  - `users/{userId}/settings.json` — AI settings
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

Apply **schema migrations** (creates empty tables — not your book data):

```bash
npx wrangler d1 migrations apply chaptercraft-db --remote
```

This runs the SQL files in `migrations/` (`users` table, `documents` table). You only need to do this once per database, or again when new migration files are added to the repo.

For local Wrangler preview:

```bash
npx wrangler d1 migrations apply chaptercraft-db --local
```

## 2. Set secrets

ChapterCraft needs `AUTH_SECRET` in production: a private key used to **sign login cookies**. Without it, sessions cannot be created securely.

### Generate a value

```bash
openssl rand -hex 32
```

Example output (yours will be different):

```
a3f8c1e92b704d5687f1a0e4c9d2b6e8f0a1c3d5e7b9f2a4c6d8e0f1a3b5c7d9
```

### Store it on Cloudflare

**Option A — interactive** (Wrangler prompts you to paste the value):

```bash
npx wrangler secret put AUTH_SECRET
# Enter a secret value: (paste the string from openssl rand -hex 32)
```

**Option B — one-liner** (generates and uploads in one step):

```bash
openssl rand -hex 32 | npx wrangler secret put AUTH_SECRET
```

The secret is stored encrypted on Cloudflare and injected into your Worker at runtime. It is **not** committed to git and **not** visible in the dashboard after creation.

> **Local dev:** `npm run dev` uses a built-in dev default — you do not need `AUTH_SECRET` on your machine unless you test auth against production-like settings.

## 3. Deploy the Worker

```bash
npm install
npm run deploy
```

First deploy prints your `*.workers.dev` URL (e.g. `https://chaptercraft.<subdomain>.workers.dev`).

### Optional: custom domain

In Cloudflare dashboard → Workers & Pages → chaptercraft → Settings → Domains → add e.g. `chaptercraft.example.com`.

## 4. Copy local projects to D1 (optional)

If you already have book projects in `data/` on your machine and want them on Cloudflare (this is **data** migration, separate from the schema step above):

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

## 6. CI/CD (GitHub Actions)

Each push to `main` triggers an automatic deploy via [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

### One-time setup

1. **Create a D1 database** and put the real `database_id` in `wrangler.jsonc` (see step 1 above).

2. **Set `AUTH_SECRET` on Cloudflare** (once, not in GitHub):
   ```bash
   openssl rand -hex 32 | npx wrangler secret put AUTH_SECRET
   ```

3. **Create a Cloudflare API token** with these permissions:
   - Account → **Cloudflare Workers Scripts** → Edit
   - Account → **D1** → Edit
   - Account → **Account Settings** → Read (to resolve account)

   Dashboard → My Profile → **API Tokens** → Create Token → use the *Edit Cloudflare Workers* template and add D1 Edit.

4. **Add GitHub repository secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |--------|--------|
   | `CLOUDFLARE_API_TOKEN` | The token from step 3 |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right column **Account ID** |

5. Push to `main` — the workflow will:
   - install dependencies
   - apply D1 schema migrations
   - build with OpenNext and deploy the Worker

You can also run a deploy manually: GitHub → **Actions** → **Deploy to Cloudflare** → **Run workflow**.

### Alternative: Cloudflare dashboard CI

You can connect the repo in Cloudflare dashboard instead, but GitHub Actions is already configured:

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Deploy command | `npx opennextjs-cloudflare build && npx wrangler deploy` |

## 7. Optional API key secrets

Store sensitive defaults as Worker secrets instead of per-user settings:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

## D1 limits to know

| Limit | Value | Impact on ChapterCraft |
|-------|--------|-------------------------|
| Free tier storage | 5 GB total | Plenty for thousands of books |
| Free tier reads/writes | 5M / 100K per day | Normal editing stays well within |
| Max row size | ~2 MB per row | One row **per chapter**, not per book |

### How large books are stored

Each project is split across several D1 rows:

```
users/{userId}/projects/{id}/meta.json      ← pitch, synopsis, chapter list (~few KB)
users/{userId}/projects/{id}/chapters/…     ← one row per chapter
```

A 500-page novel with 30 chapters might use ~500 KB total, spread over ~31 rows. The 2 MB limit applies to **each chapter individually**, not the whole book.

**Rule of thumb:** one chapter would need ~350,000 words in a single field to hit 2 MB — far beyond a normal chapter. If you ever approach the limit, the app returns a clear error and suggests splitting the chapter.

Old single-file projects (`{id}.json`) are still read; they are automatically converted to the split format on the next save.

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
