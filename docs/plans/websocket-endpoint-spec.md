# WebSocket Endpoint Implementation Spec

This document is a self-contained specification for adding real-time WebSocket endpoints to any module BFF built with `mod-arch-installer`. It is written so that a developer (or an AI coding assistant) can implement a WebSocket endpoint from scratch by following it step by step.

Every module BFF scaffolded by `mod-arch-installer` already includes the `internal/proxy` and `internal/ssrf` packages. No new dependencies are needed.

## Prerequisites

- Your module was scaffolded with `mod-arch-installer` (or cloned from `mod-arch-starter`)
- The `internal/proxy` package exists in your BFF with the WebSocket toolkit
- You have a K8s resource you want to stream to the frontend (e.g., pods, events, custom resources)

## Architecture

```text
┌──────────┐     ┌─────────────────────────────────────────────┐     ┌──────────┐
│          │     │                Module BFF                    │     │          │
│ Frontend │────>│  /api/v1/your-resource/watch                │     │   K8s    │
│          │     │    ├─ Auth (InjectRequestIdentity)          │     │   API    │
│          │<──>│    ├─ Business logic (validate, scope)       │     │  Server  │
│          │     │    ├─ proxy.DialK8sWebSocket() → target WS ┼────>│          │
│          │     │    ├─ proxy.NewUpgrader() ← client WS      │     │          │
│          │     │    └─ proxy.BridgeConnections()             │     │          │
└──────────┘     └─────────────────────────────────────────────┘     └──────────┘
```

The BFF endpoint is the gatekeeper. It decides **what** to watch, **who** can watch it, and **how** to transform or filter the data. The toolkit handles WebSocket plumbing (upgrade, dial, heartbeat, connection tracking, cleanup).

## Step-by-step implementation

### Step 1: Define the endpoint path and route constant

Add a route constant in `internal/api/app.go` alongside the existing ones:

```go
const (
    // ... existing constants ...
    WatchYourResourcePath = ApiPathPrefix + "/your-resource/watch"
)
```

### Step 2: Write the handler

Create a new file `internal/api/watch_handler.go` (or add to an existing handler file):

```go
package api

import (
    "fmt"
    "log/slog"
    "net/http"
    "net/url"

    "github.com/opendatahub-io/mod-arch-library/bff/internal/constants"
    k8s "github.com/opendatahub-io/mod-arch-library/bff/internal/integrations/kubernetes"
    "github.com/opendatahub-io/mod-arch-library/bff/internal/proxy"
    "github.com/opendatahub-io/mod-arch-library/bff/internal/ssrf"

    clientRest "k8s.io/client-go/rest"
    "k8s.io/client-go/tools/clientcmd"
)

func (app *App) WatchYourResourceHandler(w http.ResponseWriter, r *http.Request) {
    ctxLogger := r.Context().Value(constants.TraceLoggerKey).(*slog.Logger)

    // ── 1. Extract identity from middleware ────────────────────────
    identityVal := r.Context().Value(constants.RequestIdentityKey)
    if identityVal == nil {
        app.badRequestResponse(w, r, fmt.Errorf("missing request identity"))
        return
    }
    identity := identityVal.(*k8s.RequestIdentity)

    // ── 2. Business logic: validate and scope ─────────────────────
    namespace := r.URL.Query().Get("namespace")
    if namespace == "" {
        app.badRequestResponse(w, r, fmt.Errorf("missing required query parameter: namespace"))
        return
    }

    // Add your authorization check here:
    // e.g., verify the user can access this namespace or resource type.

    // ── 3. Resolve K8s API host ───────────────────────────────────
    k8sHost, err := resolveK8sAPIHost()
    if err != nil {
        app.serverErrorResponse(w, r, fmt.Errorf("failed to resolve K8s API host: %w", err))
        return
    }

    // ── 4. Build the K8s watch URL ────────────────────────────────
    // Adjust the resource path to match your K8s resource.
    targetWSURL := fmt.Sprintf("wss://%s/api/v1/namespaces/%s/pods?watch=true", k8sHost, namespace)
    targetURL, err := url.Parse(fmt.Sprintf("https://%s", k8sHost))
    if err != nil {
        app.serverErrorResponse(w, r, fmt.Errorf("invalid K8s API URL: %w", err))
        return
    }

    // ── 5. Configure TLS and SSRF protection ──────────────────────
    tlsConfig := proxy.NewTLSConfig(app.rootCAs, app.config.InsecureSkipVerify)

    // SSRF-safe dialer: blocks private IPs except the K8s API host.
    // In dev mode, you can pass nil instead to skip SSRF checks.
    var dialCtx func(ctx context.Context, network, addr string) (net.Conn, error)
    if !app.config.DevMode {
        dialCtx = ssrf.SafeDialContext(app.logger, k8sHost)
    }

    // ── 6. Dial K8s API WebSocket ─────────────────────────────────
    targetConn, _, err := proxy.DialK8sWebSocket(
        targetWSURL,
        tlsConfig,
        identity.Token,
        targetURL,
        dialCtx,
        nil, // client subprotocols — nil unless your frontend sends custom ones
    )
    if err != nil {
        ctxLogger.Error("Failed to dial K8s WebSocket",
            slog.String("url", targetWSURL),
            slog.Any("error", err))
        app.serverErrorResponse(w, r, fmt.Errorf("failed to connect to K8s API"))
        return
    }

    // ── 7. Upgrade the client (frontend) connection ───────────────
    upgrader := proxy.NewUpgrader(app.config.AllowedOrigins)
    clientConn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        targetConn.Close()
        ctxLogger.Error("WebSocket upgrade failed", slog.Any("error", err))
        return
    }

    // Clear HTTP server deadlines so WriteTimeout doesn't kill the stream
    proxy.ClearHTTPDeadlines(clientConn)

    // ── 8. Bridge connections ─────────────────────────────────────
    // This is non-blocking: it spawns goroutines for bidirectional relay,
    // heartbeat, and cleanup. The handler returns immediately.
    proxy.BridgeConnections(app.WebSocketTracker(), clientConn, targetConn)

    ctxLogger.Info("WebSocket bridge established",
        slog.String("namespace", namespace),
        slog.String("resource", "pods"))
}

// resolveK8sAPIHost returns the K8s API server host:port.
func resolveK8sAPIHost() (string, error) {
    // Try in-cluster config first (running in a pod)
    cfg, err := clientRest.InClusterConfig()
    if err == nil {
        return cfg.Host, nil
    }

    // Fall back to kubeconfig (local development)
    loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
    kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, nil)
    restConfig, err := kubeConfig.ClientConfig()
    if err != nil {
        return "", fmt.Errorf("no kubeconfig available: %w", err)
    }

    u, err := url.Parse(restConfig.Host)
    if err != nil {
        return restConfig.Host, nil
    }
    return u.Host, nil
}
```

### Step 3: Register the route

In `internal/api/app.go`, inside `Routes()`, register the endpoint on the `appMux`. WebSocket handlers use `http.HandleFunc` (not `httprouter`) because WebSocket upgrade requests must not be wrapped by response-writing middleware that buffers the response.

```go
func (app *App) Routes() http.Handler {
    // ... existing router setup ...

    // ── WebSocket endpoints ───────────────────────────────────
    // Register directly on appMux (not on apiRouter) so the
    // WebSocket upgrade isn't intercepted by httprouter's
    // response buffering.
    appMux.HandleFunc(WatchYourResourcePath, app.WatchYourResourceHandler)
    appMux.HandleFunc(PathPrefix+WatchYourResourcePath, func(w http.ResponseWriter, r *http.Request) {
        // Strip the path prefix and delegate to the same handler
        http.StripPrefix(PathPrefix, http.HandlerFunc(app.WatchYourResourceHandler)).ServeHTTP(w, r)
    })

    // ... rest of Routes() ...
}
```

### Step 4: Ensure auth covers the new path

The `InjectRequestIdentity` middleware already covers all paths under `/api/v1/` (see `requiresAuth()` in `middleware.go`). Since your WebSocket endpoint path starts with `/api/v1/`, auth is automatic.

If you register a WebSocket endpoint outside `/api/v1/` (e.g., `/ws/...`), you must add that prefix to `requiresAuth()`:

```go
func requiresAuth(path string) bool {
    prefixes := []string{
        ApiPathPrefix,
        PathPrefix + ApiPathPrefix,
        "/ws/",               // add your custom prefix
        PathPrefix + "/ws/",
    }
    // ...
}
```

### Step 5: Add the frontend WebSocket client

In your React frontend, connect to the BFF WebSocket endpoint:

```typescript
// src/hooks/useWatchResource.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface WatchEvent<T> {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK' | 'ERROR';
  object: T;
}

export function useWatchResource<T>(
  path: string,
  namespace: string,
  enabled = true,
) {
  const [items, setItems] = useState<Map<string, T>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();

  const connect = useCallback(() => {
    if (!enabled || !namespace) return;

    // Build WebSocket URL relative to the current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${path}?namespace=${encodeURIComponent(namespace)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const watchEvent: WatchEvent<T & { metadata: { name: string } }> = JSON.parse(event.data);

        setItems((prev) => {
          const next = new Map(prev);
          switch (watchEvent.type) {
            case 'ADDED':
            case 'MODIFIED':
              next.set(watchEvent.object.metadata.name, watchEvent.object);
              break;
            case 'DELETED':
              next.delete(watchEvent.object.metadata.name);
              break;
            case 'BOOKMARK':
              // Bookmark events are handled by the BFF connection tracker
              break;
            case 'ERROR':
              setError(JSON.stringify(watchEvent.object));
              break;
          }
          return next;
        });
      } catch (e) {
        console.error('Failed to parse watch event:', e);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      setConnected(false);
      wsRef.current = null;

      // Reconnect on abnormal close (not user-initiated)
      if (event.code !== 1000 && enabled) {
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      }
    };
  }, [path, namespace, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmounted');
      }
    };
  }, [connect]);

  return {
    items: Array.from(items.values()),
    error,
    connected,
  };
}
```

Usage in a component:

```tsx
import { useWatchResource } from '../hooks/useWatchResource';

interface Pod {
  metadata: { name: string; namespace: string };
  status: { phase: string };
}

function PodList({ namespace }: { namespace: string }) {
  const { items: pods, connected, error } = useWatchResource<Pod>(
    '/api/v1/your-resource/watch',
    namespace,
  );

  if (error) return <div>Error: {error}</div>;
  if (!connected) return <div>Connecting...</div>;

  return (
    <ul>
      {pods.map((pod) => (
        <li key={pod.metadata.name}>
          {pod.metadata.name} — {pod.status.phase}
        </li>
      ))}
    </ul>
  );
}
```

### Step 6: Write tests

Create `internal/api/watch_handler_test.go`:

```go
package api_test

import (
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
    "time"

    "github.com/gorilla/websocket"
)

func TestWatchHandler_RequiresNamespace(t *testing.T) {
    // Set up your test app (see existing test patterns in your module)
    app := setupTestApp(t)

    server := httptest.NewServer(app.Routes())
    defer server.Close()

    // Attempt WebSocket connection without namespace parameter
    wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/your-resource/watch"
    _, resp, err := websocket.DefaultDialer.Dial(wsURL, nil)
    if err == nil {
        t.Fatal("expected connection to fail without namespace")
    }
    if resp != nil && resp.StatusCode != http.StatusBadRequest {
        t.Errorf("expected 400, got %d", resp.StatusCode)
    }
}

func TestWatchHandler_BidirectionalRelay(t *testing.T) {
    // For full integration tests, use a mock K8s WebSocket server.
    // See internal/proxy/websocket_test.go for patterns using httptest.NewServer
    // with a gorilla/websocket upgrader as a mock K8s backend.
}
```

For toolkit-level unit tests (upgrader, dialer, bridge), see the existing test suites:

- `internal/proxy/websocket_test.go` — 26 tests
- `internal/proxy/ws_tracker_test.go` — tracker lifecycle tests
- `internal/proxy/tls_test.go` — TLS config tests
- `internal/ssrf/ssrf_test.go` — 8 SSRF tests

## Toolkit API reference

### Connection setup

| Function | Signature | Description |
| --- | --- | --- |
| `proxy.NewUpgrader` | `(allowedOrigins []string) websocket.Upgrader` | Creates upgrader with origin checking. Empty slice = same-origin only. `["*"]` = allow all. |
| `proxy.DialK8sWebSocket` | `(targetWSURL string, tlsConfig *tls.Config, token string, targetURL *url.URL, netDialContext func(...) (net.Conn, error), clientSubprotocols []string) (*websocket.Conn, *http.Response, error)` | Dials K8s API with bearer auth in both `Authorization` header and K8s subprotocol. |
| `proxy.NewTLSConfig` | `(rootCAs *x509.CertPool, insecureSkipVerify bool) *tls.Config` | TLS config with TLS 1.2 minimum. |
| `proxy.ClearHTTPDeadlines` | `(conn *websocket.Conn)` | Clears HTTP server deadlines on upgraded connections. **Always call this after `Upgrade()`** or `WriteTimeout` will kill the stream. |

### Bridging

| Function | Signature | Description |
| --- | --- | --- |
| `proxy.BridgeConnections` | `(tracker *ConnectionTracker, clientConn, targetConn *websocket.Conn)` | Full lifecycle: track, heartbeat (15s), bidirectional relay, cleanup on disconnect. Non-blocking. |
| `proxy.ForwardTargetToClient` | `(tracker, connID, target, client, cleanup)` | One-direction relay. Use if you need to intercept/transform messages. |
| `proxy.ForwardClientToTarget` | `(tracker, connID, client, target, cleanup)` | One-direction relay. Use if you need to intercept/transform messages. |
| `proxy.RunHeartbeat` | `(tracker, connID, target, heartbeat, done, cleanup)` | Ping loop. Use with manual forwarding setup. |

### Connection tracking

| Function | Signature | Description |
| --- | --- | --- |
| `proxy.NewConnectionTracker` | `(logger *slog.Logger) *ConnectionTracker` | Creates tracker. Already initialized in `app.go` — access via `app.WebSocketTracker()`. |
| `tracker.Track` | `(client, target *websocket.Conn) string` | Returns unique connection ID (e.g., `ws-1`). |
| `tracker.Untrack` | `(connID string)` | Removes connection from tracking. |
| `tracker.ActiveCount` | `() int` | Number of active connections. |
| `tracker.Stop` | `()` | Closes all connections and stops cleanup goroutine. Called in `app.Shutdown()`. |

### SSRF protection

| Function | Signature | Description |
| --- | --- | --- |
| `ssrf.SafeDialContext` | `(logger *slog.Logger, allowedHosts ...string) func(ctx, network, addr) (net.Conn, error)` | Returns a dialer that blocks private IPs except explicitly allowed hosts. |
| `ssrf.IsPrivateIP` | `(ip net.IP) bool` | Checks if IP is in RFC 1918, loopback, link-local, or multicast ranges. |
| `ssrf.ValidateHostname` | `(ctx, hostname, logger) error` | Resolves hostname and validates all IPs are public. |

### Protocol helpers

| Function | Description |
| --- | --- |
| `proxy.BearerSubprotocol(token)` | Builds K8s bearer subprotocol string with base64url-encoded token. |
| `proxy.NegotiatedSubprotocolHeader(targetConn, clientSubprotocols)` | Returns response header if target negotiated a client subprotocol. |
| `proxy.SanitizeCloseCode(code)` | Maps reserved codes 1004/1005/1006 to 1011 per RFC 6455. |
| `proxy.CloseCodeFromError(err)` | Extracts and sanitizes close code from error. |
| `proxy.SendCloseMessage(conn, err)` | Sends a close frame with appropriate code. |

### Constants

| Constant | Value | Description |
| --- | --- | --- |
| `proxy.WriteControlTimeout` | 5s | Timeout for writing control frames (ping, close). |
| `proxy.ConnectionTimeout` | 10s | Handshake timeout for K8s dial. |
| `proxy.HeartbeatInterval` | 15s | Interval between keepalive pings. |

## Common patterns

### Filtering messages before forwarding

If you need to transform or filter K8s watch events before sending them to the frontend, use the low-level forwarding functions instead of `BridgeConnections`:

```go
func (app *App) WatchFilteredHandler(w http.ResponseWriter, r *http.Request) {
    // ... steps 1-7 same as above ...

    // Manual bridge with message filtering
    connID := app.WebSocketTracker().Track(clientConn, targetConn)
    heartbeat := time.NewTicker(proxy.HeartbeatInterval)
    done := make(chan struct{})
    var closeOnce sync.Once
    cleanup := func() {
        closeOnce.Do(func() {
            close(done)
            heartbeat.Stop()
            app.WebSocketTracker().Untrack(connID)
            clientConn.Close()
            targetConn.Close()
        })
    }

    // Custom target→client: filter events
    go func() {
        defer cleanup()
        for {
            msgType, msg, err := targetConn.ReadMessage()
            if err != nil {
                proxy.SendCloseMessage(clientConn, err)
                return
            }

            // Your filter logic here
            filtered := filterWatchEvent(msg)
            if filtered == nil {
                continue // skip this event
            }

            if err := clientConn.WriteMessage(msgType, filtered); err != nil {
                return
            }
        }
    }()

    // Standard client→target (no filtering needed)
    go proxy.ForwardClientToTarget(app.WebSocketTracker(), connID, clientConn, targetConn, cleanup)
    go proxy.RunHeartbeat(app.WebSocketTracker(), connID, targetConn, heartbeat, done, cleanup)
}
```

### Watching custom resources (CRDs)

Adjust the K8s API path for your CRD:

```go
// Core API resources (pods, services, configmaps, etc.)
targetWSURL := fmt.Sprintf("wss://%s/api/v1/namespaces/%s/pods?watch=true", k8sHost, namespace)

// Apps API group (deployments, statefulsets, etc.)
targetWSURL := fmt.Sprintf("wss://%s/apis/apps/v1/namespaces/%s/deployments?watch=true", k8sHost, namespace)

// Custom resources (e.g., InferenceService from KServe)
targetWSURL := fmt.Sprintf("wss://%s/apis/serving.kserve.io/v1beta1/namespaces/%s/inferenceservices?watch=true",
    k8sHost, namespace)

// With label selector
targetWSURL := fmt.Sprintf("wss://%s/api/v1/namespaces/%s/pods?watch=true&labelSelector=%s",
    k8sHost, namespace, url.QueryEscape("app=my-app"))

// With field selector (e.g., specific pod)
targetWSURL := fmt.Sprintf("wss://%s/api/v1/namespaces/%s/pods?watch=true&fieldSelector=%s",
    k8sHost, namespace, url.QueryEscape("metadata.name=my-pod"))
```

### Non-K8s WebSocket backends

The toolkit can also be used for non-K8s WebSocket backends. Skip `DialK8sWebSocket` and use `gorilla/websocket.Dialer` directly:

```go
dialer := websocket.Dialer{
    TLSClientConfig:  proxy.NewTLSConfig(app.rootCAs, app.config.InsecureSkipVerify),
    HandshakeTimeout: proxy.ConnectionTimeout,
}

targetConn, _, err := dialer.Dial("wss://my-backend/stream", nil)
if err != nil { /* handle */ }

upgrader := proxy.NewUpgrader(app.config.AllowedOrigins)
clientConn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
    targetConn.Close()
    return
}
proxy.ClearHTTPDeadlines(clientConn)

proxy.BridgeConnections(app.WebSocketTracker(), clientConn, targetConn)
```

## Deployment mode considerations

| Mode | WebSocket behavior |
| --- | --- |
| **Standalone / Kubeflow** | Works out of the box. The module BFF is the only backend; WebSocket endpoints are directly accessible. |
| **Federated (ODH/RHOAI)** | **Not yet supported.** The host BFF's module proxy does not currently forward WebSocket upgrades to module BFFs. The toolkit is ready — once the host enables WebSocket forwarding, module WS endpoints work automatically. |

## Checklist

Use this checklist when implementing a WebSocket endpoint:

- [ ] Route constant defined in `app.go`
- [ ] Handler function written with identity extraction, business logic, K8s dial, upgrade, and bridge
- [ ] `proxy.ClearHTTPDeadlines()` called after `upgrader.Upgrade()`
- [ ] Route registered in `Routes()` on `appMux` (not `apiRouter`)
- [ ] Route registered with `PathPrefix` variant for prefixed access
- [ ] Auth path prefix covered by `requiresAuth()` (automatic for `/api/v1/` paths)
- [ ] SSRF protection configured (pass `ssrf.SafeDialContext()` to `DialK8sWebSocket` in production)
- [ ] Frontend WebSocket client implemented with reconnection logic
- [ ] Tests written for the handler (at minimum: missing params, auth)
- [ ] Tested locally with `make run MOCK_K8S_CLIENT=true` or a real kind cluster

## Reference

- WebSocket toolkit usage guide: [`docs/plans/k8s-proxy-adoption.md`](k8s-proxy-adoption.md)
- Architecture: [`docs/architecture.md`](../architecture.md) (WebSocket infrastructure toolkit section)
- Toolkit source: `bff/internal/proxy/websocket.go`, `ws_tracker.go`, `tls.go`
- SSRF source: `bff/internal/ssrf/ssrf.go`
- PR: [opendatahub-io/mod-arch-library#232](https://github.com/opendatahub-io/mod-arch-library/pull/232)
- Jira: [RHOAIENG-66655](https://redhat.atlassian.net/browse/RHOAIENG-66655)
