#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="${ROOT_DIR}/bin"
BINARY="${BIN_DIR}/server"
DEFAULT_GOROOT="${HOME}/.gvm/gos/go1.24.0"

# Favor the Go 1.24 toolchain if available to avoid mixed GOROOT issues.
if [ -d "${DEFAULT_GOROOT}" ] && [ "${GOROOT:-}" != "${DEFAULT_GOROOT}" ]; then
  export GOROOT="${DEFAULT_GOROOT}"
fi

if [ -n "${GOROOT:-}" ]; then
  export PATH="${GOROOT}/bin:${PATH}"
fi

cd "${ROOT_DIR}"
echo "Using Go toolchain: $(go version)"

echo "Downloading dependencies..."
go mod download

mkdir -p "${BIN_DIR}"
echo "Building server binary..."
go build -o "${BINARY}" ./cmd/api

SERVER_URL="http://localhost:8080"
echo "Starting server on ${SERVER_URL} ..."
echo "Open ${SERVER_URL}/health to check status."
exec "${BINARY}"
