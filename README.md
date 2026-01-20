# onyx-examples
Onyx Database Integration Examples

## Example projects
- [python-django/](python-django/) — Django REST API for notes backed entirely by Onyx Database (via generated `onyx` models), with Swagger/OpenAPI at the root and a helper script that sets up the virtualenv and dev server.
- [typescript-express/](typescript-express/) — Guided Express + TypeScript tutorial that builds a tasks CRUD API on Onyx Database, exposes Swagger UI at `/`, and walks through schema pulls and optional type generation with `onyx-gen`.
- [kotlin-ktor/](kotlin-ktor/) — Ktor contacts CRUD service wired to the Onyx Cloud client with env-based config, CORS/logging enabled, and Swagger UI at the root for interactive calls.
- [java-springboot/](java-springboot/) — Spring Boot 3 customer API using the Kotlin-first Onyx client with DI wiring, validation, partition support, and Swagger UI at `/swagger-ui.html` (debug port + test script included).
- [go-gin/](go-gin/) — Go Gin CRUD API with generated Onyx client code, health check, and items endpoints documented by Swagger UI at the root (includes a convenience run script and sample `Item` schema).
- [onyx-ai-chatgpt-interoperability/](onyx-ai-chatgpt-interoperability/) — React + Vite chat console using the OpenAI SDK against Onyx Chat Completions, with Chatscope UI, streaming toggle, model picker, and a Vite proxy to Onyx/OpenAI.
- [onyx-tasks-app/](onyx-tasks-app/) — Next.js App Router task dashboard whose `/api/tasks` routes persist to Onyx Database using a typed schema; polished UI for creating, editing, toggling completion, and deleting tasks.
