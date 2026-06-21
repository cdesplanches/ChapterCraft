# Cloudflare deployment guide

Deploy ChapterCraft to **Cloudflare Workers** (via OpenNext) with **R2** for project storage and **Cloudflare Access** for authentication.

## Architecture

```
Browser → Cloudflare Access (login) → Workers (Next.js) → R2 bucket
```

- Each authenticated user gets an isolated prefix: `users/{email}/projects/*.json`
- AI settings: `users/{email}/settings.json`
- Local dev still uses `data/` on disk (with legacy path fallback)

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (Workers Paid plan recommended — free tier has 3 MiB Worker size limit)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) logged in: `npx wrangler login`
- Node.js 20+

## 1. Create R2 buckets

```bash
npx wrangler r2 bucket create chaptercraft-data
npx wrangler r2 bucket create chaptercraft-cache
```

Bucket names must match `wrangler.jsonc` (`chaptercraft-data`, `chaptercraft-cache`).

## 2. Deploy the Worker

```bash
npm install
npm run deploy
```

First deploy prints your `*.workers.dev` URL (e.g. `https://chaptercraft.<subdomain>.workers.dev`).

### Optional: custom domain

In Cloudflare dashboard → Workers & Pages → chaptercraft → Settings → Domains → add e.g. `chaptercraft.example.com`.

## 3. Cloudflare Access (required for production)

**Do not expose the app publicly without Access** — it stores manuscripts and API keys.

1. Dashboard → **Zero Trust** → **Access** → **Applications** → **Add application**
2. Type: **Self-hosted**
3. Application domain: your Worker URL or custom domain (e.g. `chaptercraft.example.com`)
4. Policy: **Allow** → Include → **Emails** → your email address(es)
5. Save

Access injects the header `Cf-Access-Authenticated-User-Email`, used to scope R2 data per user.

### Testing Access

Visit your app URL — you should see the Cloudflare login page first, then ChapterCraft.

## 4. Migrate local data to R2 (optional)

If you have existing projects in `data/projects/`:

```bash
# Set your email to match your Access policy
export STORAGE_USER_ID="you@example.com"

# Upload each project (example)
npx wrangler r2 object put chaptercraft-data/users/you@example.com/projects/PROJECT_ID.json \
  --file=data/projects/PROJECT_ID.json \
  --content-type=application/json

# Upload settings
npx wrangler r2 object put chaptercraft-data/users/you@example.com/settings.json \
  --file=data/settings.json \
  --content-type=application/json
```

Or use the helper script:

```bash
chmod +x scripts/upload-local-to-r2.sh
STORAGE_USER_ID=you@example.com ./scripts/upload-local-to-r2.sh
```

## 5. Local development

### Standard (filesystem)

```bash
npm run dev
```

Data stays in `data/` — no R2 needed.

### With R2 bindings ( closer to production )

```bash
npm run preview
```

Uses Wrangler local R2 emulation on `http://localhost:8787`.

## 6. CI/CD (GitHub)

Connect your repo in Cloudflare dashboard:

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Deploy command | `npx opennextjs-cloudflare build && npx wrangler deploy` |

Or use `npm run deploy` from CLI.

## 7. Secrets (optional)

Store sensitive defaults as Worker secrets instead of R2 settings:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Worker too large (free plan) | Upgrade to Workers Paid |
| Empty project list after deploy | Check Access email matches R2 path; migrate data |
| `DATA_BUCKET` undefined locally | Use `npm run preview` or plain `npm run dev` (filesystem) |
| Internal Server Error after build | Stop dev server before `npm run build`; use `npm run dev:clean` |

## Why R2 over D1?

ChapterCraft stores whole project documents as JSON — R2 maps directly to the existing model with minimal migration. D1 would be a good next step for search, multi-user quotas, or analytics.
