#!/bin/sh
set -e

# Ensure data directory exists and is owned by nextjs user (UID 1001)
mkdir -p /app/data
chown -R nextjs:nodejs /app/data 2>/dev/null || chmod -R 777 /app/data 2>/dev/null || true

# Execute command as nextjs user
exec su-exec nextjs "$@"
