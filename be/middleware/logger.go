package middleware

import (
	"log"
	"net/http"
	"time"
)

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		log.Printf("Received %s %s from %s", r.Method, r.RequestURI, r.RemoteAddr)

		rec := statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(&rec, r)

		// Log outgoing response
		duration := time.Since(startTime)
		log.Printf("Sent %s %s with %d in %v", r.Method, r.RequestURI, rec.status, duration)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (rec *statusRecorder) WriteHeader(code int) {
	rec.status = code
	rec.ResponseWriter.WriteHeader(code)
}
