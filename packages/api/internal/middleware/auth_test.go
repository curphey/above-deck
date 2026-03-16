package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/curphey/above-deck/api/internal/middleware"
)

func TestAuth_NoHeader(t *testing.T) {
	handler := middleware.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.UserIDFromContext(r.Context())
		if userID != "" {
			t.Error("expected empty userID for anonymous request")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
}

func TestAuth_WithBearer(t *testing.T) {
	handler := middleware.Auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.UserIDFromContext(r.Context())
		if userID == "" {
			t.Error("expected userID from bearer token")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer test-jwt-token")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
}
