# ChapterCraft

A book writing assistant. Define your pitch, work chapter by chapter, and let AI verify narrative coherence across the whole manuscript.

## Features

- **Project management** — pitch, synopsis, genre, target audience
- **Chapter editing** — outline, content, notes, status (outline → draft → revision → done)
- **Per-chapter AI assistance** — outline generation, drafting, revision, suggestions
- **Coherence analysis** — checks alignment with the pitch and continuity across chapters
- **Pluggable AI providers**:
  - **Ollama** (local models, e.g. llama3.2, mistral…)
  - **OpenAI** (GPT-4o, etc.)
  - **Anthropic** (Claude)
- **Multilingual UI** — English, French, and Spanish (selectable in the header)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you want production-like auth or remote D1 access, create a `.env` file at the project root with at least `AUTH_SECRET` and optionally the Cloudflare D1 variables:

```env
AUTH_SECRET=your-random-secret-key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_API_TOKEN=your_d1_edit_api_token
```

### Docker

```bash
docker compose up -d --build
```

The container exposes the app on [http://localhost:3000](http://localhost:3000) and persists local data in the `data/` folder.

## AI configuration

Open **Settings** in the header (or go to `/settings`) to choose your LLM provider and model. This applies globally to all projects.

### Ollama (local or remote)

1. Install [Ollama](https://ollama.com) on your machine or a server on your network
2. Pull a model: `ollama pull qwen2.5`
3. In Settings → select **Ollama** → enter your server URL (e.g. `http://hal.local:11434` or just `hal.local:11434`)
4. Click **Refresh models** to list available models, then pick one (e.g. `qwen2.5`)
5. **Test connection** to verify

### OpenAI

In **Settings**, choose OpenAI and enter your API key (`sk-...`).

### Anthropic (Claude)

In **Settings**, choose Anthropic and enter your API key (`sk-ant-...`).

> API keys and Ollama URLs are stored locally in `data/settings.json`. This file never leaves your machine except for direct API calls to the chosen provider.

## Data storage

| Environment | Storage |
|-------------|---------|
| Local dev (`npm run dev`) | `data/` on disk |
| Docker (default) | `data/` on the host, persisted via Docker volume |
| Cloudflare Workers / Docker with Cloudflare vars | **D1** (SQLite) — users, projects, settings |

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for full Cloudflare setup (D1, Workers deploy, auth), and **[docs/DOCKER.md](docs/DOCKER.md)** for Docker deployment instructions.

## Scripts

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Local development (filesystem)         |
| `npm run dev:clean`  | Clear cache and start dev (fixes 500 errors) |
| `npm run preview`    | Local Workers runtime with D1 bindings   |
| `npm run deploy`     | Build and deploy to Cloudflare Workers |
| `npm run clean`      | Delete the `.next` build cache           |
| `npm run build`      | Production build (stop dev first)        |
| `npm run cf-typegen` | Generate Cloudflare binding types        |
| `npm run lint`       | ESLint check                             |
| `npm run typecheck`  | TypeScript check without building        |
| `docker compose up -d --build` | Build and start the Docker container |

Pushes to `main` auto-deploy via GitHub Actions (see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** § CI/CD).

## Troubleshooting

### Internal Server Error after code changes

Dev and production builds share the `.next` folder. Running `npm run build` while `npm run dev` is active corrupts the cache and causes 500 errors.

**Fix:**

```bash
# Stop the dev server (Ctrl+C), then:
npm run dev:clean
```

Or manually: `npm run clean` then `npm run dev`.

**Prevention:** only run `npm run build` when the dev server is stopped.

## License

MIT
