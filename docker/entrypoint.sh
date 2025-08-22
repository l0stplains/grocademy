#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for Postgres..."
  ATTEMPTS=0
  until nc -z "$(echo "$DATABASE_URL" | sed -E 's|.*//[^@]*@([^:/]+):?([0-9]*)/.*|\1 \2|')" >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -gt 6 ]; then
      echo "Postgres wait timed out"
      break
    fi
    sleep 1
  done
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database..."
  node dist/prisma/seed.js || true
fi

echo "Starting app..."
node dist/src/main.js