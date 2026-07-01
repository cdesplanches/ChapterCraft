# ChapterCraft

ChapterCraft is an open-source writing workspace for authors who want to plan a book, write chapter by chapter, and let AI review narrative coherence across the whole manuscript.

It combines a clean project manager, a chapter editor, and AI assistance in one app so you can move from idea to first draft without leaving the tool.

## Why this project?

- Build and organize book projects from a single place
- Write and refine chapters with structured editing flow
- Use AI to generate outlines, drafts, and revision suggestions
- Keep your work local by default, or connect to Cloudflare D1 when needed
- Run it locally, in Docker, or on Cloudflare Workers

## Features

- Project management with pitch, synopsis, genre, and audience
- Chapter workflow with outline, draft, revision, and done states
- AI assistance per chapter and project-wide coherence review
- Pluggable providers: Ollama, OpenAI, and Anthropic
- Multilingual UI in English, French, and Spanish

## Tech stack

- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Cloudflare Workers / OpenNext
- Cloudflare D1
- Docker

## Quick start

```bash
git clone https://github.com/cdesplanches/ChapterCraft.git
cd ChapterCraft
npm install
npm run dev
```

Open http://localhost:3000.

If you want production-like auth or remote D1 access, create a .env file at the project root with at least `AUTH_SECRET` and optionally the Cloudflare D1 variables:

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

The container exposes the app on http://localhost:3000 and persists local data in the `data/` folder.

## AI configuration

Open Settings in the header (or go to /settings) to choose your LLM provider and model. This applies globally to all projects.

### Ollama (local or remote)

1. Install Ollama on your machine or a server on your network
2. Pull a model: `ollama pull qwen2.5`
3. In Settings, select Ollama and enter your server URL
4. Click Refresh models to list available models and choose one
5. Test the connection to verify it works

### OpenAI

In Settings, choose OpenAI and enter your API key.

### Anthropic (Claude)

In Settings, choose Anthropic and enter your API key.

> API keys and Ollama URLs are stored locally in `data/settings.json` and are only sent to the selected provider when you use AI features.

## Data storage

| Environment | Storage |
| --- | --- |
| Local dev (`npm run dev`) | `data/` on disk |
| Docker | `data/` on the host, persisted via Docker volume |
| Cloudflare Workers / Docker with Cloudflare vars | D1 (SQLite) for users, projects, and settings |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Cloudflare setup and [docs/DOCKER.md](docs/DOCKER.md) for Docker deployment instructions.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run dev:clean` | Clear caches and restart the dev server |
| `npm run preview` | Local Workers runtime with D1 bindings |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run build` | Production build |
| `npm run cf-typegen` | Generate Cloudflare binding types |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `docker compose up -d --build` | Build and start the Docker container |

## Troubleshooting

### Internal Server Error after code changes

Dev and production builds share the `.next` folder. Running `npm run build` while `npm run dev` is active can corrupt the cache and cause 500 errors.

Quick fix:

```bash
npm run dev:clean
```

Or manually stop the dev server and run `npm run clean` followed by `npm run dev`.

## Contributing

Contributions are welcome. If you want to improve the app, open an issue or submit a pull request.

## Support

If you enjoy the project, consider supporting it via PayPal: https://paypal.me/kcdesplanches

## License

MIT
