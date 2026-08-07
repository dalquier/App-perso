#!/usr/bin/env bash
set -euo pipefail
cd apps/equilibre
if [ ! -d node_modules ]; then
  npm ci
fi
npm run dev -- --host 0.0.0.0 --port 5000
