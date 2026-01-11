# Kotlin Ktor + Onyx Database Tutorial

This example shows how to wire a minimal Ktor server to Onyx Database for a simple contacts CRUD API, with Swagger UI for interactive calls.

## Prerequisites
- Java 21+
- Kotlin/Gradle (wrapper included)
- Onyx Cloud account and a database:
  1) Go to https://cloud.onyx.dev and create/sign in to your account.
  2) Create a database (note the database ID).
  3) In the dashboard, create API keys (API key + API secret) for that database.
  4) Export these as env vars before running:
     ```bash
     export ONYX_BASE_URL=https://api.onyx.dev
     export ONYX_DATABASE_ID=your-database-id
     export ONYX_API_KEY=your-api-key
     export ONYX_API_SECRET=your-api-secret
     ```

## Ktor setup (before Onyx)
**Gradle (excerpt)** — add Ktor server + JSON + CORS + logging:
```kotlin
plugins {
    kotlin("jvm") version "2.2.10"
    kotlin("plugin.serialization") version "2.2.10"
    application
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-cors-jvm:$ktorVersion")
    implementation("ch.qos.logback:logback-classic:1.4.14")
    implementation("dev.onyx:onyx-cloud-client:$onyxVersion")
}

application {
    mainClass.set("com.example.ApplicationKt")
}
```

**Application entry** — install JSON, logging, CORS, then routes:
```kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        install(ContentNegotiation) { json() }
        install(CallLogging)
        install(CORS) {
            allowHost("localhost:8080")
            allowHost("0.0.0.0:8080")
            allowCredentials = true
            allowNonSimpleContentTypes = true
            allowMethod(HttpMethod.Options)
            allowMethod(HttpMethod.Get)
            allowMethod(HttpMethod.Post)
            allowMethod(HttpMethod.Put)
            allowMethod(HttpMethod.Delete)
            allowHeader("*")
        }
        configureRoutes()
    }.start(wait = true)
}
```

## How Onyx is initialized
`OnyxDatabase.kt` builds a cached Onyx client from environment variables:
```kotlin
data class OnyxEnvConfig(
    val baseUrl: String,
    val databaseId: String,
    val apiKey: String,
    val apiSecret: String,
) {
    companion object {
        fun fromEnv(): OnyxEnvConfig? = OnyxEnvConfig(
            baseUrl = System.getenv("ONYX_BASE_URL") ?: "https://api.onyx.dev",
            databaseId = System.getenv("ONYX_DATABASE_ID") ?: return null,
            apiKey = System.getenv("ONYX_API_KEY") ?: return null,
            apiSecret = System.getenv("ONYX_API_SECRET") ?: return null,
        )
    }
}

class OnyxClientManager(
    private val configProvider: () -> OnyxEnvConfig? = { OnyxEnvConfig.fromEnv() }
) {
    private val cachedConfig = AtomicReference<OnyxEnvConfig?>()
    private val cachedDb = AtomicReference<IOnyxDatabase<Any>?>(null)

    fun currentConfig(): OnyxEnvConfig? = configProvider()

    @Synchronized
    fun database(): IOnyxDatabase<Any> {
        val config = configProvider() ?: error("Onyx is not configured.")
        cachedDb.getAndSet(null)?.close()
        val db = onyx.init<Any>(
            OnyxConfig(
                baseUrl = config.baseUrl,
                databaseId = config.databaseId,
                apiKey = config.apiKey,
                apiSecret = config.apiSecret,
            )
        )
        cachedConfig.set(config)
        cachedDb.set(db)
        return db
    }
}
```

## CRUD with Onyx (contacts)
Routes in `Application.kt` use the Onyx client:
```kotlin
@Serializable data class Contact(val id: String? = null, val name: String, val email: String? = null)
@Serializable data class ContactPayload(val name: String, val email: String? = null)

// List
get("/contacts") {
    val db = onyxClientManager.database()
    val contacts: List<Contact> = db.from<Contact>().pageSize(50).list<Contact>().toList()
    call.respond(contacts)
}

// Create
post("/contacts") {
    val payload = call.receive<ContactPayload>()
    val created = onyxClientManager.database().save(Contact(name = payload.name, email = payload.email))
    call.respond(HttpStatusCode.Created, created)
}

// Get by id
get("/contacts/{id}") {
    val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)
    val contact = onyxClientManager.database().findById<Contact>(Contact::class, id)
    contact?.let { call.respond(it) } ?: call.respond(HttpStatusCode.NotFound)
}

// Update
put("/contacts/{id}") {
    val id = call.parameters["id"] ?: return@put call.respond(HttpStatusCode.BadRequest)
    val payload = call.receive<ContactPayload>()
    val db = onyxClientManager.database()
    db.from<Contact>().where("id" eq id).setUpdates("name" to payload.name, "email" to payload.email).update()
    call.respond(db.findById<Contact>(Contact::class, id) ?: HttpStatusCode.NotFound)
}

// Delete
delete("/contacts/{id}") {
    val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
    val db = onyxClientManager.database()
    val existing = db.findById<Contact>(Contact::class, id)
    if (existing == null) {
        call.respond(HttpStatusCode.NotFound)
    } else {
        db.delete<Contact>(id)
        call.respond(HttpStatusCode.NoContent)
    }
}
```

## Running the server
Use the Gradle wrapper; the app starts on port 8080 with Swagger UI at `/`.
```bash
./gradlew run
# or assemble/installDist + run the generated binary:
# ./gradlew installDist
# ./build/install/kotlin-ktor/bin/kotlin-ktor
```

## Swagger UI
- Open `http://localhost:8080/` to access Swagger UI.
- The OpenAPI spec includes the `/contacts` CRUD endpoints.

## Troubleshooting
- **Auth/502/503**: ensure `ONYX_*` env vars are set and reachable.
- **CORS**: enabled for localhost (`localhost:8080` and `0.0.0.0:8080`).
- **Java version**: must be 21+. Install via your package manager if needed.
