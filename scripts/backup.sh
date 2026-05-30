#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting GymPro backup: $TIMESTAMP"

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" --no-password --format=custom --compress=9 \
    --file="$BACKUP_DIR/gympro_$TIMESTAMP.pgdump" \
    && echo "[Backup] PostgreSQL dump saved" \
    || echo "[Backup] WARNING: PostgreSQL backup failed"
else
  echo "[Backup] WARNING: DATABASE_URL not set — skipping PostgreSQL backup"
fi

find "$BACKUP_DIR" -name "*.pgdump" -mtime +7 -delete 2>/dev/null || true
echo "[Backup] Done: $TIMESTAMP"
