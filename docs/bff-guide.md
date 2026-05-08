# Getting Started with the BFF

## What is a BFF?

A **Backend-for-Frontend (BFF)** is a server that sits between your React UI and the real backend systems (Kubernetes, external APIs, platform services). Instead of the browser talking directly to those systems, the browser talks to the BFF, and the BFF handles auth, data shaping, and fetching from multiple sources.

```
Browser (React)
     │
     ▼
  BFF (Go)          ← this codebase
  ├── Kubernetes API (your CRDs, namespaces, RBAC)
  └── External APIs  (platform services, upstream APIs)
```

Each BFF is scoped to a single module — it exposes exactly the API surface that its companion frontend needs and nothing more.

For the full architectural picture of how BFFs fit into the broader modular architecture — including the balance of responsibilities between BFFs, UIs, and platform services — see the [architecture Miro board](https://miro.com/app/board/uXjVG_Uq3DU=/?share_link_id=393835067369). For historical context and an in-depth overview of why this architecture exists, see the [modular architecture blog post](https://ederign.me/blog/2026-02-20-modular-architecture-ai-platform).

---

## Go Basics You Need First

Before diving in, here are the Go concepts used throughout.

### Packages

Every `.go` file starts with `package <name>`. Files in the same directory must share the same package name. You import other packages with their module path.

```go
package api                           // this file belongs to the "api" package

import (
    "net/http"                        // stdlib: HTTP server primitives
    "log/slog"                        // stdlib: structured logging
    "github.com/julienschmidt/httprouter"  // third-party router
)
```

### Structs

Structs are Go's version of classes (but simpler — no inheritance).

```go
// A struct definition
type App struct {
    config       config.EnvConfig   // the server's configuration
    logger       *slog.Logger       // a pointer to a logger (*T means "pointer to T")
    repositories *repositories.Repositories
}
```

### Methods on structs

You can attach functions to structs using a **receiver**:

```go
//     (receiver)         method name
func (app *App) Routes() http.Handler {
    // app is like "this" in other languages
}
```

### Interfaces

Interfaces define a *contract* — what methods a type must have. Any type that has those methods satisfies the interface automatically (no `implements` keyword needed).

```go
// This interface says: "anything that can do these things is a SubscriptionsRepositoryInterface"
// Example from MaaS BFF:
type SubscriptionsRepositoryInterface interface {
    ListSubscriptions(ctx context.Context) ([]models.MaaSSubscription, error)
    GetSubscription(ctx context.Context, name string) (*models.MaaSSubscription, error)
    CreateSubscription(ctx context.Context, request models.CreateSubscriptionRequest) (*models.CreateSubscriptionResponse, error)
    // ...
}
```

This is how mock vs. real implementations work — both satisfy the same interface.

### Multiple return values (especially errors)

Go functions commonly return `(value, error)`. You always check the error:

```go
resource, err := app.repositories.MyResource.GetResource(ctx, name)
if err != nil {
    // handle it — don't ignore errors in Go
    app.serverErrorResponse(w, r, err)
    return
}
// only use resource here, we know err is nil
```

### Goroutines

A goroutine is a lightweight thread. The `go` keyword starts one:

```go
// Start the HTTP server in the background so main() can keep running
go func() {
    err = srv.ListenAndServe()
}()
```

### Channels

Channels let goroutines communicate. `<-ch` blocks until a value is sent:

```go
shutdownCh := make(chan os.Signal, 1)        // create a channel that holds 1 signal
signal.Notify(shutdownCh, syscall.SIGTERM)   // OS sends to shutdownCh on SIGTERM

<-shutdownCh   // BLOCK here until a signal arrives, then continue
```

---

## 1. Entry Point: `cmd/main.go`

This is the first thing Go runs. It:

1. Parses command-line flags (and env var fallbacks)
2. Creates the `App`
3. Starts an HTTP server in a goroutine
4. Waits for a shutdown signal (Ctrl+C or SIGTERM)
5. Shuts down gracefully

```go
func main() {
    // --- STEP 1: Parse flags ---
    var cfg config.EnvConfig
    flag.IntVar(&cfg.Port, "port", getEnvAsInt("PORT", 4000), "API server port")
    flag.BoolVar(&cfg.MockK8Client, "mock-k8s-client", false, "Use mock Kubernetes client")
    flag.BoolVar(&cfg.MockHTTPClient, "mock-http-client", false, "Use mock HTTP client")
    // ... more flags ...
    flag.Parse()

    // --- STEP 2: Create the app (wires everything together) ---
    app, err := api.NewApp(cfg, logger)
    if err != nil {
        logger.Error(err.Error())
        os.Exit(1)
    }

    // --- STEP 3: Create an HTTP server ---
    srv := &http.Server{
        Addr:    fmt.Sprintf(":%d", cfg.Port),   // e.g. ":4000"
        Handler: app.Routes(),                    // all routes/middleware
    }

    // --- STEP 4: Start serving in a goroutine ---
    go func() {
        err = srv.ListenAndServe()
        // ...
    }()

    // --- STEP 5: Wait for shutdown signal ---
    shutdownCh := make(chan os.Signal, 1)
    signal.Notify(shutdownCh, os.Interrupt, syscall.SIGTERM)
    <-shutdownCh  // blocks here

    // --- STEP 6: Graceful shutdown ---
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
    app.Shutdown()
}
```

**Why a goroutine for the server?** `ListenAndServe` blocks forever. If we called it directly, the code after it (the shutdown logic) would never run. The goroutine lets both run concurrently.

---

## 2. The App: `internal/api/app.go`

`App` is the central object. It holds everything the server needs. The exact fields will vary by module, but the structure is consistent — configuration, logging, a Kubernetes client factory, and repositories:

```go
type App struct {
    config                  config.EnvConfig
    logger                  *slog.Logger
    kubernetesClientFactory k8s.KubernetesClientFactory
    repositories            *repositories.Repositories  // all data access
}
```

In modules that use mock mode during development, the struct may also hold test helpers:

```go
// Example from MaaS BFF:
type App struct {
    config          config.EnvConfig
    logger          *slog.Logger
    kubernetesClientFactory k8s.KubernetesClientFactory
    repositories    *repositories.Repositories
    testEnv         *envtest.Environment    // only used in mock mode
    maasFakeServer  *httptest.Server        // only used in mock mode
    rootCAs         *x509.CertPool
}
```

### `NewApp` — the wiring function

This is a constructor. It decides which implementations to use based on flags. The key pattern is: swap real clients for mocks at startup, and no other code changes.

```go
func NewApp(cfg config.EnvConfig, logger *slog.Logger) (*App, error) {
    var k8sFactory k8s.KubernetesClientFactory

    if cfg.MockK8Client {
        // Dev mode: use a fake in-memory Kubernetes (envtest)
        k8sFactory, _ = k8mocks.NewMockedKubernetesClientFactory(...)
    } else {
        // Production: real Kubernetes cluster
        k8sFactory, _ = k8s.NewKubernetesClientFactory(cfg, logger)
    }

    // Same pattern for any external HTTP client
    // Example from MaaS BFF: mock the MaaS API with a fake HTTP server
    if cfg.MockHTTPClient {
        maasFakeServer = maas.CreateMaasFakeServer()
        cfg.MaasApiUrl = maasFakeServer.URL  // point at the fake
    }

    // Pick mock or real repository implementations
    var myResourceRepo repositories.MyResourceRepositoryInterface
    if cfg.MockK8Client {
        myResourceRepo = repositories.NewMockMyResourceRepository(logger)
    } else {
        myResourceRepo = repositories.NewMyResourceRepository(logger, k8sFactory, cfg.Namespace)
    }

    repos, _ := repositories.NewRepositories(logger, k8sFactory, cfg, myResourceRepo, ...)

    return &App{
        config:       cfg,
        logger:       logger,
        repositories: repos,
        // ...
    }, nil
}
```

**The key insight:** both `MockMyResourceRepository` and `MyResourceRepository` implement `MyResourceRepositoryInterface`. The rest of the app only ever sees the interface — it doesn't care which one it got.

---

## 3. Routing: `Routes()` in `app.go`

This function builds the entire HTTP routing tree and middleware stack.

```go
func (app *App) Routes() http.Handler {
    // --- API Router (handles /api/v1/*) ---
    apiRouter := httprouter.New()
    apiRouter.NotFound = http.HandlerFunc(app.notFoundResponse)

    // Register all route groups
    attachMyResourceHandlers(apiRouter, app)
    attachOtherHandlers(apiRouter, app)
    // ... etc

    // --- App Mux (top-level URL dispatcher) ---
    appMux := http.NewServeMux()
    appMux.Handle("/api/v1/", apiRouter)          // API calls go to apiRouter
    appMux.HandleFunc("/", func(...) { ... })      // everything else serves frontend files (SPA fallback)

    // --- Apply middleware in a chain ---
    // Read this inside-out: InjectRequestIdentity wraps appMux,
    // EnableCORS wraps that, EnableTelemetry wraps that, RecoverPanic wraps all.
    combinedMux.Handle("/",
        app.RecoverPanic(
            app.EnableTelemetry(
                app.EnableCORS(
                    app.InjectRequestIdentity(appMux)))))

    return combinedMux
}
```

**`httprouter`** is a fast router that supports path parameters like `:name`:

```go
apiRouter.GET("/api/v1/my-resource/:name", ...)
//                                   ^^^^^ captured as params.ByName("name")
```

---

## 4. Middleware: `internal/api/middleware.go`

Middleware wraps handlers — they run before/after the handler and can short-circuit the request. They all follow the same pattern: accept a handler, return a handler.

### `RecoverPanic` — safety net

```go
func (app *App) RecoverPanic(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                // If any handler panics, catch it here instead of crashing the whole server
                app.serverErrorResponse(w, r, fmt.Errorf("%s", err))
            }
        }()
        next.ServeHTTP(w, r)  // call the next handler
    })
}
```

`defer` means "run this when the surrounding function returns" — even if it panicked.

### `InjectRequestIdentity` — who is this user?

```go
func (app *App) InjectRequestIdentity(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Skip auth for non-API paths (healthcheck, static files)
        if !strings.HasPrefix(r.URL.Path, "/api/v1") {
            next.ServeHTTP(w, r)
            return
        }

        // Extract user identity from headers
        // The exact header depends on your auth mode (kubeflow-userid, x-forwarded-access-token, etc.)
        identity, err := app.kubernetesClientFactory.ExtractRequestIdentity(r.Header)
        if err != nil {
            app.badRequestResponse(w, r, err)
            return  // stop here — don't call next
        }

        // Attach identity to the request context so handlers can read it
        ctx := context.WithValue(r.Context(), constants.RequestIdentityKey, identity)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

**`context.WithValue`** is how you pass data through a request's call chain without threading it through every function parameter. Handlers later read it back with `r.Context().Value(constants.RequestIdentityKey)`.

### `EnableTelemetry` — request tracing

```go
func (app *App) EnableTelemetry(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        traceId := uuid.NewString()  // unique ID per request
        ctx := context.WithValue(r.Context(), constants.TraceIdKey, traceId)

        // Attach a logger that automatically includes the trace ID on every log line
        traceLogger := app.logger.With(slog.String("trace_id", traceId))
        ctx = context.WithValue(ctx, constants.TraceLoggerKey, traceLogger)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### `AttachNamespace` — require a namespace query param

This wraps individual route handlers (not the whole app):

```go
func (app *App) AttachNamespace(next func(...)) httprouter.Handle {
    return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
        namespace := r.URL.Query().Get("namespace")
        if namespace == "" {
            app.badRequestResponse(w, r, fmt.Errorf("missing required query parameter: namespace"))
            return
        }
        ctx := context.WithValue(r.Context(), constants.NamespaceHeaderParameterKey, namespace)
        next(w, r.WithContext(ctx), ps)
    }
}
```

---

## 5. Handlers: `internal/api/*_handlers.go`

Handlers are the actual business logic for each route. They follow a consistent pattern:

```
1. Read input (path params, query params, or JSON body)
2. Validate input
3. Call the repository
4. Handle errors (not found vs. server error)
5. Write JSON response
```

Here's a simple list handler (example from MaaS BFF):

```go
func ListSubscriptionsHandler(app *App, w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
    ctx := r.Context()

    subscriptions, err := app.repositories.Subscriptions.ListSubscriptions(ctx)
    if err != nil {
        app.serverErrorResponse(w, r, err)  // 500
        return
    }

    // Wrap data in the standard Envelope shape
    response := Envelope[[]models.MaaSSubscription, None]{
        Data: subscriptions,
    }

    if err := app.WriteJSON(w, http.StatusOK, response, nil); err != nil {
        app.serverErrorResponse(w, r, err)
    }
}
```

Here's a create handler that reads a body and validates (example from MaaS BFF):

```go
func CreateSubscriptionHandler(app *App, w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
    ctx := r.Context()

    // Decode the JSON request body into a Go struct
    var request Envelope[models.CreateSubscriptionRequest, None]
    if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
        app.badRequestResponse(w, r, err)  // 400 — malformed JSON
        return
    }

    // Validate required fields
    if strings.TrimSpace(request.Data.Name) == "" {
        app.badRequestResponse(w, r, errors.New("name is required"))
        return
    }

    // Call the repository (real or mock)
    result, err := app.repositories.Subscriptions.CreateSubscription(ctx, request.Data)
    if err != nil {
        if k8sErrors.IsAlreadyExists(err) {
            app.errorResponse(w, r, &HTTPError{StatusCode: 409, ...})  // Conflict
        } else {
            app.serverErrorResponse(w, r, err)  // 500
        }
        return
    }

    // Write 201 Created with the result
    response := Envelope[*models.CreateSubscriptionResponse, None]{Data: result}
    app.WriteJSON(w, http.StatusCreated, response, nil)
}
```

### The `Envelope` pattern

All responses are wrapped in a consistent JSON shape using a **generic** type:

```go
// D = data type, M = metadata type
type Envelope[D any, M any] struct {
    Data     D `json:"data"`
    Metadata M `json:"metadata,omitempty"`
}

type None *struct{}  // a nil pointer — used when there's no metadata
```

This means every API response looks like:

```json
{
  "data": { ... }
}
```

Go generics (`[D any, M any]`) let you reuse the same struct for any data type while keeping type safety.

---

## 6. Repositories: `internal/repositories/`

Repositories are the data access layer. They hide all the details of talking to Kubernetes or external APIs from the handlers.

### The interface (the contract)

Define an interface for each resource your BFF manages. Example from MaaS BFF:

```go
type SubscriptionsRepositoryInterface interface {
    ListSubscriptions(ctx context.Context) ([]models.MaaSSubscription, error)
    GetSubscription(ctx context.Context, name string) (*models.MaaSSubscription, error)
    CreateSubscription(ctx context.Context, request models.CreateSubscriptionRequest) (*models.CreateSubscriptionResponse, error)
    UpdateSubscription(ctx context.Context, name string, request models.UpdateSubscriptionRequest) (*models.CreateSubscriptionResponse, error)
    DeleteSubscription(ctx context.Context, name string) error
}
```

### Real implementation — talks to Kubernetes

```go
type SubscriptionsRepository struct {
    logger     *slog.Logger
    k8sFactory kubernetes.KubernetesClientFactory
    namespace  string
}

func (r *SubscriptionsRepository) ListSubscriptions(ctx context.Context) ([]models.MaaSSubscription, error) {
    // Get a Kubernetes dynamic client
    client, err := r.k8sFactory.GetClient(ctx)
    kubeClient := client.GetDynamicClient()

    // List your CRDs from the cluster using a GroupVersionResource identifier
    list, err := kubeClient.Resource(constants.MaaSSubscriptionGvr).
        Namespace(r.namespace).
        List(ctx, metav1.ListOptions{})

    // Convert the raw Kubernetes objects to your Go models
    subscriptions := make([]models.MaaSSubscription, 0, len(list.Items))
    for _, item := range list.Items {
        sub, _ := convertUnstructuredToSubscription(&item)
        subscriptions = append(subscriptions, *sub)
    }
    return subscriptions, nil
}
```

**"Unstructured"** is how Go's Kubernetes client represents arbitrary CRD objects — as a raw `map[string]interface{}` (like a JSON blob). You extract fields using path helpers:

```go
// Read "status.phase" from the raw object
phase, _, _ := unstructured.NestedString(content, "status", "phase")

// Read "spec.modelRefs" as a slice
modelRefs, _, _ := unstructured.NestedSlice(content, "spec", "modelRefs")
```

The `GroupVersionResource` (GVR) uniquely identifies your CRD kind in Kubernetes. Define it in your `constants` package:

```go
// Example from MaaS BFF (constants/gvr.go):
MaaSSubscriptionGvr = schema.GroupVersionResource{
    Group:    "maas.opendatahub.io",
    Version:  "v1alpha1",
    Resource: "maassubscriptions",
}

// Your module would define its own:
MyResourceGvr = schema.GroupVersionResource{
    Group:    "mymodule.opendatahub.io",
    Version:  "v1alpha1",
    Resource: "myresources",
}
```

### Mock implementation — returns hardcoded data

```go
// subscriptions_mock.go (example from MaaS BFF)
type MockSubscriptionsRepository struct {
    logger *slog.Logger
}

func (r *MockSubscriptionsRepository) ListSubscriptions(ctx context.Context) ([]models.MaaSSubscription, error) {
    // Return fake data — no Kubernetes needed
    return []models.MaaSSubscription{
        {Name: "basic-subscription", ...},
    }, nil
}
```

Both implement the same interface, so handlers can't tell them apart.

---

## 7. Error Handling: `internal/api/errors.go`

Consistent error responses across all handlers:

```go
type HTTPError struct {
    StatusCode int          `json:"-"`       // json:"-" means "don't include in JSON output"
    Error      ErrorPayload `json:"error"`
}

type ErrorPayload struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

// Helper methods on App — handlers call these instead of writing raw responses
func (app *App) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
    httpError := &HTTPError{
        StatusCode: http.StatusBadRequest,
        Error: ErrorPayload{Code: "400", Message: err.Error()},
    }
    app.errorResponse(w, r, httpError)
}

func (app *App) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
    app.LogError(r, err)  // log the real error server-side

    // Return a generic message to the client — don't leak internals
    httpError := &HTTPError{
        StatusCode: http.StatusInternalServerError,
        Error: ErrorPayload{Code: "500", Message: "the server encountered a problem"},
    }
    app.errorResponse(w, r, httpError)
}
```

Every error response looks like:

```json
{
  "error": {
    "code": "400",
    "message": "name is required"
  }
}
```

---

## Full Request Lifecycle

Here's what happens for a typical `GET /api/v1/my-resources` request:

```
1. HTTP request arrives at :4000

2. RecoverPanic wraps everything — if anything panics, return 500

3. EnableTelemetry — attach a trace_id to the request context

4. EnableCORS — add CORS headers if configured

5. InjectRequestIdentity — extract user identity from the configured header,
   attach to context. If missing → 400 Bad Request.

6. appMux matches "/api/v1/" → routes to apiRouter

7. httprouter matches "GET /api/v1/my-resources" → ListMyResourcesHandler

8. Handler calls app.repositories.MyResource.ListMyResources(ctx)
   → either MockMyResourceRepository or MyResourceRepository (real K8s)

9. Real: fetches CRDs from cluster, converts to []models.MyResource
   Mock: returns hardcoded data immediately

10. Handler wraps result in Envelope{Data: resources}

11. WriteJSON serializes to JSON, sets Content-Type, writes 200 OK

12. Response returned to browser
```

---

## Directory Structure

The starter BFF follows this layout. Every module built on it shares the same shape:

```
bff/
├── cmd/main.go              → Entry point: flags, App init, HTTP server, graceful shutdown
├── internal/api/
│   ├── app.go               → App struct, NewApp() wiring, Routes() middleware chain
│   ├── middleware.go        → RecoverPanic, InjectRequestIdentity, EnableCORS, EnableTelemetry
│   ├── helpers.go           → Envelope[D,M], WriteJSON, ReadJSON
│   ├── errors.go            → HTTPError struct, badRequestResponse, serverErrorResponse, etc.
│   └── *_handlers.go        → One file per resource
├── internal/constants/
│   └── api_routes.go        → All URL path constants
├── internal/repositories/
│   ├── repositories.go      → Repositories struct (container for all repos) + interfaces
│   ├── my_resource.go       → Real K8s-backed CRUD
│   ├── my_resource_mock.go  → Fake data for dev
│   └── ...                  → Same pattern for each resource type
├── internal/models/         → DTOs: request/response structs matching your OpenAPI spec
├── internal/integrations/
│   ├── kubernetes/          → K8s client factory, auth extraction
│   └── <external-api>/      → HTTP client(s) for any external services your module calls
└── internal/config/         → EnvConfig struct (all flags and env vars)
```

The pattern throughout is **interface → real implementation → mock implementation**. `NewApp` picks which one at startup based on flags, and nothing else in the codebase has to change.

---

## Adding a New Resource

When your module needs to expose a new resource type, the steps are always the same:

1. **Define the model** in `internal/models/` — the Go struct that matches your OpenAPI schema.
2. **Define the interface** in `internal/repositories/` — the methods your handlers will call.
3. **Write the real repository** — talk to Kubernetes (your CRD's GVR) or an external API.
4. **Write the mock repository** — return hardcoded data; same interface, no dependencies.
5. **Wire it in `NewApp`** — select real vs. mock based on config flags, add it to `Repositories`.
6. **Write a handler file** — one handler per HTTP method, using `app.repositories.YourResource.*`.
7. **Register routes** in `Routes()` — add an `attachYourResourceHandlers(apiRouter, app)` call.
8. **Add route constants** in `internal/constants/api_routes.go`.
