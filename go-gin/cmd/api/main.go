package main

import (
	"context"
	"log"

	onyx "go-gin-api/gen/onyx"
	"go-gin-api/internal/server"
)

func main() {
	ctx := context.Background()
	db, err := onyx.New(ctx, onyx.Config{}) // Initialize the Onyx client with credentials chain (e.g., environment variables, config files, etc.)
	if err != nil {
		log.Fatalf("failed to initialize Onyx client: %v", err)
	}

	router := server.New(db)
	log.Println("Starting server on :8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
