# Onyx + Express Task Tracking API (Tutorial)

A step-by-step walkthrough for wiring an Express + TypeScript API to Onyx Database, with Swagger UI at `/` so you can try every endpoint.

## What you’ll build
- CRUD API for tasks at `/api/tasks`
- Persistence in Onyx Database (no in-memory storage)
- Interactive docs at `http://localhost:3000/`

## Prerequisites
- Node.js 18+ and npm
- Onyx account with a database (create at <https://cloud.onyx.dev>)

## 1) Install dependencies
```bash
npm install
```

## 2) Configure Onyx credentials
Onyx resolves credentials automatically. Pick one approach:
- **Config file (local dev):** In the Onyx console, generate API credentials and download `onyx-database.json`. Place it in the repo root and add it to `.gitignore`.

- **Environment variables (CI/production):**
  - `ONYX_DATABASE_ID`
  - `ONYX_DATABASE_BASE_URL` (e.g., `https://api.onysx.dev`)
  - `ONYX_DATABASE_API_KEY`
  - `ONYX_DATABASE_API_SECRET`

## 3) Define the schema in Onyx
In the Onyx console, open **Schema** and ask the AI assistant to create the `Task` table. Sample prompt:
```
Task table with UUID primary key id.
Fields: title (string, required), description (string, optional),
status (enum pending | in_progress | completed, default pending),
dueDate (ISO string, optional), createdAt (ISO string), updatedAt (ISO string).
```
Apply and **Publish** the schema.

## 4) Pull the schema locally (optional but handy)
```bash
npx onyx-schema get --out onyx.schema.json
```

## 5) Generate TypeScript types (optional)
```bash
npx onyx-gen --out src/onyx/types.ts --name OnyxSchema
```

## 6) Run the API
```bash
npm run dev
# then open http://localhost:3000/ for Swagger UI
```

## Onyx integration (code tour)
`src/repositories/taskRepository.ts` is where persistence lives:
```ts
import { onyx } from "@onyx.dev/onyx-database";

const db = onyx.init();            // resolves creds from env or onyx-database.json
await db.save("Task", task);       // create/update
const one = await db.findById("Task", id);
const list = await db.from("Task").list();
await db.delete("Task", id);
```
The rest of the stack follows a typical Express layout:
- Routes: `src/routes/taskRoutes.ts`
- Controllers: `src/controllers/taskController.ts`
- Services/validation: `src/services/taskService.ts`
- Swagger doc: `src/config/openapi.ts` (served at `/`)

## API routes
Base: `http://localhost:3000`
- `GET /api/tasks` – List tasks
- `POST /api/tasks` – Create (`title`, optional `description`, `dueDate`)
- `GET /api/tasks/:id` – Fetch a task
- `PUT/PATCH /api/tasks/:id` – Update fields (including `status`)
- `DELETE /api/tasks/:id` – Remove a task

## Scripts
- `npm run dev` – Start with hot reload
- `npm run typecheck` – TypeScript checks
- `npm run build` – Emit compiled JS to `dist/`
- `npm start` – Run the compiled server from `dist/`

## Troubleshooting
- Auth errors: confirm `onyx-database.json` exists or env vars are set.
- 404/500 on CRUD: ensure the `Task` table is published with the fields above.
- Types missing: rerun `npx onyx-gen ...` after schema changes.
