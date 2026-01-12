#!/usr/bin/env bash
set -euo pipefail

# Basic smoke test for CRUD endpoints. Requires jq.

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse responses; install jq and retry." >&2
  exit 1
fi

request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  local tmp
  tmp="$(mktemp)"
  local status
  if [[ -n "${body}" ]]; then
    status="$(curl -sS -o "${tmp}" -w '%{http_code}' -X "${method}" \
      -H "Content-Type: application/json" \
      -d "${body}" \
      "${url}")"
  else
    status="$(curl -sS -o "${tmp}" -w '%{http_code}' -X "${method}" "${url}")"
  fi
  local resp
  resp="$(cat "${tmp}")"
  rm -f "${tmp}"
  echo "${status}"$'\n'"${resp}"
}

require_status() {
  local expected="$1"
  local actual="$2"
  local context="$3"
  if [[ "${actual}" != "${expected}" ]]; then
    echo "❌ ${context} failed (expected ${expected}, got ${actual})" >&2
    exit 1
  fi
}

echo "Using API_BASE_URL=${API_BASE_URL}"

success=true

# Create
create_body='{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "age": 36,
  "isActive": true,
  "balance": 123.45,
  "countryCode": "UK"
}'
output="$(request "POST" "${API_BASE_URL}/api/customers" "${create_body}")"
status="$(echo "${output}" | head -n1)"
resp="$(echo "${output}" | tail -n +2)"
echo "--- CREATE (status ${status}) ---"
echo "${resp}"
require_status "201" "${status}" "create"
customer_id="$(echo "${resp}" | jq -r '.customerId // empty')"
if [[ -z "${customer_id}" ]]; then
  echo "❌ create succeeded but no customerId returned" >&2
  exit 1
fi

# Read
output="$(request "GET" "${API_BASE_URL}/api/customers/${customer_id}?countryCode=UK")"
status="$(echo "${output}" | head -n1)"
resp="$(echo "${output}" | tail -n +2)"
echo "--- READ (status ${status}) ---"
echo "${resp}"
require_status "200" "${status}" "read"

# Update
update_body='{
  "firstName": "Ada",
  "lastName": "Byron",
  "email": "ada.byron@example.com",
  "age": 37,
  "isActive": true,
  "balance": 200.00,
  "countryCode": "UK"
}'
output="$(request "PUT" "${API_BASE_URL}/api/customers/${customer_id}?countryCode=UK" "${update_body}")"
status="$(echo "${output}" | head -n1)"
resp="$(echo "${output}" | tail -n +2)"
echo "--- UPDATE (status ${status}) ---"
echo "${resp}"
require_status "200" "${status}" "update"

# List
output="$(request "GET" "${API_BASE_URL}/api/customers?countryCode=UK&pageSize=5")"
status="$(echo "${output}" | head -n1)"
resp="$(echo "${output}" | tail -n +2)"
echo "--- LIST (status ${status}) ---"
echo "${resp}"
require_status "200" "${status}" "list"

# Delete
output="$(request "DELETE" "${API_BASE_URL}/api/customers/${customer_id}?countryCode=UK")"
status="$(echo "${output}" | head -n1)"
resp="$(echo "${output}" | tail -n +2)"
echo "--- DELETE (status ${status}) ---"
echo "${resp}"
require_status "204" "${status}" "delete"

echo "✅ CRUD test sequence completed successfully."
