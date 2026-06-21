#!/usr/bin/env bash
# Upload local data/ projects and settings to R2 for cloud deployment.
# Usage: STORAGE_USER_ID=you@example.com ./scripts/upload-local-to-r2.sh

set -euo pipefail

BUCKET="chaptercraft-data"
USER_ID="${STORAGE_USER_ID:?Set STORAGE_USER_ID to your Access email}"
DATA_DIR="${1:-./data}"

if [ ! -d "$DATA_DIR/projects" ]; then
  echo "No $DATA_DIR/projects directory found."
  exit 1
fi

echo "Uploading to R2 bucket $BUCKET for user $USER_ID..."

for file in "$DATA_DIR/projects"/*.json; do
  [ -f "$file" ] || continue
  name=$(basename "$file")
  key="users/${USER_ID}/projects/${name}"
  echo "  → $key"
  npx wrangler r2 object put "$BUCKET/$key" --file="$file" --content-type=application/json
done

if [ -f "$DATA_DIR/settings.json" ]; then
  key="users/${USER_ID}/settings.json"
  echo "  → $key"
  npx wrangler r2 object put "$BUCKET/$key" --file="$DATA_DIR/settings.json" --content-type=application/json
fi

echo "Done."
