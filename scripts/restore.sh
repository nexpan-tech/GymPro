#!/usr/bin/env bash
set -euo pipefail
BACKUP_FILE=${1:-""}
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.pgdump>"
  exit 1
fi
echo "[Restore] Restoring from $BACKUP_FILE to ${DATABASE_URL}"
pg_restore --no-password --clean --if-exists --format=custom \
  --dbname="$DATABASE_URL" "$BACKUP_FILE" \
  && echo "[Restore] Complete" \
  || echo "[Restore] FAILED"
