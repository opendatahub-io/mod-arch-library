package proxy

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/opendatahub-io/mod-arch-library/bff/internal/constants"
	k8s "github.com/opendatahub-io/mod-arch-library/bff/internal/integrations/kubernetes"
	"github.com/opendatahub-io/mod-arch-library/bff/internal/ssrf"
)

const K8sProxyPrefix = "/api/k8s/"

func sensitiveIngressHeaders(authTokenHeader string) []string {
	headers := []string{
		"cookie",
		"x-forwarded-for",
		"x-forwarded-host",
		"x-forwarded-port",
		"x-forwarded-proto",
		"x-forwarded-scheme",
		"x-forwarded-email",
		"x-forwarded-user",
		"x-forwarded-preferred-username",
		"x-forwarded-groups",
		"x-real-ip",
		"forwarded",
	}
	if authTokenHeader != "" {
		headers = append(headers, authTokenHeader)
	}
	return headers
}

type K8sProxyConfig struct {
	K8sHost              string
	RootCAs              *x509.CertPool
	ClientCerts          []tls.Certificate
	InsecureSkipVerify   bool
	AllowHTTP            bool
	AuthTokenHeader      string
	SetOutboundHeadersFn func(*http.Request, http.Header)
	SSRFValidateTarget   bool
	Logger               *slog.Logger
}

func NewK8sProxyHandler(cfg K8sProxyConfig) (http.Handler, error) {
	if cfg.K8sHost == "" {
		return nil, fmt.Errorf("K8sHost must be a non-empty absolute http/https URL")
	}
	targetURL, err := url.Parse(cfg.K8sHost)
	if err != nil {
		return nil, fmt.Errorf("failed to parse K8s API server URL %q: %w", cfg.K8sHost, err)
	}
	if (targetURL.Scheme != "http" && targetURL.Scheme != "https") || targetURL.Host == "" {
		return nil, fmt.Errorf("K8sHost must be an absolute http/https URL, got %q", cfg.K8sHost)
	}

	proxy, err := NewReverseProxy(ProxyConfig{
		TargetURL:            targetURL,
		RootCAs:              cfg.RootCAs,
		ClientCerts:          cfg.ClientCerts,
		InsecureSkipVerify:   cfg.InsecureSkipVerify,
		AllowHTTP:            cfg.AllowHTTP,
		SetOutboundHeadersFn: cfg.SetOutboundHeadersFn,
		StripHeaders:         sensitiveIngressHeaders(cfg.AuthTokenHeader),
		SSRFValidateTarget:   cfg.SSRFValidateTarget,
		SSRFAllowedHosts:     []string{targetURL.Hostname()},
		Logger:               cfg.Logger,
		PathRewriteFn: func(r *http.Request) string {
			return strings.TrimPrefix(r.URL.Path, strings.TrimSuffix(K8sProxyPrefix, "/"))
		},
		AuthHeaderFn: func(r *http.Request) string {
			identity, ok := r.Context().Value(constants.RequestIdentityKey).(*k8s.RequestIdentity)
			if !ok || identity == nil {
				return ""
			}
			return "Bearer " + identity.Token
		},
		ModifyResponse: ssrf.NewRedirectValidator(cfg.Logger),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create K8s reverse proxy: %w", err)
	}

	return proxy, nil
}
