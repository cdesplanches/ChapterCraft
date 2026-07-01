# Docker Hosting Guide (Local / Internal PC)

This guide explains how to run ChapterCraft in a Docker container on your local PC or local server. The application can be configured to connect directly to your **Cloudflare D1** database in production or to use local file storage.

---

## Architecture in Docker Mode

```
[Web Browser] → [Docker Next.js App (Internal PC)]
                          ↓ (Depending on configuration)
             ┌────────────┴────────────┐
             ▼                         ▼
  [Cloudflare D1 (Remote)]   [Local Folder /app/data]
   (via HTTP REST API)        (Docker Persistent Volume)
```

- **If Cloudflare credentials are configured**: All data (projects, chapters, users, and writing settings) is securely stored directly in your online Cloudflare D1 database.
- **If credentials are absent**: The application uses local file storage in the `/app/data` folder (which must be mounted as a volume to persist data).

---

## Prerequisites

1. [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.
2. If you are connecting to your remote Cloudflare D1 database:
   - Your Cloudflare **Account ID**.
   - Your D1 **Database ID**.
   - A Cloudflare **API Token** with edit permissions for D1 (`D1 -> Edit`).

---

## Configuration via `.env` file

Create a file named `.env` at the root of the project to configure the application. The current Compose file passes these values to both the build stage and the runtime container, but they are optional.

```env
# Mandatory secret key in production to sign session cookies.
# Generate a secure key with: openssl rand -hex 32
AUTH_SECRET=your-random-secret-key-here

# --- CLOUDFLARE D1 CONFIGURATION (Optional) ---
# Fill in these variables only if you want your local Docker to
# connect directly to your remote Cloudflare D1 database.
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_API_TOKEN=your_d1_edit_api_token
```

> [!WARNING]
> If you modify the variables in the `.env` file, recreate the container for them to take effect: `docker compose up -d --build`.

---

## Quick Start

### 1. Build and start the container

Run the following command at the project root:

```bash
docker compose up -d --build
```

The container will build the Next.js application in `standalone` mode (optimized for size and performance) and then start the web server.

### 2. Access the application

Open your browser at: [http://localhost:3000](http://localhost:3000).

---

## Data Management and Persistence

### Remote Cloudflare D1 Mode

When `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_API_TOKEN` are set, the app connects to Cloudflare D1 and stores projects, users, chapters, and settings remotely.
The local `./data` folder mounted by Docker is then only used as a fallback location or remains empty.

### Local Storage Mode (Fallback)

If the `CLOUDFLARE_*` variables are not configured, all data is saved in the `./data` folder on the host machine (your PC).
Thanks to the volume mount configured in `docker-compose.yml`:
```yaml
volumes:
  - ./data:/app/data
```
Your files will persist even if the Docker container is stopped, updated, or deleted.

---

## Useful Commands

- **Stop the application**:
  ```bash
  docker compose down
  ```
- **View logs**:
  ```bash
  docker compose logs -f
  ```
- **Restart the service**:
  ```bash
  docker compose restart
  ```
