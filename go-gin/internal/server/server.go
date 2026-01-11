package server

import (
	db "go-gin-api/gen/onyx"
	"go-gin-api/internal/handlers"

	"github.com/gin-gonic/gin"
)

// New constructs a Gin router with all application routes registered.
func New(client db.DB) *gin.Engine {
	router := gin.Default()
	handlers.RegisterRoutes(router, client)
	return router
}
