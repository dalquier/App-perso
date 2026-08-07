#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/apps/equilibre"

cd "$APP_DIR"
npm ci
npm run build
exec node scripts/replit-server.mjs
