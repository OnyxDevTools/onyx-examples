package handlers

import (
	"net/http"

	db "go-gin-api/gen/onyx"

	"github.com/gin-gonic/gin"
)

const swaggerHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Go Gin API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    const spec = {
      openapi: "3.0.1",
      info: {
        title: "Go Gin API",
        version: "1.0.0",
        description: "Simple Gin API with sample endpoints."
      },
      servers: [{ url: window.location.origin }],
      paths: {
        "/health": {
          get: {
            summary: "Health check",
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        status: { type: "string" }
                      },
                      example: { status: "ok" }
                    }
                  }
                }
              }
            }
          }
        },
        "/items": {
          get: {
            summary: "List items",
            responses: {
              "200": {
                description: "Items retrieved",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { "$ref": "#/components/schemas/Item" }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: "Create item",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: { type: "string", example: "New item" }
                    }
                  }
                }
              }
            },
            responses: {
              "201": {
                description: "Item created",
                content: {
                  "application/json": {
                    schema: { "$ref": "#/components/schemas/Item" }
                  }
                }
              },
              "400": {
                description: "Validation error",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/items/{id}": {
          get: {
            summary: "Get item",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Item",
                content: { "application/json": { schema: { "$ref": "#/components/schemas/Item" } } }
              },
              "404": { description: "Not found" }
            }
          },
          put: {
            summary: "Update item",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: { type: "string", example: "Updated name" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "Updated",
                content: { "application/json": { schema: { "$ref": "#/components/schemas/Item" } } }
              },
              "404": { description: "Not found" }
            }
          },
          delete: {
            summary: "Delete item",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "204": { description: "Deleted" },
              "404": { description: "Not found" }
            }
          }
        }
      },
      components: {
        schemas: {
          Item: {
            type: "object",
            properties: {
              id: { type: "string", example: "item_123" },
              name: { type: "string", example: "Sample item" }
            }
          }
        }
      }
    };

    SwaggerUIBundle({
      spec,
      dom_id: "#swagger-ui",
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`

func RegisterRoutes(router *gin.Engine, client db.DB) {
	items := NewItemsHandler(client)

	router.GET("/", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerHTML))
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.GET("/items", items.List)
	router.POST("/items", items.Create)
	router.GET("/items/:id", items.Get)
	router.PUT("/items/:id", items.Update)
	router.DELETE("/items/:id", items.Delete)
}
