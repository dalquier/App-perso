#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/apps/design-system"

npm ci
PORT="${PORT:-6006}"
exec npm run storybook -- --port "$PORT"
