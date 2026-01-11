#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:8080}
NAME=${NAME:-test}
EMAIL=${EMAIL:-test@example.com}

log() { printf '\n==== %s ====' "$1"; }

# Create contact
log "POST /contacts"
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\"}")
echo "Response: $POST_RESPONSE"

CONTACT_ID=$(echo "$POST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('id',''))")
if [ -z "$CONTACT_ID" ]; then
  echo "Failed to parse contact id from response" >&2
  exit 1
fi

echo "Created contact id: $CONTACT_ID"

# Get by id
log "GET /contacts/$CONTACT_ID"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/contacts/$CONTACT_ID" -H 'accept: application/json')
echo "Response: $GET_RESPONSE"

# Delete
log "DELETE /contacts/$CONTACT_ID"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/contacts/$CONTACT_ID" -H 'accept: */*' -w "\nStatus: %{http_code}\n")
echo "Response: $DELETE_RESPONSE"
