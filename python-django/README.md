# Django Notes API

Simple Django REST API with a Note model and an OpenAPI/Swagger playground at the root URL.

## Quickstart
- Ensure Python 3 is available.
- From the repo root, run: `./scripts/run.sh`
  - Creates `.venv` if missing, installs requirements, runs Django checks, starts the dev server with autoreload on port 8000.
- Open `http://127.0.0.1:8000/` for the interactive Swagger UI (schema JSON at `/schema/`).

## Manual setup (optional)
```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py runserver  # dev server with autoreload
```

## Endpoints
- `/api/notes/` – list/create notes.
- `/api/notes/<id>/` – retrieve/update/delete a note.
- `/` – Swagger UI playground for the API.
- `/schema/` – OpenAPI JSON.

## Onyx Database integration
- Provision in the cloud: go to https://cloud.onyx.dev, create a Database, and use the AI Assistant to add a `Note` schema. Create a Database API Key, download the JSON, and save it to `config/onyx-database.json` (or set env vars below).
- Pull schema and generate models locally:
  ```bash
  onyx-py schema get   # writes schema/onyx.schema.json from your cloud schema
  onyx-py gen          # generates ./onyx models/tables/schema map
  ```

## Django wiring to use Onyx-backed CRUD:
  - `api/views.py` uses the generated `onyx` package (`SCHEMA`, `Note` model) with `onyx_database.onyx.init(**cfg)`; all CRUD hits Onyx, not the local DB.
  - Serializer expects camelCase fields (`createdAt`, `updatedAt`); `id` auto-generates a UUID if omitted on create.
  - Example excerpt:
    ```py
    # api/views.py
    cfg = {**settings.ONYX_DATABASE, "model_map": SCHEMA}
    client = onyx_facade.init(**{k: v for k, v in cfg.items() if v})
    page = client.from_table(self._table()).limit(limit).page(page_size=limit, model=OnyxNote)
    ```
- Schema file lives at `schema/onyx.schema.json` for `onyx-py schema validate/publish`.

## Dependencies
Key packages: Django, Django REST Framework, drf-spectacular (Swagger/OpenAPI), onyx-database SDK, plus generated `requirements.txt` for full versions.
