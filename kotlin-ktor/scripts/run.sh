#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

APP_PORT=${PORT:-8080}
DEBUG_PORT=${DEBUG_PORT:-5005}
DEBUG_SUSPEND=${DEBUG_SUSPEND:-n}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage: scripts/run.sh

Runs the Ktor server in debug mode.

Environment:
  PORT           HTTP port to bind (default: 8080)
  DEBUG_PORT     JDWP debug port (default: 5005)
  DEBUG_SUSPEND  Set to "y" to wait for debugger before starting (default: n)
  JAVA_OPTS      Extra JVM flags appended after the debug agent
USAGE
  exit 0
fi

select_java() {
  # Prefer JAVA_HOME if it points to a Java 21+ runtime.
  if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    echo "$JAVA_HOME/bin/java"
    return
  fi

  # macOS: try system helper for JDK 21.
  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    if JAVA_21_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null); then
      if [ -n "$JAVA_21_HOME" ] && [ -x "$JAVA_21_HOME/bin/java" ]; then
        export JAVA_HOME="$JAVA_21_HOME"
        echo "$JAVA_HOME/bin/java"
        return
      fi
    fi
  fi

  # Homebrew default path for OpenJDK 21 on Apple Silicon/Intel.
  if [ -x "/opt/homebrew/opt/openjdk@21/bin/java" ]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
    echo "$JAVA_HOME/bin/java"
    return
  fi
  if [ -x "/usr/local/opt/openjdk@21/bin/java" ]; then
    export JAVA_HOME="/usr/local/opt/openjdk@21"
    echo "$JAVA_HOME/bin/java"
    return
  fi

  # Fallback to whatever is on PATH.
  if command -v java >/dev/null 2>&1; then
    echo "$(command -v java)"
    return
  fi

  echo ""
}

ensure_java21() {
  JAVA_BIN=$(select_java || true)
  if [ -n "$JAVA_BIN" ]; then
    JAVA_VERSION=$("$JAVA_BIN" -version 2>&1 | head -n 1 | sed -E 's/.*version \"([0-9]+).*/\1/')
    if [ "${JAVA_VERSION:-0}" -ge 21 ]; then
      export JAVA_BIN
      return
    fi
  fi

  echo "Java 21+ not found, attempting installation..." >&2

  if command -v brew >/dev/null 2>&1; then
    brew install openjdk@21
    export JAVA_HOME="$(brew --prefix openjdk@21)"
    export PATH="$JAVA_HOME/bin:$PATH"
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y openjdk-21-jdk
    JAVA_HOME_CANDIDATE=$(ls -d /usr/lib/jvm/java-21-openjdk* 2>/dev/null | head -n 1 || true)
    if [ -n "$JAVA_HOME_CANDIDATE" ]; then
      export JAVA_HOME="$JAVA_HOME_CANDIDATE"
      export PATH="$JAVA_HOME/bin:$PATH"
    fi
  else
    echo "Unsupported platform or missing package manager. Install JDK 21+ manually and re-run." >&2
    exit 1
  fi

  JAVA_BIN=$(select_java || true)
  if [ -z "$JAVA_BIN" ]; then
    echo "Failed to locate Java 21+ after installation. Please install manually and set JAVA_HOME." >&2
    exit 1
  fi
  JAVA_VERSION=$("$JAVA_BIN" -version 2>&1 | head -n 1 | sed -E 's/.*version \"([0-9]+).*/\1/')
  if [ "${JAVA_VERSION:-0}" -lt 21 ]; then
    echo "Java 21+ required (found $JAVA_VERSION). Please install JDK 21+ and set JAVA_HOME." >&2
    exit 1
  fi
}

ensure_java21

load_onyx_env_from_json() {
  local json_path="$ROOT_DIR/onyx-database.json"
  if [ ! -f "$json_path" ]; then
    return
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    echo "Found $json_path but python3 is not available; skipping loading Onyx env vars." >&2
    return
  fi

  eval "$(
python3 <<'PY'
import json, shlex, sys
from pathlib import Path
path = Path("onyx-database.json")
try:
    data = json.loads(path.read_text())
except Exception as exc:  # noqa: BLE001
    print(f"echo \"Warning: failed to parse {path}: {exc}\" >&2")
    sys.exit(0)

mapping = {
    "baseUrl": "ONYX_BASE_URL",
    "databaseId": "ONYX_DATABASE_ID",
    "apiKey": "ONYX_API_KEY",
    "apiSecret": "ONYX_API_SECRET",
}

for src_key, env_key in mapping.items():
    val = data.get(src_key)
    if val:
        print(f"export {env_key}={shlex.quote(str(val))}")
PY
  )"
  echo "Loaded Onyx environment from $json_path" >&2
}

load_onyx_env_from_json

if [ ! -x ./gradlew ]; then
  chmod +x ./gradlew
fi

echo "Downloading dependencies and installing distribution..." >&2
./gradlew --no-daemon installDist

JAVA_DEBUG_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=${DEBUG_SUSPEND},address=*:${DEBUG_PORT}"
# Preserve any user-provided JAVA_OPTS while ensuring debug is enabled.
export JAVA_OPTS="${JAVA_OPTS:-} ${JAVA_DEBUG_OPTS}"

export PORT="$APP_PORT"
APP_BIN="./build/install/kotlin-ktor/bin/kotlin-ktor"

if [ ! -x "$APP_BIN" ]; then
  echo "App binary not found at $APP_BIN; installDist may have failed." >&2
  exit 1
fi

echo "Starting Ktor server in debug mode..." >&2
echo "Attach debugger on port ${DEBUG_PORT}." >&2
echo "Local URL: http://localhost:${APP_PORT}" >&2
exec "$APP_BIN"
