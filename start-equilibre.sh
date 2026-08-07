#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/apps/equilibre"
PORT="${PORT:-5000}"

cd "$APP_DIR"
npm ci
exec npm run dev -- --host 0.0.0.0 --port "$PORT" --strictPort
