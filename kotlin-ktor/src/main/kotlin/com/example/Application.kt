package com.example

import com.onyx.cloud.api.delete
import com.onyx.cloud.api.eq
import com.onyx.cloud.api.findById
import com.onyx.cloud.api.from
import com.onyx.cloud.api.save
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.slf4j.event.Level

@Serializable
data class Contact(
    val id: String? = null,
    val name: String,
    val email: String? = null,
)

@Serializable
data class ContactPayload(
    val name: String,
    val email: String? = null,
)

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8080
    embeddedServer(Netty, port = port) {
        installPlugins()
        configureRoutes()
    }.start(wait = true)
}

fun Application.installPlugins() {
    install(ContentNegotiation) {
        json()
    }
    install(CallLogging) {
        level = Level.INFO
    }
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
}

fun Application.configureRoutes() {
    val onyxClientManager = OnyxClientManager()

    routing {
        get("/") {
            call.respondText(
                contentType = ContentType.Text.Html,
                text =
                    """
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <title>Ktor API Docs</title>
                      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.10/swagger-ui.min.css" />
                      <style>body { margin: 0; padding: 0; }</style>
                    </head>
                    <body>
                      <div id="swagger-ui"></div>
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.10/swagger-ui-bundle.min.js"></script>
                      <script>
                        window.onload = () => {
                          SwaggerUIBundle({
                            url: '/openapi.json',
                            dom_id: '#swagger-ui',
                          });
                        };
                      </script>
                    </body>
                    </html>
                    """.trimIndent(),
            )
        }

        get("/openapi.json") {
            call.respondText(
                contentType = ContentType.Application.Json,
                text = openApiSpec,
            )
        }

        get("/health") {
            call.respondText("ok")
        }

        route("/contacts") {
            get {
                val config = onyxClientManager.currentConfig()
                if (config == null) {
                    return@get call.respond(
                        status = HttpStatusCode.ServiceUnavailable,
                        message = mapOf("error" to "Onyx is not configured"),
                    )
                }

                runCatching {
                    val db = onyxClientManager.database()
                    db.from<Contact>().pageSize(50).list<Contact>().toList()
                }.onSuccess { contacts ->
                    call.respond(contacts)
                }.onFailure { throwable ->
                    call.respond(
                        status = HttpStatusCode.BadGateway,
                        message = mapOf("error" to "Failed to list contacts", "message" to (throwable.message ?: "Unknown error")),
                    )
                }
            }

            post {
                val config = onyxClientManager.currentConfig()
                if (config == null) {
                    return@post call.respond(
                        status = HttpStatusCode.ServiceUnavailable,
                        message = mapOf("error" to "Onyx is not configured"),
                    )
                }

                val payload = call.receive<ContactPayload>()
                runCatching {
                    val db = onyxClientManager.database()
                    db.save(Contact(name = payload.name, email = payload.email))
                }.onSuccess { created ->
                    call.respond(status = HttpStatusCode.Created, message = created)
                }.onFailure { throwable ->
                    call.respond(
                        status = HttpStatusCode.BadGateway,
                        message = mapOf("error" to "Failed to create contact", "message" to (throwable.message ?: "Unknown error")),
                    )
                }
            }

            get("{id}") {
                val id = call.parameters["id"]
                if (id.isNullOrBlank()) {
                    return@get call.respond(
                        status = HttpStatusCode.BadRequest,
                        message = mapOf("error" to "Missing contact id"),
                    )
                }

                val config = onyxClientManager.currentConfig()
                if (config == null) {
                    return@get call.respond(
                        status = HttpStatusCode.ServiceUnavailable,
                        message = mapOf("error" to "Onyx is not configured"),
                    )
                }

                runCatching {
                    val db = onyxClientManager.database()
                    db.findById<Contact>(Contact::class, id)
                }.onSuccess { contact ->
                    if (contact == null) {
                        call.respond(status = HttpStatusCode.NotFound, message = mapOf("error" to "Contact not found"))
                    } else {
                        call.respond(contact)
                    }
                }.onFailure { throwable ->
                    call.respond(
                        status = HttpStatusCode.BadGateway,
                        message = mapOf("error" to "Failed to fetch contact", "message" to (throwable.message ?: "Unknown error")),
                    )
                }
            }

            put("{id}") {
                val id = call.parameters["id"]
                if (id.isNullOrBlank()) {
                    return@put call.respond(
                        status = HttpStatusCode.BadRequest,
                        message = mapOf("error" to "Missing contact id"),
                    )
                }

                val config = onyxClientManager.currentConfig()
                if (config == null) {
                    return@put call.respond(
                        status = HttpStatusCode.ServiceUnavailable,
                        message = mapOf("error" to "Onyx is not configured"),
                    )
                }

                val payload = call.receive<ContactPayload>()
                runCatching {
                    val db = onyxClientManager.database()
                    db.from<Contact>()
                        .where("id" eq id)
                        .setUpdates("name" to payload.name, "email" to payload.email)
                        .update()
                    db.findById<Contact>(Contact::class, id)
                }.onSuccess { updated ->
                    if (updated == null) {
                        call.respond(status = HttpStatusCode.NotFound, message = mapOf("error" to "Contact not found"))
                    } else {
                        call.respond(updated)
                    }
                }.onFailure { throwable ->
                    call.respond(
                        status = HttpStatusCode.BadGateway,
                        message = mapOf("error" to "Failed to update contact", "message" to (throwable.message ?: "Unknown error")),
                    )
                }
            }

            delete("{id}") {
                val id = call.parameters["id"]
                if (id.isNullOrBlank()) {
                    return@delete call.respond(
                        status = HttpStatusCode.BadRequest,
                        message = mapOf("error" to "Missing contact id"),
                    )
                }

                val config = onyxClientManager.currentConfig()
                if (config == null) {
                    return@delete call.respond(
                        status = HttpStatusCode.ServiceUnavailable,
                        message = mapOf("error" to "Onyx is not configured"),
                    )
                }

                runCatching {
                    val db = onyxClientManager.database()
                    val existing = db.findById<Contact>(Contact::class, id)
                    if (existing == null) {
                        null
                    } else {
                        db.delete<Contact>(id)
                        existing
                    }
                }.onSuccess { existing ->
                    if (existing == null) {
                        call.respond(status = HttpStatusCode.NotFound, message = mapOf("error" to "Contact not found"))
                    } else {
                        call.respond(HttpStatusCode.NoContent)
                    }
                }.onFailure { throwable ->
                    call.respond(
                        status = HttpStatusCode.BadGateway,
                        message = mapOf("error" to "Failed to delete contact", "message" to (throwable.message ?: "Unknown error")),
                    )
                }
            }
        }
    }
}

private val openApiSpec =
    """
    {
      "openapi": "3.0.1",
      "info": {
        "title": "Sample Ktor API",
        "version": "0.0.1"
      },
      "servers": [
        { "url": "http://localhost:8080" }
      ],
      "paths": {
        "/contacts": {
          "get": {
            "summary": "List contacts (first page, 50 items)",
            "responses": {
              "200": {
                "description": "Contacts",
                "content": {
                  "application/json": {
                    "schema": { "type": "array", "items": { "${'$'}ref": "#/components/schemas/Contact" } }
                  }
                }
              },
              "503": { "description": "Onyx not configured" }
            }
          },
          "post": {
            "summary": "Create a contact",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": { "${'$'}ref": "#/components/schemas/ContactPayload" },
                  "example": { "name": "Ada Lovelace", "email": "ada@example.com" }
                }
              }
            },
            "responses": {
              "201": {
                "description": "Created",
                "content": {
                  "application/json": {
                    "schema": { "${'$'}ref": "#/components/schemas/Contact" }
                  }
                }
              },
              "503": { "description": "Onyx not configured" }
            }
          }
        },
        "/contacts/{id}": {
          "get": {
            "summary": "Get a contact by id",
            "parameters": [
              { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
            ],
            "responses": {
              "200": { "description": "Contact", "content": { "application/json": { "schema": { "${'$'}ref": "#/components/schemas/Contact" } } } },
              "404": { "description": "Not found" },
              "503": { "description": "Onyx not configured" }
            }
          },
          "put": {
            "summary": "Update a contact",
            "parameters": [
              { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": { "${'$'}ref": "#/components/schemas/ContactPayload" },
                  "example": { "name": "Ada Lovelace", "email": "ada@newdomain.com" }
                }
              }
            },
            "responses": {
              "200": { "description": "Updated contact", "content": { "application/json": { "schema": { "${'$'}ref": "#/components/schemas/Contact" } } } },
              "404": { "description": "Not found" },
              "503": { "description": "Onyx not configured" }
            }
          },
          "delete": {
            "summary": "Delete a contact",
            "parameters": [
              { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
            ],
            "responses": {
              "204": { "description": "Deleted" },
              "404": { "description": "Not found" },
              "503": { "description": "Onyx not configured" }
            }
          }
        },
        "/health": {
          "get": {
            "summary": "Health check",
            "responses": {
              "200": {
                "description": "OK",
                "content": {
                  "text/plain": { "schema": { "type": "string", "example": "ok" } }
                }
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "Contact": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "email": { "type": "string" }
            },
            "required": [ "name" ]
          },
          "ContactPayload": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "email": { "type": "string" }
            },
            "required": [ "name" ]
          }
        }
      }
    }
    """.trimIndent()
