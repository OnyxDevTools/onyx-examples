package handlers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/OnyxDevTools/onyx-database-go/onyx"
	db "go-gin-api/gen/onyx"

	"github.com/gin-gonic/gin"
)

type ItemsHandler struct {
	client db.DB
}

func NewItemsHandler(client db.DB) *ItemsHandler {
	return &ItemsHandler{client: client}
}

func (h *ItemsHandler) List(c *gin.Context) {
	items, err := h.client.Items().OrderBy("id", true).List(c.Request.Context())
	if err != nil {
		log.Printf("list items failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list items"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ItemsHandler) Create(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := db.Item{
		Id:   fmt.Sprintf("item_%d", time.Now().UnixNano()),
		Name: input.Name,
	}

	saved, err := h.client.Items().Save(c.Request.Context(), item)
	if err != nil {
		log.Printf("create item failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create item"})
		return
	}

	c.JSON(http.StatusCreated, saved)
}

func (h *ItemsHandler) Get(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	item, err := h.client.Items().FindByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("get item failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get item"})
		return
	}
	if item.Id == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *ItemsHandler) Update(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := db.NewItemUpdates().SetName(input.Name)
	updated, err := h.client.Items().
		Where(db.Eq("id", id)).
		SetItemUpdates(updates).
		Update(c.Request.Context())
	if err != nil {
		log.Printf("update item failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update item"})
		return
	}
	if updated == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	item, err := h.client.Items().FindByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("fetch updated item failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *ItemsHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	deleted, err := h.client.Items().DeleteByID(c.Request.Context(), id)
	if err != nil {
		if isNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
			return
		}
		log.Printf("delete item failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete item"})
		return
	}
	if deleted == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func isNotFound(err error) bool {
	var oe *onyx.Error
	if errors.As(err, &oe) {
		if strings.EqualFold(oe.Message, "Not Found") {
			return true
		}
		if status, ok := oe.Meta["status"]; ok {
			switch v := status.(type) {
			case int:
				return v == http.StatusNotFound
			case float64:
				return int(v) == http.StatusNotFound
			case string:
				if n, parseErr := strconv.Atoi(v); parseErr == nil && n == http.StatusNotFound {
					return true
				}
			}
		}
	}
	return false
}
