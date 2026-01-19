#!/usr/bin/env sh
set -eu

URL="$1"
MAX_RETRIES="${2:-60}"

i=1
while [ "$i" -le "$MAX_RETRIES" ]; do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "OK: $URL"
    exit 0
  fi
  echo "Waiting for $URL ($i/$MAX_RETRIES)..."
  i=$((i+1))
  sleep 2
done

echo "ERROR: $URL not ready after $MAX_RETRIES attempts"
exit 1
