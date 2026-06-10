package obs

import (
	context "context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

// Context keys
var (
	requestIDKey = &struct{ k string }{"req_id"}
)

// Middleware attaches a request_id to the context and response header, and logs request start/end.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = newReqID()
		}
		ctx := context.WithValue(r.Context(), requestIDKey, reqID)

		// Ensure header for downstream services
		w.Header().Set("X-Request-ID", reqID)

		start := time.Now()
		logJSON(map[string]any{
			"ts":         start.UTC().Format(time.RFC3339Nano),
			"level":      "info",
			"event":      "request_start",
			"request_id": reqID,
			"method":     r.Method,
			"path":       r.URL.Path,
		})

		// Wrap ResponseWriter to capture status
		rl := &respLogger{ResponseWriter: w, status: 200}
		next.ServeHTTP(rl, r.WithContext(ctx))

		end := time.Now()
		dur := end.Sub(start)
		logJSON(map[string]any{
			"ts":         end.UTC().Format(time.RFC3339Nano),
			"level":      "info",
			"event":      "request_end",
			"request_id": reqID,
			"status":     rl.status,
			"duration_ms": float64(dur) / float64(time.Millisecond),
		})
	})
}

type respLogger struct {
	http.ResponseWriter
	status int
}

func (r *respLogger) WriteHeader(statusCode int) {
	r.status = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

// NewSpan starts a telemetry span; returns a function to end the span with optional fields.
func NewSpan(ctx context.Context, name string, fields map[string]any) func(extra map[string]any) {
	reqID := GetRequestID(ctx)
	start := time.Now()
	base := map[string]any{
		"ts":         start.UTC().Format(time.RFC3339Nano),
		"level":      "info",
		"event":      name + "_start",
		"request_id": reqID,
	}
	for k, v := range fields {
		base[k] = v
	}
	logJSON(base)
	return func(extra map[string]any) {
		end := time.Now()
		m := map[string]any{
			"ts":          end.UTC().Format(time.RFC3339Nano),
			"level":       "info",
			"event":       name + "_end",
			"request_id":  reqID,
			"duration_ms": float64(end.Sub(start)) / float64(time.Millisecond),
		}
		for k, v := range extra {
			m[k] = v
		}
		logJSON(m)
	}
}

// GetRequestID retrieves request_id from context.
func GetRequestID(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if v := ctx.Value(requestIDKey); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// InjectRequestID adds X-Request-ID to outbound requests if present in ctx.
func InjectRequestID(ctx context.Context, req *http.Request) {
	if req == nil {
		return
	}
	if rid := GetRequestID(ctx); rid != "" {
		req.Header.Set("X-Request-ID", rid)
	}
}

// Helper to log JSON to stdout as a single line
func logJSON(m map[string]any) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(m)
}

func newReqID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
