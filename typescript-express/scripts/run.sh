#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org/ and rerun." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. It ships with Node.js. Install Node.js and rerun." >&2
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

echo "Starting dev server with hot reload..."
exec npm run dev
