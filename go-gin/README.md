# Go Gin API Example

Gin server backed by Onyx with a Swagger UI at the root, a health check, and simple items endpoints.

## Prerequisites
- Go 1.24 toolchain (script expects `~/.gvm/gos/go1.24.0` if you use gvm).
- `bash` and `git`.
- Onyx database credentials (env vars or `config/onyx-database.json`).

## Project layout
- `cmd/api/main.go` — entrypoint wiring Onyx client and Gin router.
- `internal/server` — router construction.
- `internal/handlers` — Swagger root, health, and items endpoints (list/create/get/update/delete).
- `gen/onyx` — generated Onyx client (do not edit).

## Setup & Run
1) From the project root, make the helper executable if needed:  
   `chmod +x scripts/run.sh`
2) Start the app (handles `GOROOT`, downloads deps, builds, and runs):  
   `scripts/run.sh`
3) Open the interactive docs at `http://localhost:8080` and exercise endpoints directly.

If you prefer manual commands:
```
export GOROOT=${GOROOT:-$HOME/.gvm/gos/go1.24.0}
export PATH="$GOROOT/bin:$PATH"
go mod download
go run ./cmd/api
```

## Onyx integration
- The app initializes the Onyx client on startup and uses the generated client in `gen/onyx` to persist items to the `Item` table (fields: `id` string, `name` string).
- Create a Database and api key at https://cloud.onyx.dev, and download the config file and store here `config/onyx-database.json` (shape from the SDK docs):
  ```json
  {
    "databaseId": "your_db_id",
    "databaseBaseUrl": "https://api.onyx.dev",
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret"
  }
  ```
## Onyx schema steps (example session)
With `config/onyx-database.json` in place, run:
```
onyx-go schema info   # shows resolved config, verifies connectivity
onyx-go schema get    # writes api/onyx.schema.json from your database
onyx-go gen           # generates client code into ./gen/onyx/*.go
```

Schema fetched (from `api/onyx.schema.json`):
```json
{
  "tables": [
    {
      "name": "Item",
      "fields": [
        { "name": "id", "type": "String", "primaryKey": true },
        { "name": "name", "type": "String" }
      ]
    }
  ]
}
```

## Generated client (from `gen/onyx`):
```go
type DB struct { core onyx.Client }
func New(ctx context.Context, cfg onyx.Config) (DB, error)
func (c DB) Items() ItemsClient

type ItemsClient struct { /* fluent query methods */ }
func (c ItemsClient) List(ctx context.Context) ([]Item, error)
func (c ItemsClient) Save(ctx context.Context, item Item, cascades ...onyx.CascadeSpec) (Item, error)
```

## CRUD usage in this app (simplified):
```go
client, _ := gen.New(ctx, gen.Config{})        // init once
items, _ := client.Items().OrderBy("id", true).List(ctx) // GET /items

item := gen.Item{Id: "item_123", Name: "Example"}
saved, _ := client.Items().Save(ctx, item)     // POST /items
_ = saved
```


## Endpoints
- `/` — Swagger UI to try endpoints.
- `/health` — `GET` returns `{"status":"ok"}`.
- `/items` — `GET` list items; `POST` create `{ "name": "New item" }`.
- `/items/:id` — `GET` fetch by id; `PUT` update `{ "name": "Updated" }`; `DELETE` remove (404 if missing).

Example:
```
curl -X POST http://localhost:8080/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample item"}'
```

## Development Notes
- `go test ./...` (ensure `GOROOT` points at Go 1.24 to avoid mixed-toolchain issues).
- Binary output goes to `bin/server` when using `scripts/run.sh`.
