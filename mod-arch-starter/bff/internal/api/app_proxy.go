package api

import (
	"crypto/tls"
	"log/slog"

	helper "github.com/opendatahub-io/mod-arch-library/bff/internal/helpers"
	"github.com/opendatahub-io/mod-arch-library/bff/internal/proxy"
	clientRest "k8s.io/client-go/rest"
)

func resolveK8sHost(testEnvConfig *clientRest.Config) (string, *tls.Certificate, error) {
	if testEnvConfig != nil {
		cert, err := tls.X509KeyPair(testEnvConfig.CertData, testEnvConfig.KeyData)
		if err != nil {
			return "", nil, err
		}
		return testEnvConfig.Host, &cert, nil
	}

	kubeConfig, err := helper.GetKubeconfig()
	if err != nil {
		inClusterConfig, inClusterErr := clientRest.InClusterConfig()
		if inClusterErr != nil {
			return "", nil, err
		}
		kubeConfig = inClusterConfig
	}

	var clientCert *tls.Certificate
	if kubeConfig.CertData != nil && kubeConfig.KeyData != nil {
		cert, err := tls.X509KeyPair(kubeConfig.CertData, kubeConfig.KeyData)
		if err == nil {
			clientCert = &cert
		} else {
			slog.Warn("failed to load inline client certificate from kubeconfig", slog.Any("error", err))
		}
	} else if kubeConfig.CertFile != "" && kubeConfig.KeyFile != "" {
		cert, err := tls.LoadX509KeyPair(kubeConfig.CertFile, kubeConfig.KeyFile)
		if err == nil {
			clientCert = &cert
		} else {
			slog.Warn("failed to load client certificate files from kubeconfig",
				slog.String("certFile", kubeConfig.CertFile),
				slog.String("keyFile", kubeConfig.KeyFile),
				slog.Any("error", err))
		}
	}

	return kubeConfig.Host, clientCert, nil
}

func (app *App) initK8sProxy() error {
	var testEnvConfig *clientRest.Config
	if app.testEnv != nil && app.testEnv.Config != nil {
		testEnvConfig = app.testEnv.Config
	}

	k8sHost, clientCert, err := resolveK8sHost(testEnvConfig)
	if err != nil {
		return err
	}

	var clientCerts []tls.Certificate
	if clientCert != nil {
		clientCerts = []tls.Certificate{*clientCert}
	}

	allowHTTP := app.config.DevMode || app.config.MockK8Client

	app.wsTracker = proxy.NewConnectionTracker(app.logger)

	k8sProxy, err := proxy.NewK8sProxyHandler(proxy.K8sProxyConfig{
		K8sHost:            k8sHost,
		RootCAs:            app.rootCAs,
		ClientCerts:        clientCerts,
		InsecureSkipVerify: app.config.InsecureSkipVerify,
		AllowHTTP:          allowHTTP,
		AuthTokenHeader:    app.config.AuthTokenHeader,
		SSRFValidateTarget: !app.config.DevMode,
		Logger:             app.logger,
	})
	if err != nil {
		return err
	}
	app.k8sProxy = k8sProxy

	wsProxy, err := proxy.NewWsProxyHandler(proxy.WsProxyConfig{
		K8sHost:            k8sHost,
		RootCAs:            app.rootCAs,
		ClientCerts:        clientCerts,
		InsecureSkipVerify: app.config.InsecureSkipVerify,
		AllowHTTP:          allowHTTP,
		AllowedOrigins:     app.config.AllowedOrigins,
		SSRFValidateTarget: !app.config.DevMode,
		Tracker:            app.wsTracker,
		Logger:             app.logger,
	})
	if err != nil {
		return err
	}
	app.wsProxy = wsProxy

	app.logger.Info("K8s proxy initialized",
		slog.String("k8s_host", k8sHost),
		slog.Bool("ssrf_enabled", !app.config.DevMode))

	return nil
}
