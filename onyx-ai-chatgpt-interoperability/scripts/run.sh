#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BREW="$(command -v brew || true)"

log() {
  printf '==> %s\n' "$*"
}

if [ -f "$ROOT/.env.local" ]; then
  log "Loading environment from .env.local"
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env.local"
  set +a
fi

ensure_env() {
  local name="$1"
  if [ -z "${!name-}" ]; then
    printf 'Missing %s. Set it in .env.local or your shell.\n' "$name" >&2
    exit 1
  fi
}

install_node_with_brew() {
  if [ -z "$BREW" ]; then
    printf 'Homebrew not found. Install Node.js 18+ manually and re-run.\n' >&2
    exit 1
  fi
  log "Installing Node.js (brew install node@20)"
  "$BREW" list node@20 >/dev/null 2>&1 || "$BREW" install node@20
  local prefix
  prefix="$("$BREW" --prefix node@20)"
  export PATH="$prefix/bin:$PATH"
  log "Using Node from $prefix/bin"
}

ensure_node() {
  if command -v node >/dev/null 2>&1; then
    local version major
    version="$(node -v | sed 's/^v//')"
    major="${version%%.*}"
    if [ "$major" -lt 18 ]; then
      log "Node version $version is too old; updating"
      install_node_with_brew
    fi
  else
    log "Node.js not found; installing"
    install_node_with_brew
  fi
}

ensure_node
ensure_env VITE_OPENAI_API_KEY

cd "$ROOT"

log "Installing dependencies"
npm install

log "Building app"
npm run build

log "Starting dev server"
exec npm run dev
