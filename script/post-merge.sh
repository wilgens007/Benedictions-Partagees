#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "[post-merge] Installing locked dependencies"
npm ci --include=dev --no-audit --no-fund

echo "[post-merge] Building the application"
npm run build

# Database changes require separate review and approval; merging source code
# must not silently migrate data or invoke production content generation.
# Replit reconciles and restarts workflows after this script succeeds.
echo "[post-merge] Setup complete"
