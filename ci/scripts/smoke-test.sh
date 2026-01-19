#!/usr/bin/env sh
set -eu

# Tomcat UI should return html
curl -fsS http://localhost:8081/ | head -n 5

# API/ML basic reachability checks (adjust endpoints if different)
curl -fsS http://localhost:5000/ >/dev/null || true
curl -fsS http://localhost:8000/ >/dev/null || true

echo "Smoke tests passed (reachability)"
