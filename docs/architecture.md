# Architecture

This document explains what a Modular Architecture component is, how its pieces collaborate, and how the same project behaves when deployed in Kubeflow (upstream) or as a federated remote inside the RHOAI/ODH dashboard. It is written for engineers who already work with `mod-arch-starter` and need a shared mental model rather than code snippets.

## What makes up a module

| Element | Description | Key artifacts |
| --- | --- | --- |
| **Frontend** | React workspace that renders the end-user experience. It consumes shared UI libraries, exposes routes and optional extensions through Module Federation, and adapts to either Material UI (Kubeflow) or PatternFly (federated) themes. | `mod-arch-starter/frontend`, `mod-arch-core`, `mod-arch-shared`, `mod-arch-kubeflow` |
| **BFF (Backend-for-Frontend)** | Go service that terminates authentication, orchestrates calls to platform APIs (Kubernetes, Kubeflow services, Jupyter, OpenShift), and emits a narrow OpenAPI contract that the frontend type-generates against. | `mod-arch-starter/bff`, `api/openapi` |
| **Contracts & tooling** | OpenAPI spec, generated REST clients, namespace selectors, shared constants, build scripts, and CI hooks that keep both sides in sync. | `api/openapi`, `frontend/src/api`, repo-level scripts |
| **Deployment assets** | Manifests, Helm/Kustomize fragments, and Module Federation metadata that describe how the module is exposed to Kubeflow or the RHOAI dashboard. | `mod-arch-starter/manifests`, dashboard config maps/CRs |

Together these elements form a single module that can either be compiled directly into Kubeflow or delivered as a remote micro-frontend with its own BFF.

## Lifecycle at a glance

1. **Bootstrap** – `npx mod-arch-installer` creates a repo with matching frontend, BFF, and manifests. You choose a flavor (`kubeflow` or `default`) to align dependencies and theming.
2. **Develop** – Teams iterate locally with the BFF in mock mode and the frontend consuming generated clients. Namespace awareness, feature flags, and shared UI tokens come from the shared packages in this monorepo.
3. **Publish** – Each release produces container images for the BFF (plus optional static assets) and a `remoteEntry.js` bundle for Module Federation. Kubeflow builds also produce YAML overlays for the OSS dashboard.
4. **Run** – Operations register the module with either the Kubeflow manifests or the ODH dashboard operator. Observability, auth, and platform settings are injected through config maps, secrets, and environment variables.

## Interaction model

### Frontend ↔ BFF contract

- The OpenAPI spec is the canonical definition of every request and response. Generated clients in the frontend and request validators in the BFF guarantee parity.
- Namespace and tenancy metadata flow from the host dashboard into shared context providers. Every BFF call includes that context so the backend can enforce RBAC.
- The BFF aggregates data from Kubernetes/Kubeflow/OpenShift services, enriches it with derived fields (status, links, breadcrumbs), and returns UI-ready payloads. This keeps frontend logic focused on presentation, not orchestration.

### Module Federation responsibilities (federated/RHOAI mode)

- **Remote build** – Webpack emits `remoteEntry.js` plus `mf-manifest` metadata describing exposed routes and widgets. Shared dependencies (React, PatternFly, routing) are declared as singletons to avoid multiple runtimes.
- **Host discovery** – The RHOAI dashboard loads the remote based on configuration (CR or ConfigMap). The host determines when to preload bundles, which extension points to mount, and how to pass navigation/telemetry props.
- **Extension surface** – Modules expose routed pages, navigation items, dashboards cards, or quick-starts. These React exports follow host-defined interfaces so the shell can compose them at runtime.
- **Version alignment** – Modules depend on the same `mod-arch-*` libraries that the dashboard consumes, ensuring visual and behavioral consistency during upgrades.

## Mode-specific behavior

| Aspect | Kubeflow mode (upstream) | Federated mode (ODH/RHOAI on OpenShift) |
| --- | --- | --- |
| **Frontend integration** | Compiled directly into the Kubeflow dashboard build; uses Kubeflow navigation, Material UI theme, and follows OSS contributor workflows. | Delivered as a remote micro-frontend; loaded at runtime through Module Federation while the host shell manages navigation and chrome with PatternFly. |
| **BFF hosting** | Runs inside the Kubeflow cluster (Deployment + Istio). Auth relies on Kubeflow headers (e.g., `kubeflow-user`) plus Kubernetes TokenReview. | Runs on OpenShift behind OAuth-protected routes. OAuth tokens flow from the dashboard, and the BFF validates them with the OpenShift OAuth server or RHSSO. |
| **Namespace & tenancy** | Kubeflow central dashboard drives namespace selection; modules consume shared state to scope requests. | The RHOAI dashboard injects namespace/project info via the federation runtime APIs. Modules must honor multi-tenancy and operator policies. |
| **Delivery artifacts** | Kustomize overlays and manifests committed upstream; reviewers test them inside the Kubeflow build. | Remote URL + BFF route registered through CR/ConfigMap. Container images published to quay.io/ghcr.io with OpenShift Routes or ingress controllers serving them. |
| **Observability** | Logs/metrics collected through Kubeflow’s Prometheus stack. | OpenShift Monitoring (Prometheus + Loki) ingests module metrics/logs, and teams add telemetry hooks for platform correlation. |
| **K8s proxy & WebSocket** | BFF provides `/api/k8s/*` and `/wss/k8s/*` directly — the only backend reaching the K8s API server. WebSocket infrastructure used for K8s watch streams. | Core BFF handles K8s proxy traffic directly. Module-level `/api/k8s/*` and `/wss/k8s/*` routes are unused. WebSocket infrastructure is available for future custom endpoints once the core BFF enables WSS forwarding (`websocket: true` in `registerProxy()`). |

Standalone or preview environments follow the federated pattern but run everything within the module repository for fast iteration.

## Behavioral expectations

### Frontend

- Implements routing, navigation metadata, and telemetry hooks defined by the host dashboard.
- Uses shared UI packages so typography, spacing, and accessibility match the platform standards.
- Ships a `remoteEntry.js` that exposes routes, extension registries, and optional initialization helpers.
- Honors namespace, environment, and feature-flag context supplied by the host.

### BFF

- Maintains a one-to-one relationship with its frontend module.
- Terminates authentication differently per mode (Kubeflow headers vs. OpenShift OAuth tokens) but always returns normalized identity info to the frontend.
- Aggregates platform APIs, applies authorization checks, and transforms responses into the OpenAPI schema the UI expects.
- Provides health/readiness endpoints plus metrics so SREs can monitor latency, error rates, and namespace access patterns.
- Exposes a K8s API proxy and WebSocket relay so the frontend can reach the Kubernetes API server through the BFF (see below).

### K8s API proxy and WebSocket infrastructure

Every BFF scaffolded by the installer includes a built-in proxy layer that lets the frontend interact with the Kubernetes API server without direct cluster access.

> **Deployment mode note:** The K8s proxy routes are active in standalone and Kubeflow modes where the module BFF is the sole backend. In federated mode (ODH/RHOAI), the core BFF (odh-dashboard backend) handles K8s API traffic directly — these module-level proxy routes are never reached. The WebSocket infrastructure (upgrader, connection tracking, heartbeat, SSRF-safe dialing) is provided in all modes as reusable building blocks for future custom WebSocket endpoints.

**HTTP proxy (`/api/k8s/*`):**

- Reverse proxy via `httputil.ReverseProxy` with path rewriting — the `/api/k8s/` prefix is stripped before forwarding to the K8s API server.
- Authorization header injected from the authenticated user's token (extracted by `InjectRequestIdentity` middleware).
- Sensitive ingress headers stripped before forwarding (cookies, `x-forwarded-*`, impersonation headers).
- SSRF protection blocks requests to private IPs (RFC 1918, loopback, link-local) with DNS rebinding prevention and redirect validation.
- Dual-path mounting: both `/api/k8s/*` and `/mod-arch/api/k8s/*` are registered.

**WebSocket proxy (`/wss/k8s/*`):**

- Full-duplex bidirectional relay for K8s watch streams (e.g., `watch=true` on resources).
- Bearer token authentication via K8s subprotocol (`base64url.bearer.authorization.k8s.io.<base64token>`).
- Client subprotocol negotiation forwarded to upstream.
- Origin checking: same-origin by default, configurable via `ALLOWED_ORIGINS`.
- 15-second heartbeat pings to keep connections alive.
- Connection tracking with per-connection metrics and stale cleanup (5-minute inactivity threshold, 60-second cleanup interval).
- RFC 6455 close code sanitization (reserved codes 1004/1005/1006 mapped to 1011).

**Security:**

- SSRF protection via `SafeDialContext` — DNS resolution + private IP validation + redirect checking.
- The K8s API server hostname is automatically allowlisted so private-IP blocking does not reject the proxy's own target.
- SSRF protection is disabled in dev mode (`--dev-mode`) to allow local development with kind/minikube clusters.
- TLS 1.2 minimum enforced; insecure mode gated to dev environments via `--insecure-skip-verify`.

### Shared contracts

- OpenAPI is the single source of truth for types and validation.
- Namespace governance must be enforced consistently in both frontend and BFF layers.
- Dependency alignment with `mod-arch-core`/`mod-arch-shared` ensures compatibility with the dashboard runtime.

## Operational concerns

- **Configuration** – Modules read runtime settings (API endpoints, telemetry toggles, feature flags) from config maps or environment variables. The starter includes `.env` examples for local dev and overlay values for each deployment target.
- **Security** – Secrets (service account tokens, OAuth client secrets) stay in the BFF and Kubernetes secrets; nothing sensitive ships in the frontend bundle. Service mesh policies or OpenShift Routes enforce TLS and mTLS as needed.
- **Scalability** – Frontends scale via static hosting/CDN, while BFF workloads autoscale based on CPU/latency. Federation allows the dashboard to lazy-load modules, reducing host memory footprint.
- **Upgrades** – Module releases bump shared library versions and remote manifest versions. Kubeflow upgrades require upstream PRs; federated upgrades can be staged by pointing the dashboard at a new remote URL before promoting it to production.
- **Observability** – Logs, metrics, and traces follow the platform’s labeling scheme (module name, version, namespace) so operators can correlate frontend and BFF events.
