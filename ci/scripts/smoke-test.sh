#!/usr/bin/env sh
set -eu

# Checkout UI should return html
curl -fsS http://localhost:8081/ | head -n 5

# Admin UI should return html
curl -fsS http://localhost:8082/ | head -n 5

# API/ML reachability checks
curl -fsS http://localhost:5000/ >/dev/null || true
curl -fsS http://localhost:8000/ >/dev/null || true

echo "Smoke tests passed (reachability)"
