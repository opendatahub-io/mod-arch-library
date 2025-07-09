# Implementation Approaches

We support multiple implementation strategies to accommodate different deployment scenarios and organizational needs. Each approach has specific strengths and is suited for different contexts.

## 1. Standalone Micro-Frontend Approach

**Best for**: New features, upstream-first development, and independent deployment scenarios.

### Key Features

- Each feature is developed as a completely independent application
- Has its own repository, deployment pipeline, and release cycle
- Can be consumed by multiple host applications
- Follows strict upstream-first development practices

### Architecture Overview

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Independent    │    │  Independent    │    │  Independent    │
│  Module A       │    │  Module B       │    │  Module C       │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ Frontend  │  │    │  │ Frontend  │  │    │  │ Frontend  │  │
│  │ (React)   │  │    │  │ (React)   │  │    │  │ (React)   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │    BFF    │  │    │  │    BFF    │  │    │  │    BFF    │  │
│  │ (Golang)  │  │    │  │ (Golang)  │  │    │  │ (Golang)  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Example: Model Registry with Shared Library Integration

```text
Repository: kubeflow/model-registry
├── frontend/        # React micro-frontend
│   ├── src/
│   │   ├── components/     # Module-specific components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Module-specific hooks
│   │   ├── api/           # API integration layer
│   │   └── types/         # TypeScript definitions
│   ├── package.json       # Dependencies including @mod-arch/shared
│   └── webpack.config.js  # Module federation config
├── backend/         # Golang BFF
│   ├── cmd/
│   │   └── main.go        # Server entry point with shared middleware
│   ├── pkg/
│   │   ├── handlers/      # HTTP handlers
│   │   ├── services/      # Business logic
│   │   └── types/         # Go type definitions
│   ├── go.mod            # Dependencies including mod-arch/shared
│   └── Dockerfile
├── manifests/       # K8s deployment configs
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
├── scripts/         # Development and build scripts
│   ├── build.sh
│   ├── test.sh
│   └── deploy.sh
└── docs/           # Feature-specific documentation
    ├── README.md
    ├── API.md
    └── DEVELOPMENT.md
```

### Integration with Shared Library

#### Frontend Setup

```typescript
// src/main.tsx - Module entry point
import { 
  AppContextProvider,
  ThemeProvider,
  UserProvider,
  NotificationProvider 
} from '@mod-arch/shared';
import { ModelRegistryApp } from './App';

function ModuleBootstrap() {
  return (
    <AppContextProvider config={moduleConfig}>
      <ThemeProvider>
        <UserProvider>
          <NotificationProvider>
            <ModelRegistryApp />
          </NotificationProvider>
        </UserProvider>
      </ThemeProvider>
    </AppContextProvider>
  );
}

// Module federation export
export default ModuleBootstrap;
```

#### Backend Integration

```go
// cmd/main.go - BFF server with shared utilities
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/mod-arch/shared/auth"
    "github.com/mod-arch/shared/api"
    "github.com/mod-arch/shared/k8s"
    "github.com/mod-arch/shared/monitoring"
)

func main() {
    r := gin.New()
    
    // Apply shared middleware stack
    r.Use(monitoring.RequestMetrics())
    r.Use(auth.ValidateToken())
    r.Use(api.ErrorHandler())
    r.Use(api.CORS())
    
    // Kubernetes client with shared configuration
    k8sClient := k8s.NewClientWithAuth()
    
    // Register module-specific routes
    api.RegisterModelRoutes(r, k8sClient)
    api.RegisterVersionRoutes(r, k8sClient)
    
    r.Run(":8080")
}
```

### Development Workflow with Shared Library

1. **Repository Setup**: Create independent repository with shared library dependencies
2. **Provider Configuration**: Set up shared providers and context in module entry point
3. **Component Development**: Build UI using shared components and design system
4. **API Integration**: Implement BFF using shared middleware and utilities
5. **Local Development**: Use shared library dev tools for hot reloading and testing
6. **Testing**: Run tests with shared library mocks and utilities
7. **Deployment**: Deploy module with shared library optimizations
8. **Integration**: Configure host applications with proper provider hierarchy

#### Local Development Commands

```bash
# Install dependencies including shared library
npm install @mod-arch/shared

# Start development server with shared library hot reload
npm run dev:shared

# Run tests with shared utilities
npm run test:integration

# Build for production with shared optimizations
npm run build:optimized
```

#### Shared Library Development Workflow

```bash
# Link local shared library for development
npm link @mod-arch/shared

# Watch for shared library changes
npm run dev:watch-shared

# Test module with latest shared library
npm run test:with-shared-latest
```

### Benefits

- **Complete Independence**: No dependencies on other modules or host applications
- **Technology Freedom**: Can choose optimal technologies for specific requirements
- **Upstream First**: Natural alignment with open-source development practices
- **Multi-Host Support**: Same module can be consumed by different applications

### Challenges

- **Integration Complexity**: Requires careful design of integration points
- **Shared Dependencies**: Need to manage shared libraries carefully
- **Discovery**: Host applications need to discover and configure modules
- **Coordination**: Some coordination needed for consistent user experience

## 2. Module Federation Approach

**Best for**: Existing applications that need to gradually adopt modular patterns.

### Module Federation Features

- Uses Webpack Module Federation for runtime composition
- Enables dynamic loading of micro-frontends
- Supports gradual migration from monolithic to modular
- Maintains single deployment while enabling module independence

### Module Federation Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Host Application                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Remote    │  │   Remote    │  │   Remote    │            │
│  │  Module A   │  │  Module B   │  │  Module C   │            │
│  │             │  │             │  │             │            │
│  │ @mf/modA    │  │ @mf/modB    │  │ @mf/modC    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│         ┌─────────────────────────────────────────┐             │
│         │        Shared Dependencies              │             │
│         │ React, PatternFly, Common Utils         │             │
│         └─────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Structure

```text
Host Application (Dashboard)
├── Core shell and routing
├── Shared dependencies management
├── Module federation configuration
└── Dynamic module loading

Remote Modules
├── Model Registry Module (@mf/modelRegistry)
│   ├── Webpack configuration for federation
│   ├── Exposed components and routes
│   └── BFF proxy integration
├── KServe Module (@odh-dashboard/kserve)
└── Model Serving Module (@odh-dashboard/model-serving)
```

### Enhanced Module Federation Configuration

**Host Application (webpack.config.js)** with shared library optimization:

```javascript
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        '@mf/modelRegistry': 'modelRegistry@/_mf/modelRegistry/remoteEntry.js',
        '@mf/kserve': 'kserve@/_mf/kserve/remoteEntry.js',
        '@mf/serving': 'serving@/_mf/serving/remoteEntry.js'
      },
      shared: {
        // React ecosystem
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true },
        
        // Design system
        '@patternfly/react-core': { singleton: true },
        '@patternfly/react-table': { singleton: true },
        
        // Shared library (singleton to ensure single instance)
        '@mod-arch/shared': { 
          singleton: true, 
          requiredVersion: '^1.0.0',
          shareScope: 'default'
        },
        
        // State management
        'react-query': { singleton: true },
        
        // Utilities
        lodash: { singleton: false },
        axios: { singleton: true }
      }
    })
  ]
};
```

**Remote Module (webpack.config.js)** with optimized sharing:

```javascript
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'modelRegistry',
      filename: 'remoteEntry.js',
      exposes: {
        './ModelRegistryApp': './src/ModuleApp',
        './ModelRegistryRoutes': './src/routes',
        './ModelRegistryProvider': './src/providers/ModuleProvider'
      },
      shared: {
        // Core dependencies (must match host)
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        
        // Shared library with strict versioning
        '@mod-arch/shared': { 
          singleton: true,
          requiredVersion: '^1.0.0',
          shareKey: 'shared-lib',
          shareScope: 'default'
        },
        
        // Module-specific dependencies (not shared)
        'model-registry-client': { singleton: false }
      }
    })
  ]
};
```

### Advanced Module Federation Patterns

#### Provider Composition Pattern

```typescript
// Host application provider setup
import { 
  AppContextProvider,
  ThemeProvider,
  UserProvider 
} from '@mod-arch/shared';

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppContextProvider>
      <ThemeProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </ThemeProvider>
    </AppContextProvider>
  );
}

// Remote module integration
const ModelRegistryModule = React.lazy(() => import('@mf/modelRegistry/ModelRegistryApp'));

function App() {
  return (
    <AppProviders>
      <Suspense fallback={<LoadingSpinner />}>
        <ModelRegistryModule />
      </Suspense>
    </AppProviders>
  );
}
```

#### Error Boundary Pattern

```typescript
// Shared error boundary from shared library
import { ModuleErrorBoundary } from '@mod-arch/shared';

function SafeModuleLoader({ moduleName, fallback }: ModuleLoaderProps) {
  const ModuleComponent = React.lazy(() => 
    import(`@mf/${moduleName}/App`).catch(error => {
      console.error(`Failed to load module ${moduleName}:`, error);
      return { default: () => fallback };
    })
  );

  return (
    <ModuleErrorBoundary moduleName={moduleName}>
      <Suspense fallback={<ModuleLoadingSpinner />}>
        <ModuleComponent />
      </Suspense>
    </ModuleErrorBoundary>
  );
}
```

### Module Federation Workflow

1. **Module Development**: Develop modules independently with federation configuration
2. **Local Testing**: Test modules both standalone and within host application
3. **Integration**: Configure host to load remote modules
4. **Deployment**: Deploy modules and update host configuration
5. **Runtime Loading**: Modules loaded dynamically at runtime

### Module Federation Benefits

- **Gradual Migration**: Enables incremental adoption of modular patterns
- **Shared Dependencies**: Efficient sharing of common libraries
- **Single Deployment**: Can maintain single deployment unit during transition
- **Development Independence**: Teams can develop modules independently

### Module Federation Challenges

- **Webpack Dependency**: Tied to Webpack and Module Federation technology
- **Complexity**: Additional complexity in build and deployment configuration
- **Version Management**: Careful coordination of shared dependency versions
- **Runtime Failures**: Module loading failures can affect application stability

## 3. Hybrid Approach

**Best for**: Organizations with mixed requirements and legacy constraints.

### Hybrid Features

- Combines both standalone and federated approaches
- Allows for flexible migration strategies
- Supports different team preferences and technical constraints
- Enables experimentation with different patterns

### Hybrid Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Hybrid Architecture                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Standalone  │  │        Federated Section               │  │
│  │ Module A    │  │                                        │  │
│  │             │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │ (iframe or  │  │  │Remote   │  │Remote   │  │Remote   │ │  │
│  │  direct     │  │  │Module B │  │Module C │  │Module D │ │  │
│  │  link)      │  │  └─────────┘  └─────────┘  └─────────┘ │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
│                                                                 │
│                    Shared UI Library                           │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Strategies

#### Strategy 1: Progressive Federation

Start with module federation and gradually extract modules to standalone:

1. **Phase 1**: Implement module federation for new features
2. **Phase 2**: Extract stable modules to standalone deployment
3. **Phase 3**: Maintain federation for experimental or tightly coupled features

#### Strategy 2: Domain-Based Approach

Use different approaches based on domain characteristics:

- **Core Features**: Module federation for tight integration
- **Experimental Features**: Standalone for maximum flexibility
- **External Integrations**: Standalone for independent lifecycle

#### Strategy 3: Team-Based Approach

Allow teams to choose approach based on their constraints:

- **Upstream Teams**: Standalone for community engagement
- **Product Teams**: Module federation for integration efficiency
- **Platform Teams**: Hybrid for maximum flexibility

### Hybrid Benefits

- **Maximum Flexibility**: Can choose optimal approach for each situation
- **Risk Mitigation**: Can experiment with different patterns
- **Team Autonomy**: Teams can work with their preferred approach
- **Gradual Evolution**: Architecture can evolve over time

### Hybrid Challenges

- **Complexity**: Managing multiple approaches increases overall complexity
- **Consistency**: Need to maintain consistency across different patterns
- **Tooling**: May require different tooling for different approaches
- **Coordination**: More coordination needed across different teams and patterns

## Choosing the Right Approach

### Decision Matrix

| Factor | Standalone | Module Federation | Hybrid |
|--------|------------|-------------------|--------|
| **Team Independence** | ★★★ | ★★☆ | ★★★ |
| **Upstream First** | ★★★ | ★☆☆ | ★★☆ |
| **Migration Ease** | ★☆☆ | ★★★ | ★★☆ |
| **Technology Flexibility** | ★★★ | ★★☆ | ★★★ |
| **Deployment Complexity** | ★★☆ | ★★★ | ★☆☆ |
| **Performance** | ★★☆ | ★★★ | ★★☆ |
| **Bundle Sharing** | ★☆☆ | ★★★ | ★★☆ |

### Recommendations

#### Choose Standalone When

- Building new features from scratch
- Strong upstream-first requirements
- Team prefers complete independence
- Need maximum technology flexibility
- Have infrastructure for independent deployments

#### Choose Module Federation When

- Migrating existing monolithic application
- Need efficient bundle sharing
- Want gradual adoption of modular patterns
- Have existing Webpack-based build system
- Prefer single deployment model

#### Choose Hybrid When

- Have mixed requirements across different features
- Want to experiment with different approaches
- Teams have different preferences and constraints
- Need flexibility for future architectural evolution
- Have complex legacy migration requirements

## Implementation Guidelines

### Best Practices

1. **Start Small**: Begin with a pilot module to validate the approach
2. **Define Contracts**: Clearly define APIs and integration points
3. **Automate Testing**: Implement comprehensive testing for all integration points
4. **Monitor Performance**: Track loading times and user experience metrics
5. **Document Patterns**: Maintain clear documentation of chosen patterns

### Common Pitfalls

- **Over-Engineering**: Don't create modules for every small feature
- **Under-Engineering**: Don't ignore the need for proper abstraction
- **Inconsistent Patterns**: Maintain consistency within chosen approach
- **Version Conflicts**: Carefully manage shared dependency versions
- **Integration Neglect**: Don't ignore the complexity of module integration

## Conclusion

Each implementation approach has its strengths and is suited for different contexts. The key is to choose the approach that best aligns with your team's capabilities, project requirements, and strategic goals. Many organizations find success with a hybrid approach that allows them to adopt the best pattern for each specific situation.

---

**Next Steps**: Review [Benefits and Value](./06-benefits-and-value.md) to understand the business impact of these approaches, or explore [Technology Standards](./07-technology-standards.md) for implementation details.

## 4. Real-World Example: Model Registry Implementation

The **Model Registry UI** provides a comprehensive real-world example of how our modular architecture patterns are implemented in practice. This section examines specific implementation details and patterns from the actual Model Registry codebase.

### Multi-Deployment Configuration

The Model Registry demonstrates sophisticated deployment mode handling:

```typescript
// Deployment mode configuration from environment
interface ModelRegistryConfig {
  deploymentMode: 'standalone' | 'kubeflow' | 'federated';
  styleTheme: 'patternfly-theme' | 'mui-theme';
  authMethod: 'internal' | 'user_token';
  staticAssetsDir: string;
  allowedOrigins: string[];
}

// Environment-based configuration loading
const loadModelRegistryConfig = (): ModelRegistryConfig => {
  return {
    deploymentMode: process.env.DEPLOYMENT_MODE as any || 'standalone',
    styleTheme: process.env.STYLE_THEME as any || 'patternfly-theme',
    authMethod: process.env.AUTH_METHOD as any || 'user_token',
    staticAssetsDir: process.env.STATIC_ASSETS_DIR || '/app/dist',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  };
};
```

### BFF Implementation with Comprehensive Middleware

The Model Registry BFF demonstrates a production-ready middleware stack:

```go
// Complete middleware chain from Model Registry
func setupMiddlewareChain(router *mux.Router, config *Config) {
    // 1. Recovery middleware (must be first)
    router.Use(middleware.Recovery())
    
    // 2. Telemetry and observability
    router.Use(middleware.Telemetry())
    
    // 3. CORS handling
    router.Use(middleware.CORS(config.AllowedOrigins))
    
    // API-specific middleware
    apiRouter := router.PathPrefix("/api/v1").Subrouter()
    
    // 4. Identity injection based on auth method
    apiRouter.Use(middleware.IdentityInjection(config.AuthMethod))
    
    // 5. Namespace attachment for K8s operations
    apiRouter.Use(middleware.NamespaceAttachment())
    
    // 6. Authorization using K8s RBAC
    apiRouter.Use(middleware.Authorization())
    
    // 7. REST client attachment for API proxying
    apiRouter.Use(middleware.RESTClientAttachment())
}

// Identity injection supporting multiple auth methods
func (m *IdentityMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
    var identity *UserIdentity
    
    switch m.authMethod {
    case "internal":
        // Service account with user impersonation
        userID := r.Header.Get("kubeflow-userid")
        groups := strings.Split(r.Header.Get("kubeflow-groups"), ",")
        identity = &UserIdentity{UserID: userID, Groups: groups}
        
    case "user_token":
        // Bearer token authentication
        authHeader := r.Header.Get("Authorization")
        if token := extractBearerToken(authHeader); token != "" {
            identity = &UserIdentity{Token: token}
        }
    }
    
    if identity == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    ctx := context.WithValue(r.Context(), "user_identity", identity)
    next(w, r.WithContext(ctx))
}
```

### Advanced Authentication Architecture

The Model Registry implements sophisticated authentication patterns that can serve as a reference for other modules:

#### Dual Authentication Methods

```go
// Authentication method switching based on deployment mode
type AuthenticationMethod struct {
    Method         string    // "internal" or "user_token"
    K8sClient      kubernetes.Interface
    MockMode       bool      // Enable for development
}

func (am *AuthenticationMethod) IdentityMiddleware() func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            switch am.Method {
            case "internal":
                // Kubeflow integration mode
                userID := r.Header.Get("kubeflow-userid")
                groups := r.Header.Get("kubeflow-groups")
                
                if userID == "" {
                    http.Error(w, "Missing user identity", http.StatusUnauthorized)
                    return
                }
                
                // Store in request context
                ctx := context.WithValue(r.Context(), "user-id", userID)
                ctx = context.WithValue(ctx, "user-groups", groups)
                r = r.WithContext(ctx)
                
            case "user_token":
                // Standalone mode with Bearer tokens
                authHeader := r.Header.Get("Authorization")
                if !strings.HasPrefix(authHeader, "Bearer ") {
                    http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
                    return
                }
                
                token := strings.TrimPrefix(authHeader, "Bearer ")
                userID, groups, err := am.validateToken(token)
                if err != nil {
                    http.Error(w, "Token validation failed", http.StatusUnauthorized)
                    return
                }
                
                ctx := context.WithValue(r.Context(), "user-id", userID)
                ctx = context.WithValue(ctx, "user-groups", groups)
                r = r.WithContext(ctx)
            }
            
            next.ServeHTTP(w, r)
        })
    }
}
```

#### Kubernetes RBAC Integration

```go
// Authorization using Subject Access Review (SAR) and Self Subject Access Review (SSAR)
func (am *AuthenticationMethod) AuthorizationMiddleware() func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            userID := r.Context().Value("user-id").(string)
            namespace := extractNamespaceFromRequest(r)
            
            var hasPermission bool
            var err error
            
            if am.MockMode {
                // Development mode - allow all requests
                hasPermission = true
            } else {
                switch am.Method {
                case "internal":
                    hasPermission, err = am.checkSAR(userID, namespace, r)
                case "user_token":
                    hasPermission, err = am.checkSSAR(r, namespace)
                }
            }
            
            if err != nil {
                http.Error(w, fmt.Sprintf("Authorization failed: %v", err), http.StatusInternalServerError)
                return
            }
            
            if !hasPermission {
                http.Error(w, "Insufficient permissions", http.StatusForbidden)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

// Subject Access Review for impersonation-based auth
func (am *AuthenticationMethod) checkSAR(userID, namespace string, r *http.Request) (bool, error) {
    sar := &authv1.SubjectAccessReview{
        Spec: authv1.SubjectAccessReviewSpec{
            User: userID,
            ResourceAttributes: &authv1.ResourceAttributes{
                Namespace: namespace,
                Verb:      httpMethodToVerb(r.Method),
                Group:     "",
                Resource:  "services",
                Name:      extractServiceName(r),
            },
        },
    }
    
    result, err := am.K8sClient.AuthorizationV1().SubjectAccessReviews().Create(
        context.TODO(), sar, metav1.CreateOptions{})
    if err != nil {
        return false, err
    }
    
    return result.Status.Allowed, nil
}

// Self Subject Access Review for token-based auth
func (am *AuthenticationMethod) checkSSAR(r *http.Request, namespace string) (bool, error) {
    ssar := &authv1.SelfSubjectAccessReview{
        Spec: authv1.SelfSubjectAccessReviewSpec{
            ResourceAttributes: &authv1.ResourceAttributes{
                Namespace: namespace,
                Verb:      httpMethodToVerb(r.Method),
                Group:     "",
                Resource:  "services",
                Name:      extractServiceName(r),
            },
        },
    }
    
    result, err := am.K8sClient.AuthorizationV1().SelfSubjectAccessReviews().Create(
        context.TODO(), ssar, metav1.CreateOptions{})
    if err != nil {
        return false, err
    }
    
    return result.Status.Allowed, nil
}
```

### Environment-Driven Configuration System

The Model Registry's configuration system demonstrates best practices for multi-environment deployment:

#### Configuration Structure

```go
// EnvConfig struct from Model Registry implementation
type EnvConfig struct {
    // Server configuration
    Port                string   `env:"BFF_PORT" envDefault:"8080"`
    StaticAssetsDir     string   `env:"STATIC_ASSETS_DIR" envDefault:"./dist"`
    AllowedOrigins      []string `env:"ALLOWED_ORIGINS" envDefault:"*"`
    
    // Deployment configuration
    DeploymentMode      string   `env:"DEPLOYMENT_MODE" envDefault:"standalone"`
    AuthMethod          string   `env:"AUTH_METHOD" envDefault:"user_token"`
    
    // Development configuration
    MockK8sClient       bool     `env:"MOCK_K8S_CLIENT" envDefault:"false"`
    MockModelRegistry   bool     `env:"MOCK_MR_CLIENT" envDefault:"false"`
    LogLevel            string   `env:"LOG_LEVEL" envDefault:"info"`
    
    // Build configuration
    ContainerTool       string   `env:"CONTAINER_TOOL" envDefault:"docker"`
    Platform            string   `env:"PLATFORM" envDefault:"linux/amd64"`
    StyleTheme          string   `env:"STYLE_THEME" envDefault:"patternfly-theme"`
}

// Configuration validation and loading
func LoadConfig() (*EnvConfig, error) {
    cfg := &EnvConfig{}
    
    if err := env.Parse(cfg); err != nil {
        return nil, fmt.Errorf("failed to parse environment config: %w", err)
    }
    
    // Validate deployment mode
    validModes := []string{"standalone", "kubeflow", "federated"}
    if !contains(validModes, cfg.DeploymentMode) {
        return nil, fmt.Errorf("invalid deployment mode: %s", cfg.DeploymentMode)
    }
    
    // Validate auth method
    validAuthMethods := []string{"internal", "user_token"}
    if !contains(validAuthMethods, cfg.AuthMethod) {
        return nil, fmt.Errorf("invalid auth method: %s", cfg.AuthMethod)
    }
    
    return cfg, nil
}
```

#### Mode-Specific Feature Enabling

```go
// Conditional route registration based on deployment mode
func registerRoutes(router *mux.Router, config *EnvConfig) {
    // Base API routes (available in all modes)
    router.HandleFunc("/healthcheck", healthCheckHandler).Methods("GET")
    
    apiRouter := router.PathPrefix("/api/v1").Subrouter()
    apiRouter.HandleFunc("/models", modelsHandler).Methods("GET", "POST")
    apiRouter.HandleFunc("/models/{id}", modelHandler).Methods("GET", "PUT", "DELETE")
    apiRouter.HandleFunc("/models/{id}/versions", versionsHandler).Methods("GET", "POST")
    
    // Mode-specific routes
    switch config.DeploymentMode {
    case "standalone":
        // Additional standalone-only endpoints
        router.HandleFunc("/namespace", namespaceHandler).Methods("GET")
        router.HandleFunc("/settings", settingsHandler).Methods("GET", "POST")
        
        // Serve frontend assets
        router.PathPrefix("/").Handler(newSPAHandler(config.StaticAssetsDir))
        
    case "kubeflow":
        // Kubeflow-specific integrations
        router.HandleFunc("/kubeflow/namespaces", kubeflowNamespacesHandler).Methods("GET")
        
        // No static file serving (handled by Kubeflow dashboard)
        
    case "federated":
        // All endpoints for federated mode
        router.HandleFunc("/namespace", namespaceHandler).Methods("GET")
        router.HandleFunc("/settings", settingsHandler).Methods("GET", "POST")
        router.HandleFunc("/federation/config", federationConfigHandler).Methods("GET")
        
        // Serve frontend assets
        router.PathPrefix("/").Handler(newSPAHandler(config.StaticAssetsDir))
    }
}
```

### Advanced Mock Development System

The Model Registry demonstrates sophisticated mocking for development without external dependencies:

#### Mock Client Architecture

```go
// Mock system that simulates real Kubernetes and Model Registry behavior
type MockSystem struct {
    k8sClient    *MockK8sClient
    mrClient     *MockModelRegistryClient
    enabled      bool
}

type MockK8sClient struct {
    namespaces     map[string]*corev1.Namespace
    permissions    map[string]bool
    serviceAccounts map[string]*corev1.ServiceAccount
}

func NewMockK8sClient() *MockK8sClient {
    return &MockK8sClient{
        namespaces: map[string]*corev1.Namespace{
            "default": createMockNamespace("default"),
            "kubeflow": createMockNamespace("kubeflow"),
            "model-registry": createMockNamespace("model-registry"),
            "user-namespace": createMockNamespace("user-namespace"),
        },
        permissions: map[string]bool{
            // Grant permissions for development
            "get:services:default":         true,
            "list:services:default":        true,
            "get:services:kubeflow":        true,
            "list:services:kubeflow":       true,
            "get:services:model-registry":  true,
            "list:services:model-registry": true,
            "get:services:user-namespace":  true,
            "list:services:user-namespace": true,
        },
    }
}

// Mock authorization that simulates real RBAC behavior
func (m *MockK8sClient) checkPermission(verb, resource, namespace, name string) bool {
    key := fmt.Sprintf("%s:%s:%s", verb, resource, namespace)
    return m.permissions[key]
}

// Mock Model Registry client with realistic data
type MockModelRegistryClient struct {
    models    []Model
    versions  map[string][]ModelVersion
    artifacts map[string][]Artifact
}

func NewMockModelRegistryClient() *MockModelRegistryClient {
    return &MockModelRegistryClient{
        models: []Model{
            {
                ID:          "fraud-detection",
                Name:        "Fraud Detection Model",
                Description: "ML model for detecting fraudulent transactions",
                Version:     "1.2.0",
                State:       "LIVE",
                Created:     time.Now().AddDate(0, -2, 0),
                Author:      "data-science-team",
                Metadata: map[string]interface{}{
                    "framework": "scikit-learn",
                    "accuracy":  0.94,
                    "precision": 0.91,
                    "recall":    0.89,
                },
            },
            {
                ID:          "recommendation-engine",
                Name:        "Product Recommendation Engine",
                Description: "Deep learning model for product recommendations",
                Version:     "2.1.0",
                State:       "LIVE",
                Created:     time.Now().AddDate(0, -1, 0),
                Author:      "ml-platform-team",
                Metadata: map[string]interface{}{
                    "framework":     "tensorflow",
                    "accuracy":      0.87,
                    "training_time": "4h 32m",
                    "model_size":    "234MB",
                },
            },
        },
    }
}

// Realistic mock responses with simulated latency
func (m *MockModelRegistryClient) ListModels(ctx context.Context) ([]Model, error) {
    // Simulate network latency
    time.Sleep(200 * time.Millisecond)
    
    return m.models, nil
}

func (m *MockModelRegistryClient) GetModel(ctx context.Context, id string) (*Model, error) {
    time.Sleep(150 * time.Millisecond)
    
    for _, model := range m.models {
        if model.ID == id {
            return &model, nil
        }
    }
    
    return nil, fmt.Errorf("model %s not found", id)
}
```

### Testing Patterns

The Model Registry demonstrates comprehensive testing approaches:

```typescript
// Frontend testing with shared utilities
import { renderWithProviders } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithTestProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return renderWithProviders(component, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

// Mock API responses for testing
const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};
```

```go
// BFF testing with mock clients
func TestModelRegistryHandler(t *testing.T) {
    // Create test server with mock clients
    server := setupTestServer(t, &TestConfig{
        MockK8sClient: true,
        MockMRClient:  true,
    })
    defer server.Close()
    
    tests := []struct {
        name           string
        method         string
        path           string
        headers        map[string]string
        expectedStatus int
    }{
        {
            name:   "List model registries",
            method: "GET",
            path:   "/api/v1/model_registry",
            headers: map[string]string{
                "kubeflow-userid": "test-user",
                "X-Namespace":     "default",
            },
            expectedStatus: http.StatusOK,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(tt.method, server.URL+tt.path, nil)
            for k, v := range tt.headers {
                req.Header.Set(k, v)
            }
            
            resp, err := http.DefaultClient.Do(req)
            require.NoError(t, err)
            assert.Equal(t, tt.expectedStatus, resp.StatusCode)
        })
    }
}
```

### Advanced Testing Strategy Implementation

The Model Registry demonstrates comprehensive testing across multiple layers, providing a blueprint for testing modular applications:

#### Multi-Layer Testing Architecture

```typescript
// Frontend testing configuration with multiple environments
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/setupIntegrationTests.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/cypress/e2e/**/*.cy.{ts,tsx}'],
      runner: '@storybook/test-runner/playwright',
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### BFF Integration Testing

```go
// Integration testing with real and mock dependencies
func TestBFFIntegration(t *testing.T) {
    testCases := []struct {
        name          string
        deploymentMode string
        authMethod    string
        mockK8s       bool
        mockMR        bool
        expectAuth    bool
        expectRoutes  []string
    }{
        {
            name:          "Standalone mode with mocks",
            deploymentMode: "standalone",
            authMethod:    "user_token",
            mockK8s:       true,
            mockMR:        true,
            expectAuth:    true,
            expectRoutes:  []string{"/api/v1/models", "/namespace", "/settings"},
        },
        {
            name:          "Kubeflow mode with partial mocks",
            deploymentMode: "kubeflow",
            authMethod:    "internal",
            mockK8s:       true,
            mockMR:        false,
            expectAuth:    true,
            expectRoutes:  []string{"/api/v1/models", "/kubeflow/namespaces"},
        },
        {
            name:          "Federated mode full integration",
            deploymentMode: "federated",
            authMethod:    "user_token",
            mockK8s:       false,
            mockMR:        false,
            expectAuth:    true,
            expectRoutes:  []string{"/api/v1/models", "/namespace", "/federation/config"},
        },
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            // Set up test environment
            config := &EnvConfig{
                DeploymentMode:    tc.deploymentMode,
                AuthMethod:        tc.authMethod,
                MockK8sClient:     tc.mockK8s,
                MockModelRegistry: tc.mockMR,
                Port:              "0", // Random available port
            }

            // Create test server
            server := createTestServer(config)
            defer server.Close()

            // Test expected routes
            for _, route := range tc.expectRoutes {
                resp, err := http.Get(server.URL + route)
                require.NoError(t, err)
                
                if tc.expectAuth && route != "/healthcheck" {
                    // Should require authentication
                    assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
                } else {
                    // Should be accessible
                    assert.NotEqual(t, http.StatusNotFound, resp.StatusCode)
                }
                resp.Body.Close()
            }
        })
    }
}

// Test middleware chain with different configurations
func TestMiddlewareChain(t *testing.T) {
    tests := []struct {
        name       string
        authMethod string
        headers    map[string]string
        expectCode int
    }{
        {
            name:       "Valid internal auth",
            authMethod: "internal",
            headers: map[string]string{
                "kubeflow-userid": "test@example.com",
                "kubeflow-groups": "kubeflow-users",
            },
            expectCode: http.StatusOK,
        },
        {
            name:       "Valid token auth",
            authMethod: "user_token",
            headers: map[string]string{
                "Authorization": "Bearer valid-test-token",
            },
            expectCode: http.StatusOK,
        },
        {
            name:       "Missing auth header",
            authMethod: "user_token",
            headers:    map[string]string{},
            expectCode: http.StatusUnauthorized,
        },
        {
            name:       "Invalid token",
            authMethod: "user_token",
            headers: map[string]string{
                "Authorization": "Bearer invalid-token",
            },
            expectCode: http.StatusUnauthorized,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            config := &EnvConfig{
                AuthMethod:        tt.authMethod,
                MockK8sClient:     true,
                MockModelRegistry: true,
            }

            handler := createTestHandler(config)
            req := httptest.NewRequest("GET", "/api/v1/models", nil)
            
            for key, value := range tt.headers {
                req.Header.Set(key, value)
            }

            w := httptest.NewRecorder()
            handler.ServeHTTP(w, req)

            assert.Equal(t, tt.expectCode, w.Code)
        })
    }
}
```

#### End-to-End Testing with Cypress

```typescript
// cypress/e2e/model-registry-flows.cy.ts
describe('Model Registry End-to-End Flows', () => {
  beforeEach(() => {
    // Set up test environment
    cy.task('resetDatabase');
    cy.task('seedTestData');
    
    // Configure application for testing
    cy.window().then((win) => {
      win.localStorage.setItem('deployment-mode', 'standalone');
      win.localStorage.setItem('auth-method', 'user_token');
      win.localStorage.setItem('theme', 'patternfly-theme');
    });
  });

  describe('Authentication Flows', () => {
    it('should authenticate with user token', () => {
      cy.visit('/');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Login with test credentials
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('testpassword');
      cy.get('[data-testid="login-button"]').click();
      
      // Should redirect to models page
      cy.url().should('include', '/models');
      cy.get('[data-testid="user-menu"]').should('contain', 'test@example.com');
    });

    it('should handle Kubeflow authentication', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('auth-method', 'internal');
      });
      
      cy.intercept('GET', '/api/v1/user', {
        statusCode: 200,
        body: {
          id: 'kubeflow-user',
          name: 'Kubeflow User',
          groups: ['kubeflow-users'],
        },
      }).as('getUserInfo');
      
      cy.visit('/');
      cy.wait('@getUserInfo');
      
      cy.get('[data-testid="user-menu"]').should('contain', 'Kubeflow User');
    });
  });

  describe('Model Management Flows', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'testpassword');
    });

    it('should list models with different themes', () => {
      // Test PatternFly theme
      cy.setTheme('patternfly-theme');
      cy.visit('/models');
      
      cy.get('[data-testid="models-table"]').should('be.visible');
      cy.get('.pf-c-table').should('exist');
      cy.get('[data-testid="model-row"]').should('have.length.at.least', 1);
      
      // Test Material-UI theme
      cy.setTheme('mui-theme');
      cy.reload();
      
      cy.get('[data-testid="models-table"]').should('be.visible');
      cy.get('.MuiTable-root').should('exist');
      cy.get('[data-testid="model-row"]').should('have.length.at.least', 1);
    });

    it('should create a new model', () => {
      cy.visit('/models');
      
      cy.get('[data-testid="create-model-button"]').click();
      
      // Fill model form
      cy.get('[data-testid="model-name-input"]').type('Test Model');
      cy.get('[data-testid="model-description-input"]').type('A test model for E2E testing');
      cy.get('[data-testid="model-framework-select"]').select('tensorflow');
      
      // Upload model file (mocked)
      cy.get('[data-testid="model-file-input"]').selectFile('cypress/fixtures/test-model.pkl');
      
      cy.get('[data-testid="submit-model-button"]').click();
      
      // Should redirect to model details
      cy.url().should('match', /\/models\/[a-zA-Z0-9-]+$/);
      cy.get('[data-testid="model-name"]').should('contain', 'Test Model');
    });

    it('should handle deployment mode switching', () => {
      // Standalone mode features
      cy.setDeploymentMode('standalone');
      cy.visit('/models');
      
      cy.get('[data-testid="namespace-selector"]').should('be.visible');
      cy.get('[data-testid="settings-menu"]').should('be.visible');
      
      // Kubeflow mode features
      cy.setDeploymentMode('kubeflow');
      cy.reload();
      
      cy.get('[data-testid="namespace-selector"]').should('not.exist');
      cy.get('[data-testid="kubeflow-integration"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'testpassword');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/v1/models', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('modelsError');
      
      cy.visit('/models');
      cy.wait('@modelsError');
      
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Test retry functionality
      cy.intercept('GET', '/api/v1/models', { fixture: 'models.json' }).as('modelsSuccess');
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@modelsSuccess');
      
      cy.get('[data-testid="models-table"]').should('be.visible');
    });

    it('should handle authorization errors', () => {
      cy.intercept('GET', '/api/v1/models', {
        statusCode: 403,
        body: { error: 'Insufficient permissions' },
      }).as('authError');
      
      cy.visit('/models');
      cy.wait('@authError');
      
      cy.get('[data-testid="permission-error"]').should('be.visible');
      cy.get('[data-testid="contact-admin-link"]').should('be.visible');
    });
  });
});

// Custom commands for E2E testing
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      setTheme(theme: string): Chainable<void>;
      setDeploymentMode(mode: string): Chainable<void>;
      setAuthMethod(method: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('setTheme', (theme: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('theme', theme);
  });
});

Cypress.Commands.add('setDeploymentMode', (mode: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('deployment-mode', mode);
  });
});

Cypress.Commands.add('setAuthMethod', (method: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth-method', method);
  });
});
```

## Module Federation Integration Pattern

**Best for**: Dynamic loading, runtime composition, and dashboard integration scenarios.

### Overview

Module Federation enables dynamic loading and integration of micro-frontends into a host application at runtime. This approach provides the benefits of modular architecture while maintaining seamless user experience.

### Architecture Components

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Host Application (Dashboard)                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │   Module Fed    │  │   Extension      │  │   Navigation    │ │
│  │   Runtime       │  │   System         │  │   System        │ │
│  │   @mf/runtime   │  │   Dynamic Plugin │  │   Dynamic Menu  │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Backend Proxy System (Fastify)                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ MF Proxy    │  │ API Proxy   │  │ Service Discovery   │ │ │
│  │  │ /_mf/*      │  │ /module/*   │  │ K8s/Local Routing   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Remote Module A │  │ Remote Module B │  │ Remote Module C │
│ (Model Registry)│  │ (Model Serving) │  │ (KServe)        │
│                 │  │                 │  │                 │
│ Port: 9000      │  │ Port: 9001      │  │ Port: 9002      │
│ remoteEntry.js  │  │ remoteEntry.js  │  │ remoteEntry.js  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Advanced Module Federation Capabilities

- **Dynamic Discovery**: Modules are automatically discovered through workspace package scanning
- **Runtime Loading**: Extensions loaded dynamically using `@module-federation/runtime`
- **Shared Dependencies**: React, PatternFly, and common libraries shared between host and remotes
- **Environment-Aware Configuration**: Different configurations for development vs. production
- **Graceful Degradation**: Host application continues functioning if modules fail to load

### Configuration Example

```json
// Remote module package.json
{
  "name": "@odh-dashboard/model-registry",
  "module-federation": {
    "name": "modelRegistry",
    "remoteEntry": "/remoteEntry.js",
    "authorize": true,
    "proxy": [
      {
        "path": "/model-registry/api",
        "pathRewrite": "/api"
      }
    ],
    "local": {
      "host": "localhost",
      "port": 9000
    },
    "service": {
      "name": "model-registry-ui-service",
      "namespace": "opendatahub",
      "port": 8080
    }
  },
  "exports": {
    "./extensions": "./src/extensions.ts"
  }
}
```

### Extension System Integration

```typescript
// Remote module extensions
import type { Extension } from '@openshift/dynamic-plugin-sdk';

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    properties: {
      id: 'modelRegistry',
      title: 'Model Registry',
      href: '/model-registry',
      section: 'models',
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/model-registry/*',
      component: () => import('./ModelRegistryWrapper'),
    },
  },
  {
    type: 'app.project-details/tab',
    properties: {
      id: 'model-registry-tab',
      title: 'Registered Models',
      component: () => import('./ProjectModelRegistryTab'),
    },
  },
];

export default extensions;
```

### Development Workflow

1. **Host Development**: Main dashboard runs on localhost:4000
2. **Remote Development**: Each module runs on its own port (e.g., 9000, 9001)
3. **Auto-Discovery**: System automatically detects running modules
4. **Proxy Configuration**: Backend proxies requests to appropriate services
5. **Hot Reload**: Both host and remotes support live reloading

### Production Deployment

In production, modules are deployed as separate Kubernetes services and discovered through ConfigMap configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: federation-config
data:
  module-federation-config.json: |
    [
      {
        "name": "modelRegistry",
        "remoteEntry": "/remoteEntry.js",
        "authorize": true,
        "service": {
          "name": "model-registry-ui-service",
          "namespace": "opendatahub",
          "port": 8080
        }
      }
    ]
```

For comprehensive details, see the [Module Federation Integration Guide](./17-module-federation-integration.md).
