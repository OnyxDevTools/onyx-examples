#!/usr/bin/env bash
set -euo pipefail

# Runs a full CRUD flow against the running API and reports success/failure.
# Ensure the server is running (npm run dev/start) before executing.

BASE_URL="${BASE_URL:-http://localhost:3000}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

echo "Using API base: $BASE_URL"

LAST_BODY=""
LAST_STATUS=""

call() {
  local method="$1"
  local path="$2"
  local data="${3-}"

  if [ -n "$data" ]; then
    response="$(curl -sS -w '\n%{http_code}' -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$path")"
  else
    response="$(curl -sS -w '\n%{http_code}' -X "$method" "$BASE_URL$path")"
  fi

  LAST_BODY="${response%$'\n'*}"
  LAST_STATUS="${response##*$'\n'}"

  echo "---- $method $path (status: $LAST_STATUS)"
  if [ -n "$LAST_BODY" ]; then
    echo "$LAST_BODY" | jq .
  else
    echo "(no body)"
  fi
  echo
}

assert_status() {
  local expected="$1"
  local label="$2"
  if [ "$LAST_STATUS" != "$expected" ]; then
    echo "❌ $label (expected $expected, got $LAST_STATUS)"
    exit 1
  else
    echo "✅ $label"
  fi
}

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
title="Test task $timestamp"

# Create
call POST "/api/tasks" "{\"title\":\"$title\",\"description\":\"demo create\",\"dueDate\":\"$timestamp\"}"
assert_status "201" "Create task"
task_id="$(echo "$LAST_BODY" | jq -r '.data.id')"
if [ -z "$task_id" ] || [ "$task_id" = "null" ]; then
  echo "❌ Failed to capture task id from create response"
  exit 1
fi
echo "Task ID: $task_id"
echo

# List
call GET "/api/tasks"
assert_status "200" "List tasks"

# Get by id
call GET "/api/tasks/$task_id"
assert_status "200" "Get task by id"

# Update (PUT)
call PUT "/api/tasks/$task_id" "{\"title\":\"$title (updated)\",\"status\":\"in_progress\"}"
assert_status "200" "Update task (PUT)"

# Patch (partial update)
call PATCH "/api/tasks/$task_id" "{\"status\":\"completed\",\"description\":\"completed via patch\"}"
assert_status "200" "Patch task"

# Delete
call DELETE "/api/tasks/$task_id"
assert_status "204" "Delete task"

# Confirm deletion
call GET "/api/tasks/$task_id"
if [ "$LAST_STATUS" = "404" ]; then
  echo "✅ Confirm deletion returned 404"
else
  echo "❌ Expected 404 after delete, got $LAST_STATUS"
  exit 1
fi

echo "🎉 CRUD flow completed successfully."
