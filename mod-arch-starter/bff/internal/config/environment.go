package config

import (
	"fmt"
	"log/slog"
)

const (
	// AuthMethodInternal uses the credentials of the running backend.
	AuthMethodInternal = "internal"
	// AuthMethodUser uses a user-provided Bearer token for authentication.
	AuthMethodUser = "user_token"
	// DefaultAuthTokenHeader is the standard header for Bearer token auth.
	DefaultAuthTokenHeader = "Authorization"
	// DefaultAuthTokenPrefix is the prefix used in the Authorization header (includes trailing space).
	DefaultAuthTokenPrefix = "Bearer "
)

type EnvConfig struct {
	Port            int
	MockK8Client    bool
	StaticAssetsDir string
	LogLevel        slog.Level
	AllowedOrigins  []string

	// Auth configuration
	AuthMethod      string
	AuthTokenHeader string
	AuthTokenPrefix string

	// TLS / security
	CertFile           string
	KeyFile            string
	InsecureSkipVerify bool

	// Development convenience
	DevMode bool

	// Deployment mode (standalone, integrated, federated, etc.) kept generic for future extension
	DeploymentMode DeploymentMode
}

// DeploymentMode represents the operating integration profile for the backend.
// Keep the enum minimal for the starter while allowing extension.
type DeploymentMode string

const (
	DeploymentModeStandalone DeploymentMode = "standalone"
	DeploymentModeIntegrated DeploymentMode = "integrated"
)

// IsIntegrated returns true if running in integrated mode.
func (d DeploymentMode) IsIntegrated() bool { return d == DeploymentModeIntegrated }

// String implements fmt.Stringer
func (d DeploymentMode) String() string { return string(d) }

// ParseDeploymentMode converts a string into a DeploymentMode, defaulting to standalone.
func ParseDeploymentMode(s string) (DeploymentMode, error) {
	switch DeploymentMode(s) {
	case DeploymentModeStandalone, DeploymentModeIntegrated:
		return DeploymentMode(s), nil
	case "":
		return DeploymentModeStandalone, nil
	default:
		return DeploymentModeStandalone, fmt.Errorf("invalid deployment mode: %s", s)
	}
}
