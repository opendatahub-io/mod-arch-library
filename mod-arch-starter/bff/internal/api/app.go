package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"path"

	helper "github.com/kubeflow/mod-arch/ui/bff/internal/helpers"
	k8s "github.com/kubeflow/mod-arch/ui/bff/internal/integrations/kubernetes"

	"github.com/kubeflow/mod-arch/ui/bff/internal/config"
	"github.com/kubeflow/mod-arch/ui/bff/internal/repositories"

	"github.com/julienschmidt/httprouter"
)

const (
	Version         = "1.0.0"
	PathPrefix      = ""        // optional UI prefix (empty for starter)
	ApiPathPrefix   = "/api/v1" // base API prefix
	HealthCheckPath = "/healthcheck"
	UserPath        = ApiPathPrefix + "/user"
	NamespacePath   = ApiPathPrefix + "/namespaces"
)

type App struct {
	config                  config.EnvConfig
	logger                  *slog.Logger
	kubernetesClientFactory k8s.KubernetesClientFactory
	repositories            *repositories.Repositories
}

func NewApp(cfg config.EnvConfig, logger *slog.Logger) (*App, error) {
	logger.Debug("Initializing app with config", slog.Any("config", cfg))
	k8sFactory, err := k8s.NewKubernetesClientFactory(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
	}
	app := &App{config: cfg, logger: logger, kubernetesClientFactory: k8sFactory, repositories: repositories.NewRepositories()}
	return app, nil
}

func (app *App) Shutdown() error { app.logger.Info("shutting down app..."); return nil }

func (app *App) Routes() http.Handler {
	// Router for /api/v1/*
	apiRouter := httprouter.New()

	apiRouter.NotFound = http.HandlerFunc(app.notFoundResponse)
	apiRouter.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedResponse)

	// Minimal Kubernetes-backed starter endpoints
	apiRouter.GET(UserPath, app.UserHandler)
	apiRouter.GET(NamespacePath, app.GetNamespacesHandler)

	// App Router
	appMux := http.NewServeMux()

	// handler for api calls
	appMux.Handle(ApiPathPrefix+"/", apiRouter)

	// file server for the frontend file and SPA routes
	staticDir := http.Dir(app.config.StaticAssetsDir)
	fileServer := http.FileServer(staticDir)
	appMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctxLogger := helper.GetContextLoggerFromReq(r)
		// Check if the requested file exists
		if _, err := staticDir.Open(r.URL.Path); err == nil {
			ctxLogger.Debug("Serving static file", slog.String("path", r.URL.Path))
			// Serve the file if it exists
			fileServer.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for SPA routes
		ctxLogger.Debug("Static asset not found, serving index.html", slog.String("path", r.URL.Path))
		http.ServeFile(w, r, path.Join(app.config.StaticAssetsDir, "index.html"))
	})

	// Create a mux for the healthcheck endpoint
	healthcheckMux := http.NewServeMux()
	healthcheckRouter := httprouter.New()
	healthcheckRouter.GET(HealthCheckPath, app.HealthcheckHandler)
	healthcheckMux.Handle(HealthCheckPath, app.RecoverPanic(app.EnableTelemetry(healthcheckRouter)))

	// Combines the healthcheck endpoint with the rest of the routes
	combinedMux := http.NewServeMux()
	combinedMux.Handle(HealthCheckPath, healthcheckMux)
	combinedMux.Handle("/", app.RecoverPanic(app.EnableTelemetry(app.EnableCORS(app.InjectRequestIdentity(appMux)))))

	return combinedMux
}
