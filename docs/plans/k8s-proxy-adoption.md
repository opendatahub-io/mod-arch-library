# K8s Proxy & WebSocket Infrastructure — Adoption Plan

## Summary

Every BFF scaffolded by `mod-arch-installer` now includes a K8s API proxy, a WebSocket relay, and reusable WebSocket infrastructure. These serve different purposes depending on deployment mode:

| Capability | Standalone / Kubeflow | Federated (ODH/RHOAI) |
| --- | --- | --- |
| **K8s HTTP proxy** (`/api/k8s/*`) | **Active** — the module BFF is the only backend, so it proxies K8s API traffic directly | **Unused** — the core BFF handles `/api/k8s/*` directly; traffic never reaches the module BFF |
| **K8s WebSocket relay** (`/wss/k8s/*`) | **Active** — used for K8s watch streams (pod status, events, CRDs) | **Unused** — the core BFF handles `/wss/k8s/*` directly |
| **WebSocket infrastructure** (gorilla/websocket, upgrader, connection tracker, heartbeat, SSRF) | **Active** — powers the K8s relay; available for custom WS endpoints | **Ready** — infrastructure is in place for custom WS endpoints, pending core BFF enabling WSS forwarding |

## What you get

| Feature | Path | Description |
| --- | --- | --- |
| HTTP proxy | `/api/k8s/*` | Reverse proxy to the K8s API server with auth injection and SSRF protection |
| WebSocket relay | `/wss/k8s/*` | Full-duplex relay for K8s watch streams with heartbeat and connection tracking |

Both paths are also available with the BFF path prefix (e.g., `/mod-arch/api/k8s/*`).

## Architecture

```text
┌──────────┐     ┌─────────────────────────────────────────────┐     ┌──────────┐
│          │     │                    BFF                      │     │          │
│ Frontend │────>│  InjectRequestIdentity → K8s HTTP Proxy  ──┼────>│   K8s    │
│          │     │                                             │     │   API    │
│          │────>│  InjectRequestIdentity → WS Proxy ─────────┼────>│  Server  │
│          │     │                        (bidirectional)       │     │          │
└──────────┘     └─────────────────────────────────────────────┘     └──────────┘
```

**Request flow (standalone mode):**

1. Frontend sends request to `/api/k8s/api/v1/pods`
2. `InjectRequestIdentity` middleware extracts the user's token from headers
3. K8s proxy strips the `/api/k8s` prefix, injects `Authorization: Bearer <token>`, strips sensitive ingress headers
4. Request is forwarded to the K8s API server
5. Response is returned to the frontend

For WebSocket, the flow is similar but uses the `base64url.bearer.authorization.k8s.io.<base64url-encoded-token>` subprotocol for authentication.

## Federated mode considerations

In federated mode (ODH/RHOAI), the module frontend is loaded via Module Federation into the dashboard shell. All traffic flows through the core BFF:

```text
Browser ──→ Dashboard Ingress ──→ Core BFF ──→ Module BFF
```

### What works today

- **Module HTTP APIs**: The core BFF proxies HTTP requests to module BFFs via `@fastify/http-proxy` at `/_mf/{moduleName}/*`. Module-specific REST endpoints work out of the box.
- **K8s API access**: The core BFF handles `/api/k8s/*` and `/wss/k8s/*` directly. Module frontends use these paths to reach the K8s API — the traffic never reaches the module BFF.

### What does NOT work yet

- **Custom WebSocket endpoints on module BFFs**: The core BFF's `registerProxy()` does not set `websocket: true` in `@fastify/http-proxy`, so WebSocket upgrade requests are not forwarded to module BFFs. If a module BFF exposes a custom WebSocket endpoint (e.g., streaming logs, real-time notifications), it is unreachable in federated mode.

### What needs to change upstream

For custom module WebSocket endpoints to work in federated mode, the core BFF's `registerProxy()` (in `backend/src/utils/proxy.ts`) needs to enable WebSocket forwarding:

```typescript
fastify.register(httpProxy, { prefix, rewritePrefix, upstream, websocket: true, ... });
```

Once this is enabled, the WebSocket infrastructure already present in module BFFs (gorilla/websocket, upgrader, connection tracker, heartbeat) will handle incoming WebSocket connections without additional changes.

## Configuration

No new configuration is required — the proxy uses existing BFF settings:

| Setting | Flag | Env var | Effect on proxy |
| --- | --- | --- | --- |
| Auth token header | `--auth-token-header` | `AUTH_TOKEN_HEADER` | Header stripped from ingress before forwarding |
| Allowed origins | `--allowed-origins` | `ALLOWED_ORIGINS` | WebSocket CORS origin checking |
| Dev mode | `--dev-mode` | — | Disables SSRF protection, allows HTTP targets |
| Insecure skip verify | `--insecure-skip-verify` | `INSECURE_SKIP_VERIFY` | Disables TLS cert verification for proxy |
| CA bundles | `--bundle-paths` | `BUNDLE_PATHS` | Additional CA certs for proxy TLS |
| Mock K8s client | `--mock-k8s-client` | — | Proxy connects to envtest instead of real cluster |

## Frontend integration

### HTTP requests (REST)

Use the proxy path prefix to reach any K8s API endpoint:

```typescript
// List pods in a namespace
const response = await fetch('/api/k8s/api/v1/namespaces/default/pods', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const pods = await response.json();
```

### WebSocket watch streams

Open a WebSocket to watch K8s resources in real time:

```typescript
const ws = new WebSocket(
  `${wsProtocol}//${window.location.host}/wss/k8s/api/v1/namespaces/default/configmaps?watch=true`
);

ws.onmessage = (event) => {
  const watchEvent = JSON.parse(event.data);
  console.log(watchEvent.type, watchEvent.object.metadata.name);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Webpack dev server proxy

For local development, the webpack dev server needs to proxy WebSocket connections. Add this to your `webpack.dev.js`:

```javascript
devServer: {
  proxy: [
    {
      context: ['/api', '/wss'],
      target: `${proxyProtocol}://${proxyHost}:${proxyPort}`,
      ws: true,  // Enable WebSocket proxying
      secure: false,
      changeOrigin: true,
    },
  ],
}
```

## Security

The proxy enforces several security layers:

- **Authentication**: Every request must pass through `InjectRequestIdentity` middleware. Unauthenticated requests are rejected before reaching the proxy.
- **SSRF protection**: DNS resolution validates that the K8s API server does not resolve to private IPs (configurable allowlist). Redirect responses are also validated.
- **Header stripping**: Impersonation headers (`Impersonate-User`, `Impersonate-Group`) and sensitive ingress headers (cookies, `x-forwarded-*`) are stripped before forwarding.
- **Origin checking**: WebSocket upgrades validate the `Origin` header against `ALLOWED_ORIGINS`. Default is same-origin only.
- **TLS**: Minimum TLS 1.2 enforced. Client certificate (mTLS) support from kubeconfig.

## Connection lifecycle

WebSocket connections are managed by a `ConnectionTracker`:

- Each connection gets a unique ID and per-connection metrics (messages sent/received, ping count, last resource version)
- Heartbeat pings are sent every 15 seconds to keep connections alive
- Stale connections (no message activity or successful pings for 5 minutes) are automatically closed
- The tracker runs a cleanup sweep every 60 seconds
- On BFF shutdown, all tracked connections are gracefully closed

## Testing locally

```bash
# Start BFF with mock K8s client
cd bff && make run MOCK_K8S_CLIENT=true

# Or with a real kind cluster
kind create cluster
kubectl create namespace opendatahub
cd bff && make run DEV_MODE=true
```

## Monitoring

Watch for these operational signals:

- **Active WebSocket connections**: Track via the `ConnectionTracker.ActiveCount()` method
- **Stale connection cleanups**: Logged at INFO level with connection ID and idle duration
- **SSRF blocks**: Logged at WARN level with target URL
- **Proxy errors**: Logged at ERROR level with target URL and error details
- **WebSocket dial failures**: Logged at ERROR level with target URL and HTTP status

## Migration guide

If your BFF already has a custom K8s proxy implementation:

1. Remove your custom proxy code
2. The built-in proxy registers at `/api/k8s/*` and `/wss/k8s/*` — update your frontend to use these paths
3. If you used different path prefixes, add route aliases in your `Routes()` method
4. The built-in proxy handles auth injection automatically from `RequestIdentity.Token` — remove any manual token forwarding

## Reference

- Source PR: [opendatahub-io/odh-dashboard#7733](https://github.com/opendatahub-io/odh-dashboard/pull/7733)
- BFF packages: `internal/proxy/`, `internal/ssrf/`
- GitHub issue: [opendatahub-io/mod-arch-library#230](https://github.com/opendatahub-io/mod-arch-library/issues/230)
