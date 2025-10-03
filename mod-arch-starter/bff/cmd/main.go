package main

import (
	"context"
	"crypto/tls"
	"flag"
	"fmt"
	"os/signal"
	"syscall"

	"github.com/kubeflow/mod-arch/ui/bff/internal/api"
	"github.com/kubeflow/mod-arch/ui/bff/internal/config"

	"log/slog"
	"net/http"
	"os"
	"time"
)

func main() {
	var cfg config.EnvConfig
	fmt.Println("Starting Modular Architecture Starter BFF!")
	flag.IntVar(&cfg.Port, "port", getEnvAsInt("PORT", 8080), "API server port")
	flag.BoolVar(&cfg.MockK8Client, "mock-k8s-client", false, "Use mock Kubernetes client")
	// Deployment / runtime flags
	var deploymentModeRaw string
	flag.StringVar(&deploymentModeRaw, "deployment-mode", getEnvAsString("DEPLOYMENT_MODE", "standalone"), "Deployment mode (standalone|integrated)")
	flag.BoolVar(&cfg.DevMode, "dev-mode", getEnvAsBool("DEV_MODE", false), "Enable developer friendly behavior (verbose errors, relaxed CORS)")
	flag.StringVar(&cfg.CertFile, "cert-file", getEnvAsString("TLS_CERT_FILE", ""), "TLS certificate file (enables HTTPS if set with key-file)")
	flag.StringVar(&cfg.KeyFile, "key-file", getEnvAsString("TLS_KEY_FILE", ""), "TLS private key file (enables HTTPS if set with cert-file)")
	flag.BoolVar(&cfg.InsecureSkipVerify, "insecure-skip-verify", getEnvAsBool("INSECURE_SKIP_VERIFY", false), "Skip TLS verification for outbound calls (development only)")

	flag.StringVar(&cfg.StaticAssetsDir, "static-assets-dir", "./static", "Configure frontend static assets root directory")
	flag.TextVar(&cfg.LogLevel, "log-level", parseLevel(getEnvAsString("LOG_LEVEL", "INFO")), "Sets server log level, possible values: error, warn, info, debug")
	flag.Func("allowed-origins", "Sets allowed origins for CORS purposes, accepts a comma separated list of origins or * to allow all, default none", newOriginParser(&cfg.AllowedOrigins, getEnvAsString("ALLOWED_ORIGINS", "")))
	flag.StringVar(&cfg.AuthMethod, "auth-method", "internal", "Authentication method (internal or user_token)")
	flag.StringVar(&cfg.AuthTokenHeader, "auth-token-header", getEnvAsString("AUTH_TOKEN_HEADER", config.DefaultAuthTokenHeader), "Header used to extract the token (e.g., Authorization)")
	flag.StringVar(&cfg.AuthTokenPrefix, "auth-token-prefix", getEnvAsString("AUTH_TOKEN_PREFIX", config.DefaultAuthTokenPrefix), "Prefix used in the token header (e.g., 'Bearer ')")

	flag.Parse()

	// Parse deployment mode
	dm, err := config.ParseDeploymentMode(deploymentModeRaw)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	cfg.DeploymentMode = dm

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel,
	}))

	//validate auth method
	if cfg.AuthMethod != config.AuthMethodInternal && cfg.AuthMethod != config.AuthMethodUser {
		logger.Error("invalid auth method: (must be internal or user_token)", "authMethod", cfg.AuthMethod)
		os.Exit(1)
	}

	// Only use for logging errors about logging configuration.
	slog.SetDefault(logger)

	app, err := api.NewApp(cfg, slog.New(logger.Handler()))
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	srv := &http.Server{Addr: fmt.Sprintf(":%d", cfg.Port), Handler: app.Routes(), IdleTimeout: time.Minute, ReadTimeout: 30 * time.Second, WriteTimeout: 30 * time.Second, ErrorLog: slog.NewLogLogger(logger.Handler(), slog.LevelError)}

	// Configure TLS if both cert and key are provided
	useTLS := cfg.CertFile != "" && cfg.KeyFile != ""
	if useTLS {
		// Minimal secure defaults; can be extended.
		srv.TLSConfig = &tls.Config{MinVersion: tls.VersionTLS12}
	}

	// Start the server in a goroutine
	go func() {
		logger.Info("starting server", "addr", srv.Addr, "deploymentMode", cfg.DeploymentMode, "devMode", cfg.DevMode, "tls", useTLS)
		var serveErr error
		if useTLS {
			serveErr = srv.ListenAndServeTLS(cfg.CertFile, cfg.KeyFile)
		} else {
			serveErr = srv.ListenAndServe()
		}
		if serveErr != nil && serveErr != http.ErrServerClosed {
			logger.Error("HTTP server error", "error", serveErr)
		}
	}()

	// Graceful shutdown setup
	shutdownCh := make(chan os.Signal, 1)
	signal.Notify(shutdownCh, os.Interrupt, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	// Wait for shutdown signal
	<-shutdownCh
	logger.Info("shutting down gracefully...")

	// Create a context with timeout for the shutdown process
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown the HTTP server gracefully
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("server shutdown failed", "error", err)
	}

	// Shutdown the App gracefully
	if err := app.Shutdown(); err != nil {
		logger.Error("failed to shutdown Kubernetes manager", "error", err)
	}

	logger.Info("server stopped")
	os.Exit(0)
}
