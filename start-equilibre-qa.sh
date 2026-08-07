#!/usr/bin/env bash
set -euo pipefail

# Replit QA launcher for Équilibre BUILD-04.
# Clean up any stale Vite process left by a previous branch/workflow run.
pkill -f "vite.*5000" 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 5000/tcp 2>/dev/null || true
fi

cd apps/equilibre
npm ci
exec npm run dev -- --host 0.0.0.0 --port 5000 --strictPort
