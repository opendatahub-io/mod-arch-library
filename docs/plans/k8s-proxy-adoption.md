# WebSocket Toolkit — Usage Guide

## Summary

Every BFF scaffolded by `mod-arch-installer` includes a WebSocket toolkit (`internal/proxy`) with exported building blocks for creating custom BFF endpoints that communicate with Kubernetes or other WebSocket backends. The toolkit does **not** register any routes — module developers build explicit endpoints with business logic and use the toolkit internally.

This follows the BFF pattern: frontends never call K8s API directly. Instead, each BFF endpoint applies authorization, scoping, filtering, or transformation before relaying data over WebSocket.

| Capability | Description |
| --- | --- |
| **WebSocket upgrader** | gorilla/websocket upgrader with configurable origin checking (same-origin default, `ALLOWED_ORIGINS`) |
| **K8s WebSocket dialer** | Dials K8s API WebSocket with bearer token auth (header + K8s subprotocol), TLS config, optional SSRF-safe dialing |
| **Connection tracker** | Tracks active connections with unique IDs, per-connection metrics, 15s heartbeat pings, 5-minute stale cleanup |
| **Bridge utility** | Bidirectional relay between client and target WebSocket connections with automatic tracking |
| **SSRF protection** | DNS resolution + private IP validation + redirect checking via `SafeDialContext` |
| **TLS configuration** | `NewTLSConfig()` with custom CA pool support and minimum TLS 1.2 |

## Architecture

```text
┌──────────┐     ┌─────────────────────────────────────────────┐     ┌──────────┐
│          │     │                    BFF                      │     │          │
│ Frontend │────>│  Custom endpoint (business logic)           │     │   K8s    │
│          │     │    ├─ proxy.NewUpgrader() ← client WS      │     │   API    │
│          │<───>│    ├─ proxy.DialK8sWebSocket() → target WS ┼────>│  Server  │
│          │     │    └─ proxy.BridgeConnections()             │     │          │
└──────────┘     └─────────────────────────────────────────────┘     └──────────┘
```

**Key principle:** The BFF endpoint decides *what* to watch, *who* can watch it, and *how* to transform the data. The toolkit handles the WebSocket plumbing.

## Exported API

### Connection setup

| Function | Description |
| --- | --- |
| `NewUpgrader(allowedOrigins []string)` | Returns a `websocket.Upgrader` with origin checking configured |
| `OriginChecker(allowedOrigins []string)` | Returns a `func(*http.Request) bool` for custom use |
| `SameOriginCheck(r *http.Request)` | Default origin checker — compares `Origin` header with `Host` |
| `DialK8sWebSocket(targetWSURL, tlsConfig, token, targetURL, netDialContext, clientSubprotocols)` | Dials a K8s API WebSocket with full auth setup |
| `NewTLSConfig(rootCAs, insecureSkipVerify)` | Creates a `*tls.Config` with TLS 1.2 minimum |
| `ClearHTTPDeadlines(conn)` | Clears HTTP server deadlines on upgraded connections |

### Bridging and forwarding

| Function | Description |
| --- | --- |
| `BridgeConnections(tracker, clientConn, targetConn)` | Full lifecycle: track, heartbeat, bidirectional relay, cleanup |
| `ForwardTargetToClient(tracker, connID, target, client, cleanup)` | One-direction relay: target → client |
| `ForwardClientToTarget(tracker, connID, client, target, cleanup)` | One-direction relay: client → target |
| `RunHeartbeat(tracker, connID, target, heartbeat, done, cleanup)` | Ping loop with tracker integration |

### Connection tracking

| Function | Description |
| --- | --- |
| `NewConnectionTracker(logger)` | Creates a tracker with stale cleanup goroutine |
| `tracker.Track(client, target)` | Registers a connection pair, returns unique ID |
| `tracker.Untrack(connID)` | Removes a connection from tracking |
| `tracker.ActiveCount()` | Returns number of active connections |
| `tracker.Stop()` | Stops the cleanup goroutine and closes all tracked connections |

### Protocol helpers

| Function | Description |
| --- | --- |
| `BearerSubprotocol(token)` | Builds `base64url.bearer.authorization.k8s.io.<base64url-encoded-token>` where the token is base64url-encoded (RFC 4648 §5, no padding) |
| `NegotiatedSubprotocolHeader(targetConn, clientSubprotocols)` | Returns response header if target negotiated a client subprotocol |
| `SanitizeCloseCode(code)` | Maps reserved codes 1004/1005/1006 to 1011 |
| `CloseCodeFromError(err)` | Extracts and sanitizes close code from error |
| `SendCloseMessage(conn, err)` | Sends a close frame with appropriate code |

### Constants

| Constant | Value | Description |
| --- | --- | --- |
| `WriteControlTimeout` | 5s | Timeout for writing control frames |
| `ConnectionTimeout` | 10s | Handshake timeout for K8s dial |
| `HeartbeatInterval` | 15s | Interval between keepalive pings |

## Example: Watch pods endpoint

```go
// In your module's BFF — register in Routes()
func (app *App) WatchPodsHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Business logic: extract identity, validate namespace access
    identity := getIdentity(r)
    namespace := r.URL.Query().Get("namespace")
    if !canAccessNamespace(identity, namespace) {
        http.Error(w, "forbidden", http.StatusForbidden)
        return
    }

    // 2. Build the K8s API URL — the BFF decides what to watch
    k8sHost := getK8sHost() // from kubeconfig or in-cluster config
    targetWSURL := fmt.Sprintf("wss://%s/api/v1/namespaces/%s/pods?watch=true", k8sHost, namespace)
    targetURL, _ := url.Parse(fmt.Sprintf("https://%s", k8sHost))

    // 3. Dial K8s using the toolkit
    tlsConfig := proxy.NewTLSConfig(app.rootCAs, false)
    targetConn, _, err := proxy.DialK8sWebSocket(targetWSURL, tlsConfig, identity.Token, targetURL, nil, nil)
    if err != nil {
        http.Error(w, "failed to connect to K8s", http.StatusBadGateway)
        return
    }

    // 4. Accept the frontend WebSocket
    upgrader := proxy.NewUpgrader(app.Config().AllowedOrigins)
    clientConn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        targetConn.Close()
        return
    }
    proxy.ClearHTTPDeadlines(clientConn)

    // 5. Bridge with tracking — handles heartbeat, forwarding, cleanup
    proxy.BridgeConnections(app.WebSocketTracker(), clientConn, targetConn)
}
```

Register the endpoint:

```go
// In Routes()
appMux.HandleFunc("/api/v1/pods/watch", app.WatchPodsHandler)
```

## Federated mode considerations

In federated mode (ODH/RHOAI), the module frontend is loaded via Module Federation into the dashboard shell. All traffic flows through the core BFF:

```text
Browser ──→ Dashboard Ingress ──→ Core BFF ──→ Module BFF
```

### What works today

- **Module HTTP APIs**: The core BFF proxies HTTP requests to module BFFs via `@fastify/http-proxy` at `/_mf/{moduleName}/*`. Module-specific REST endpoints work out of the box.

### What does NOT work yet

- **Custom WebSocket endpoints on module BFFs**: The core BFF's `registerProxy()` does not set `websocket: true` in `@fastify/http-proxy`, so WebSocket upgrade requests are not forwarded to module BFFs.

### What needs to change upstream

For custom module WebSocket endpoints to work in federated mode, the core BFF's `registerProxy()` (in `backend/src/utils/proxy.ts`) needs to enable WebSocket forwarding:

```typescript
fastify.register(httpProxy, { prefix, rewritePrefix, upstream, websocket: true, ... });
```

Once this is enabled, the WebSocket toolkit already present in module BFFs will handle incoming WebSocket connections without additional changes.

## Configuration

No new configuration is required — the toolkit uses existing BFF settings:

| Setting | Flag | Env var | Effect |
| --- | --- | --- | --- |
| Allowed origins | `--allowed-origins` | `ALLOWED_ORIGINS` | WebSocket CORS origin checking |
| Dev mode | `--dev-mode` | — | Disables SSRF protection, allows HTTP targets |
| Insecure skip verify | `--insecure-skip-verify` | `INSECURE_SKIP_VERIFY` | Disables TLS cert verification |
| CA bundles | `--bundle-paths` | `BUNDLE_PATHS` | Additional CA certs for TLS |
| Mock K8s client | `--mock-k8s-client` | — | Uses envtest instead of real cluster |

## Connection lifecycle

WebSocket connections managed by `BridgeConnections()` follow this lifecycle:

1. `ConnectionTracker.Track()` assigns a unique ID and starts per-connection metrics
2. Three goroutines launch: target→client forwarding, client→target forwarding, heartbeat pings
3. Heartbeat pings are sent every 15 seconds to keep connections alive
4. When either side disconnects, cleanup runs once (via `sync.Once`): ticker stops, connections close, tracker untracks
5. Stale connections (no message activity or successful pings for 5 minutes) are automatically closed by the tracker's cleanup sweep (every 60 seconds)
6. On BFF shutdown, `tracker.Stop()` closes all tracked connections

## Security

- **SSRF protection**: `SafeDialContext` validates DNS resolution against private IP ranges (RFC 1918, loopback, link-local) with redirect checking. Disabled in dev mode.
- **Origin checking**: Same-origin by default. Configurable via `ALLOWED_ORIGINS` (comma-separated list or `*` for all).
- **TLS**: Minimum TLS 1.2 enforced. Custom CA bundles via `--bundle-paths`. Insecure mode gated to dev environments.
- **Close code sanitization**: Reserved WebSocket close codes (1004/1005/1006) are mapped to 1011 to comply with RFC 6455.

## Testing locally

```bash
# Start BFF with mock K8s client
cd bff && make run MOCK_K8S_CLIENT=true

# Or with a real kind cluster
kind create cluster
kubectl create namespace opendatahub
cd bff && make run DEV_MODE=true
```

## Reference

- Source PR: [opendatahub-io/mod-arch-library#232](https://github.com/opendatahub-io/mod-arch-library/pull/232)
- BFF packages: `internal/proxy/`, `internal/ssrf/`
- GitHub issue: [opendatahub-io/mod-arch-library#230](https://github.com/opendatahub-io/mod-arch-library/issues/230)
- Jira: [RHOAIENG-66655](https://redhat.atlassian.net/browse/RHOAIENG-66655)
