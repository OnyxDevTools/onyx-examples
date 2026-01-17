#!/usr/bin/env bash
set -euo pipefail

# Installs prerequisites, installs dependencies, builds, and starts the app.

MIN_NODE_MAJOR=18
MIN_NODE_MINOR=18

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

node_meets_minimum() {
  local version="$1"
  local major minor patch
  IFS=. read -r major minor patch <<<"${version#v}"

  if (( major > MIN_NODE_MAJOR )); then
    return 0
  fi

  if (( major == MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR )); then
    return 0
  fi

  return 1
}

install_node() {
  local os
  os="$(uname -s)"

  case "$os" in
    Darwin)
      if command_exists brew; then
        echo "Installing Node.js via Homebrew..."
        brew install node@20 || brew upgrade node@20 || brew install node
        if brew list node@20 >/dev/null 2>&1; then
          brew link --overwrite --force node@20
        fi
      else
        echo "Homebrew not found. Install Homebrew or Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ manually." >&2
      fi
      ;;
    Linux)
      if command_exists apt-get; then
        echo "Installing Node.js via apt (NodeSource 20.x)..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
      elif command_exists pacman; then
        echo "Installing Node.js via pacman..."
        sudo pacman -S --noconfirm nodejs npm
      else
        echo "No supported package manager found. Install Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ manually." >&2
      fi
      ;;
    *)
      echo "Unsupported OS ${os}. Install Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ manually." >&2
      ;;
  esac
}

ensure_node() {
  if command_exists node; then
    local current
    current="$(node -v)"

    if node_meets_minimum "$current"; then
      echo "Using Node.js ${current#v}."
    else
      echo "Node.js ${current#v} is below required ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}. Upgrading..."
      install_node
    fi
  else
    echo "Node.js not found. Installing..."
    install_node
  fi

  if ! command_exists node || ! node_meets_minimum "$(node -v)"; then
    echo "Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ is required. Please install it manually and re-run." >&2
    exit 1
  fi

  if ! command_exists npm; then
    echo "npm not found even after ensuring Node.js. Please install npm and retry." >&2
    exit 1
  fi
}

main() {
  echo "Preparing to run Onyx Tasks app..."
  cd "$ROOT_DIR"

  ensure_node

  echo "Installing npm dependencies..."
  npm install

  echo "Building app..."
  npm run build

  if [[ "${SKIP_START:-0}" == "1" ]]; then
    echo "SKIP_START=1 detected; skipping start step."
    exit 0
  fi

  echo "Starting app..."
  npm run start
}

main "$@"
