# Technology Standards

To ensure consistency and leverage modern best practices, we've established comprehensive technology standards for all modules in our modular architecture. These standards are built around our **mod-arch-shared** library (`opendatahub-io/kubeflow-ui-essentials`) which provides the foundational layer for all modular applications.

## Shared Library Foundation

### mod-arch-shared Library

**Central Component**: All modular applications must integrate with our shared library

#### Core Dependencies

```bash
# Required core dependencies
npm install mod-arch-shared@latest

# Required peer dependencies
npm install @mui/material@^6.0.0 @mui/icons-material@^6.0.0 @mui/types sass@^1.83.0

# Runtime dependencies (automatically included)
# @patternfly/react-core ^6.2.0
# @patternfly/patternfly ^6.2.0
# classnames ^2.2.6
# lodash-es ^4.17.15
# react-router-dom ^7.1.5
```

#### Mandatory Provider Setup

All applications must implement the required context provider hierarchy:

```typescript
import { 
  ModularArchContextProvider, 
  ThemeProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  DeploymentMode,
  Theme
} from 'mod-arch-shared';

// Standard provider setup - REQUIRED for all applications
const App: React.FC = () => (
  <ModularArchContextProvider config={modularArchConfig}>
    <ThemeProvider theme={Theme.Patternfly}>
      <BrowserStorageContextProvider>
        <NotificationContextProvider>
          <YourApplicationContent />
        </NotificationContextProvider>
      </BrowserStorageContextProvider>
    </ThemeProvider>
  </ModularArchContextProvider>
);
```

#### Shared Library Integration Requirements

All applications **MUST** follow these integration patterns:

1. **Provider Hierarchy**: Implement the complete provider stack as shown above
2. **Configuration Interface**: Use the `ModularArchConfig` interface for all configuration
3. **Hook Usage**: Use shared hooks instead of custom implementations for common patterns
4. **Component Usage**: Prefer shared components over custom implementations
5. **API Integration**: Use shared API clients for REST and Kubernetes interactions

#### Deployment Mode Configuration

Configure deployment mode based on your application's architecture:

```typescript
import { DeploymentMode, ModularArchConfig } from 'mod-arch-shared';

// Configuration for different deployment scenarios
const modularArchConfig: ModularArchConfig = {
  // For standalone applications
  deploymentMode: DeploymentMode.Standalone,
  URL_PREFIX: '/api',
  BFF_API_VERSION: 'v1',
  
  // For module federation
  // deploymentMode: DeploymentMode.Federated,
  
  // For Kubeflow integration
  // deploymentMode: DeploymentMode.Kubeflow,
  // mandatoryNamespace: 'kubeflow-namespace'
};
```

#### Theme Integration

All applications must support theme switching through the shared library:

```typescript
import { Theme, useThemeContext } from 'mod-arch-shared';

// Theme-aware component implementation
const MyComponent: React.FC = () => {
  const { theme } = useThemeContext();
  
  const styles = {
    backgroundColor: theme === Theme.Patternfly 
      ? 'var(--pf-global--BackgroundColor--100)' 
      : '#fafafa'
  };
  
  return <div style={styles}>Theme-aware content</div>;
};
```

## Frontend Technology Stack

### React (Primary Framework)

**Why React**: Component-based architecture aligns perfectly with micro-frontend concepts and integrates seamlessly with our shared library

#### Version Standards

- **React Version**: 18.2.0+ (required by mod-arch-shared)
- **React DOM**: Matching React version (18.2.0+)
- **TypeScript**: 5.0.4+ for full type safety with shared library
- **React Router**: 6.x+ for routing (included in shared library)

#### Development Patterns

```typescript
// Preferred component pattern
import React from 'react';
import { ComponentProps } from './types';

export const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  children,
  onAction 
}) => {
  // Component implementation
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
};
```

### PatternFly (Component Library)

**Why PatternFly**: Implements Red Hat's design principles and ensures consistency

#### Key Benefits

- **Design System Compliance**: Implements Red Hat's design principles and guidelines
- **Consistency**: Ensures uniform look and feel across all micro-frontends
- **Accessibility**: Built-in accessibility compliance and best practices
- **Extensibility**: Supports theming and customization for different platforms

#### PatternFly Version Standards

- **PatternFly React**: 6.x series
- **PatternFly CSS**: Matching PatternFly React version
- **Theme System**: Use PatternFly's theming system for customizations

#### Usage Guidelines

```typescript
// Standard PatternFly import pattern
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Page,
  PageSection
} from '@patternfly/react-core';

// Custom theme extension
import { createTheme } from '@patternfly/react-core';

const customTheme = createTheme({
  // Theme customizations
});
```

#### Component Guidelines

- **Use PatternFly First**: Always check PatternFly before creating custom components
- **Extend When Necessary**: Extend PatternFly components rather than replacing them
- **Custom Components**: Follow PatternFly patterns for custom components
- **Accessibility**: Maintain PatternFly's accessibility standards

### TypeScript (Language Standard)

**Why TypeScript**: Enhanced development experience and code quality

#### Key Benefits

- **Type Safety**: Reduces runtime errors and improves developer experience
- **Documentation**: Types serve as living documentation for APIs
- **Refactoring**: Enables safer large-scale code changes
- **IDE Support**: Enhanced IDE features and developer productivity

#### Configuration Standards

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

#### Type Definition Standards

```typescript
// Interface definitions
export interface ComponentProps {
  title: string;
  description?: string;
  onAction: (id: string) => void;
  children?: React.ReactNode;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Utility types
export type Status = 'loading' | 'success' | 'error';
```

## Backend Technology Stack

### Golang (BFF Language)

**Why Golang**: Optimal for building high-performance, scalable BFF layers with excellent shared library integration

#### Key Advantages for Modular Architecture

- **Performance**: Compiled language with excellent runtime performance
- **Concurrency**: Built-in goroutines perfect for handling multiple requests
- **Kubernetes Integration**: Native Kubernetes API support and excellent client libraries
- **Microservices**: Designed for building distributed systems and microservices
- **Tooling**: Excellent development tooling and static analysis
- **Memory Efficiency**: Lower memory footprint compared to JVM-based languages

#### Shared Library Integration for Backend

```go
// Mandatory imports for all BFF implementations
import (
    "github.com/mod-arch/shared/auth"      // Authentication middleware
    "github.com/mod-arch/shared/api"       // API utilities and error handling
    "github.com/mod-arch/shared/k8s"       // Kubernetes client utilities
    "github.com/mod-arch/shared/monitoring" // Observability patterns
    "github.com/mod-arch/shared/config"    // Configuration management
)

// Standard BFF structure with shared middleware
func main() {
    r := gin.New()
    
    // Apply shared middleware stack (REQUIRED)
    r.Use(monitoring.RequestMetrics())
    r.Use(auth.ValidateToken())
    r.Use(api.ErrorHandler())
    r.Use(api.CORS())
    r.Use(api.RequestLogging())
    
    // Use shared Kubernetes client
    k8sClient := k8s.NewClientWithAuth()
    
    // Register module-specific routes
    api.RegisterModuleRoutes(r, k8sClient)
    
    r.Run(":8080")
}
```

#### Standard BFF Architecture Pattern

```go
// pkg/handlers/handler.go - Standard handler structure
package handlers

import (
    "github.com/gin-gonic/gin"
    "github.com/mod-arch/shared/api"
    "github.com/mod-arch/shared/k8s"
)

type Handler struct {
    k8sClient *k8s.Client
    config    *config.Config
}

func NewHandler(k8sClient *k8s.Client, cfg *config.Config) *Handler {
    return &Handler{
        k8sClient: k8sClient,
        config:    cfg,
    }
}

// Standard CRUD pattern with shared utilities
func (h *Handler) GetResources(c *gin.Context) {
    namespace := c.Query("namespace")
    if namespace == "" {
        api.HandleBadRequest(c, "namespace parameter required")
        return
    }
    
    resources, err := h.k8sClient.ListCustomResources(
        "v1",
        "resources",
        namespace,
    )
    if err != nil {
        api.HandleError(c, err)
        return
    }
    
    api.RespondWithData(c, resources)
}
```

#### Go Version and Dependency Standards

```go
// go.mod - Required versions and dependencies
module github.com/my-org/my-module

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/mod-arch/shared v1.0.0  // Latest shared library
    github.com/stretchr/testify v1.8.4 // Testing framework
    k8s.io/client-go v0.28.0           // Kubernetes client
    k8s.io/apimachinery v0.28.0        // Kubernetes API machinery
)
```

### Framework Selection: Gin

**Why Gin**: Lightweight, fast HTTP framework perfect for BFF implementations

#### Benefits for Modular Architecture

- **Performance**: High-performance HTTP router with minimal overhead
- **Middleware Support**: Excellent middleware ecosystem for shared patterns
- **JSON Handling**: Built-in JSON binding and validation
- **Testing**: Easy to test with httptest package
- **Community**: Large community and ecosystem

#### Standard Gin Setup with Shared Middleware

```go
// Standard Gin router configuration
func NewRouter(k8sClient *k8s.Client) *gin.Engine {
    r := gin.New()
    
    // Health check endpoint (required for all BFFs)
    r.GET("/health", api.HealthCheck())
    r.GET("/ready", api.ReadinessCheck(k8sClient))
    
    // API versioning
    v1 := r.Group("/api/v1")
    {
        // Apply authentication to all API routes
        v1.Use(auth.RequireAuth())
        
        // Register module-specific routes
        registerModuleRoutes(v1, k8sClient)
    }
    
    return r
}
}

// Service pattern
type ModelService struct {
    client kubernetes.Interface
    logger *slog.Logger
}

func (s *ModelService) ListModels(ctx context.Context) ([]Model, error) {
    // Service implementation
}
```

## Build and Development Tools

### Webpack (Build System)

**Why Webpack**: Native support for Module Federation and advanced optimization

#### Webpack Benefits

- **Module Federation Support**: Native support for micro-frontend patterns
- **Advanced Optimization**: Code splitting, tree shaking, and bundle optimization
- **Plugin Ecosystem**: Rich ecosystem of plugins for various requirements
- **Development Experience**: Hot module replacement and fast refresh

#### Webpack Configuration Standards

```javascript
// webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3001,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'moduleName',
      filename: 'remoteEntry.js',
      exposes: {
        './ModuleApp': './src/App',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        '@patternfly/react-core': { singleton: true },
      },
    }),
  ],
};
```

### Module Federation (Runtime Composition)

**Required for**: Dashboard integration and micro-frontend composition

#### Key Requirements

- **@module-federation/enhanced**: Use enhanced webpack plugin for better performance
- **Shared Dependencies**: Enforce singleton pattern for React, PatternFly, and routing
- **Extension System**: All modules must expose extensions for dashboard integration
- **Auto-Discovery**: Package.json configuration for automatic module discovery

#### Standard Configuration

```javascript
// webpack.config.js
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

const moduleFederationConfig = {
  name: 'moduleName',
  filename: 'remoteEntry.js',
  shared: {
    // Core React - REQUIRED singleton pattern
    react: { 
      singleton: true, 
      requiredVersion: '^18.0.0',
      eager: false 
    },
    'react-dom': { 
      singleton: true, 
      requiredVersion: '^18.0.0',
      eager: false 
    },
    'react-router-dom': { 
      singleton: true, 
      requiredVersion: '^6.0.0',
      eager: false 
    },
    
    // PatternFly - REQUIRED for UI consistency
    '@patternfly/react-core': { 
      singleton: true, 
      requiredVersion: '^5.0.0',
      eager: false 
    },
    
    // Dynamic Plugin SDK - REQUIRED for extensions
    '@openshift/dynamic-plugin-sdk': { 
      singleton: true, 
      requiredVersion: '*',
      eager: false 
    },
    
    // Shared Library - REQUIRED for modular architecture
    'mod-arch-shared': { 
      singleton: true, 
      requiredVersion: '*',
      eager: false 
    },
  },
  exposes: {
    // REQUIRED: All modules must expose extensions
    './extensions': './src/extensions',
  },
  runtime: false, // Important for optimization.runtimeChunk="single"
  dts: process.env.NODE_ENV === 'development', // Generate types in development
};

module.exports = {
  plugins: [new ModuleFederationPlugin(moduleFederationConfig)],
  optimization: {
    runtimeChunk: false, // REQUIRED for module federation
    splitChunks: false,   // Let module federation handle chunk splitting
  },
};
```

#### Package.json Configuration Standards

```json
{
  "name": "@odh-dashboard/module-name",
  "exports": {
    "./extensions": "./src/extensions.ts"
  },
  "module-federation": {
    "name": "moduleName",
    "remoteEntry": "/remoteEntry.js",
    "authorize": true,
    "tls": false,
    "proxy": [
      {
        "path": "/module-name/api",
        "pathRewrite": "/api"
      }
    ],
    "local": {
      "host": "localhost",
      "port": 9000
    },
    "service": {
      "name": "module-name-service",
      "namespace": "opendatahub",
      "port": 8080
    }
  }
}
```

#### Extension System Standards

```typescript
// src/extensions.ts - REQUIRED for all modules
import type { Extension } from '@openshift/dynamic-plugin-sdk';

const extensions: Extension[] = [
  // Navigation integration - REQUIRED
  {
    type: 'app.navigation/href',
    properties: {
      id: 'moduleName',
      title: 'Module Display Name',
      href: '/module-path',
      section: 'models', // or appropriate section
    },
  },
  
  // Route definition - REQUIRED
  {
    type: 'app.route',
    properties: {
      path: '/module-path/*',
      component: () => import('./ModuleWrapper'),
    },
  },
  
  // Project integration - OPTIONAL
  {
    type: 'app.project-details/tab',
    properties: {
      id: 'module-tab',
      title: 'Module Tab',
      component: () => import('./ProjectTabComponent'),
    },
  },
];

export default extensions;
```

#### Development Workflow Standards

1. **Local Development Ports**: Use ports 9000-9010 for remote modules
2. **Auto-Discovery**: Main dashboard discovers modules through workspace scanning
3. **Hot Reloading**: Both host and remote modules must support hot reload
4. **Error Handling**: Implement graceful degradation when modules fail to load

#### Key Benefits

- **Dynamic Loading**: Runtime composition of micro-frontends
- **Shared Dependencies**: Efficient dependency management across modules
- **Independent Deployment**: Maintain module independence while enabling composition
- **Version Management**: Flexible version management for shared dependencies

#### Best Practices

- **Shared Dependencies**: Share common libraries (React, PatternFly) at host level
- **Expose Patterns**: Expose complete applications rather than individual components
- **Error Boundaries**: Implement error boundaries for module loading failures
- **Fallback Strategies**: Provide fallback UI for module loading issues

## Quality and Testing Standards

### Testing Framework (Jest)

**Why Jest**: Comprehensive testing framework with excellent React integration

#### Test Categories

- **Unit Tests**: Component and function-level testing
- **Integration Tests**: API and data flow testing
- **Snapshot Tests**: UI regression testing
- **Performance Tests**: Bundle size and performance testing

#### Configuration Standards

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
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

### End-to-End Testing (Cypress)

**Why Cypress**: Comprehensive E2E testing for user journeys

#### Testing Strategies

- **User Journey Testing**: Complete workflows across modules
- **Cross-Module Integration**: Testing module interactions
- **Visual Regression**: UI consistency testing
- **Performance Testing**: Load time and interaction performance

### Code Quality Tools

#### ESLint (JavaScript/TypeScript Linting)

```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Prettier (Code Formatting)

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80
}
```

#### Go Code Quality (golangci-lint)

```yaml
# .golangci.yml
linters:
  enable:
    - gofmt
    - goimports
    - govet
    - errcheck
    - staticcheck
    - unused
    - gosimple
    - ineffassign
```

## Development Environment Standards

### Node.js and Package Management

- **Node.js Version**: 18.x LTS or later
- **Package Manager**: npm or yarn (consistent within projects)
- **Lock Files**: Always commit package-lock.json or yarn.lock

### Go Development Environment

- **Go Version**: 1.21 or later
- **Module Proxy**: Use Go module proxy for dependency management
- **Build Tools**: Use standard Go build tools

### Docker Standards

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

```dockerfile
# BFF Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

## Deployment Standards

### Kubernetes Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: module-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: module-frontend
  template:
    metadata:
      labels:
        app: module-frontend
    spec:
      containers:
      - name: frontend
        image: module-frontend:latest
        ports:
        - containerPort: 80
```

### Environment Configuration

- **Environment Variables**: Use environment variables for configuration
- **Secrets Management**: Use Kubernetes secrets for sensitive data
- **Config Maps**: Use config maps for non-sensitive configuration

## Version Management

### Semantic Versioning

All modules follow semantic versioning (SemVer):

- **MAJOR**: Breaking changes that require coordination
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and small improvements

### Dependency Management

- **Shared Library Versions**: Coordinated updates of shared dependencies
- **Independent Module Versions**: Modules version independently
- **Compatibility Matrix**: Maintain compatibility information

## Documentation Standards

### Code Documentation

- **TypeScript**: Use JSDoc comments for public APIs
- **Go**: Use Go doc conventions for public functions
- **README**: Comprehensive README for each module

### API Documentation

- **OpenAPI**: Document all BFF APIs using OpenAPI 3.0
- **Postman Collections**: Provide Postman collections for testing
- **Integration Examples**: Provide code examples for API usage

## Security Standards

### Authentication and Authorization

- **JWT Tokens**: Use JWT for authentication
- **RBAC**: Implement role-based access control
- **HTTPS**: All communications over HTTPS

### Security Scanning

- **Dependency Scanning**: Regular scanning for vulnerable dependencies
- **Container Scanning**: Security scanning of container images
- **Code Analysis**: Static code analysis for security issues

## Performance Standards

### Frontend Performance

- **Bundle Size**: Monitor and optimize bundle sizes
- **Load Times**: Target sub-3-second initial load times
- **Core Web Vitals**: Optimize for Google's Core Web Vitals

### Backend Performance

- **Response Times**: Target sub-100ms API response times
- **Throughput**: Design for high concurrent request handling
- **Resource Usage**: Optimize memory and CPU usage

## Conclusion

These technology standards provide a foundation for consistent, high-quality development across all modules in our modular architecture. By following these standards, teams can focus on building features while maintaining consistency, quality, and performance across the platform.

Regular review and updates of these standards ensure they continue to align with best practices and emerging technologies while supporting our strategic goals of modularity, reusability, and upstream-first development.

---

**Next Steps**: Review [Development Workflow](./08-development-workflow.md) to understand how these standards are applied in practice, or explore [Migration Strategy](./09-migration-strategy.md) for adopting these standards in existing projects.

## Authentication and Authorization Standards

All modules must implement standardized authentication and authorization patterns based on the Model Registry implementation.

### Required Authentication Methods

#### Dual Authentication Support

```typescript
// Mandatory authentication configuration
interface AuthConfig {
  method: 'internal' | 'user_token';
  k8sClient?: KubernetesClient;
  mockMode?: boolean;
}

// Required authentication provider setup
export const AuthProvider: React.FC<{ config: AuthConfig; children: React.ReactNode }> = ({ 
  config, 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    switch (config.method) {
      case 'internal':
        // Kubeflow integration mode - identity from headers
        initializeInternalAuth();
        break;
      case 'user_token':
        // Standalone mode - identity from tokens
        initializeTokenAuth();
        break;
    }
  }, [config.method]);

  // Standard authentication context
  return (
    <AuthContext.Provider value={{
      user,
      token,
      authMethod: config.method,
      login: handleLogin,
      logout: handleLogout,
      checkPermissions: checkUserPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Kubernetes RBAC Integration

All modules must implement Kubernetes RBAC authorization:

```go
// Standard RBAC middleware - required for all BFF implementations
func NewAuthorizationMiddleware(config AuthConfig) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            userID := getUserFromContext(r.Context())
            namespace := extractNamespaceFromRequest(r)
            
            var hasPermission bool
            var err error
            
            if config.MockMode {
                hasPermission = true // Development mode
            } else {
                switch config.Method {
                case "internal":
                    hasPermission, err = checkSubjectAccessReview(config.K8sClient, userID, namespace, r)
                case "user_token":
                    hasPermission, err = checkSelfSubjectAccessReview(config.K8sClient, r, namespace)
                }
            }
            
            if err != nil {
                http.Error(w, "Authorization check failed", http.StatusInternalServerError)
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

// Required permission check implementations
func checkSubjectAccessReview(client kubernetes.Interface, userID, namespace string, r *http.Request) (bool, error) {
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
    
    result, err := client.AuthorizationV1().SubjectAccessReviews().Create(
        context.TODO(), sar, metav1.CreateOptions{})
    if err != nil {
        return false, err
    }
    
    return result.Status.Allowed, nil
}

func checkSelfSubjectAccessReview(client kubernetes.Interface, r *http.Request, namespace string) (bool, error) {
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
    
    result, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(
        context.TODO(), ssar, metav1.CreateOptions{})
    if err != nil {
        return false, err
    }
    
    return result.Status.Allowed, nil
}
```

## Deployment Mode Standards

All modules must support multiple deployment modes with standardized configuration.

### Required Deployment Modes

#### Mode Configuration Structure

```typescript
// Mandatory deployment mode support
type DeploymentMode = 'standalone' | 'kubeflow' | 'federated';

interface DeploymentConfig {
  mode: DeploymentMode;
  styleTheme: 'patternfly-theme' | 'mui-theme';
  authMethod: 'internal' | 'user_token';
  staticAssetsDir?: string;
  allowedOrigins?: string[];
}

// Environment-based configuration loading - REQUIRED
export const loadDeploymentConfig = (): DeploymentConfig => {
  return {
    mode: (process.env.DEPLOYMENT_MODE as DeploymentMode) || 'standalone',
    styleTheme: (process.env.STYLE_THEME as any) || 'patternfly-theme',
    authMethod: (process.env.AUTH_METHOD as any) || 'user_token',
    staticAssetsDir: process.env.STATIC_ASSETS_DIR || './dist',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  };
};
```

#### Mode-Specific Feature Implementation

```go
// Required deployment mode handling in BFF
func registerModeSpecificRoutes(router *mux.Router, config DeploymentConfig) {
    // Base routes available in all modes
    router.HandleFunc("/healthcheck", healthCheckHandler).Methods("GET")
    
    apiRouter := router.PathPrefix("/api/v1").Subrouter()
    registerCoreAPIRoutes(apiRouter)
    
    // Mode-specific route registration
    switch config.Mode {
    case "standalone":
        // Standalone-only endpoints
        router.HandleFunc("/namespace", namespaceHandler).Methods("GET")
        router.HandleFunc("/settings", settingsHandler).Methods("GET", "POST")
        
        // Static file serving
        router.PathPrefix("/").Handler(newSPAHandler(config.StaticAssetsDir))
        
    case "kubeflow":
        // Kubeflow integration endpoints
        router.HandleFunc("/kubeflow/namespaces", kubeflowNamespacesHandler).Methods("GET")
        
        // No static file serving (handled by Kubeflow dashboard)
        
    case "federated":
        // All endpoints for federated mode
        router.HandleFunc("/namespace", namespaceHandler).Methods("GET")
        router.HandleFunc("/settings", settingsHandler).Methods("GET", "POST")
        router.HandleFunc("/federation/config", federationConfigHandler).Methods("GET")
        
        // Static file serving
        router.PathPrefix("/").Handler(newSPAHandler(config.StaticAssetsDir))
    }
}
```

#### Frontend Mode Adaptation

```typescript
// Required frontend adaptation to deployment modes
export const AppModeAdapter: React.FC<{ mode: DeploymentMode; children: React.ReactNode }> = ({ 
  mode, 
  children 
}) => {
  const [features, setFeatures] = useState<FeatureFlags>({});
  
  useEffect(() => {
    const modeFeatures = getModeFeatures(mode);
    setFeatures(modeFeatures);
  }, [mode]);
  
  return (
    <FeatureFlagsProvider features={features}>
      <ModeContextProvider mode={mode}>
        {children}
      </ModeContextProvider>
    </FeatureFlagsProvider>
  );
};

// Mode-specific feature flags
const getModeFeatures = (mode: DeploymentMode): FeatureFlags => {
  switch (mode) {
    case 'standalone':
      return {
        namespaceSelector: true,
        settingsManagement: true,
        userManagement: true,
        kubeflowIntegration: false,
        federationConfig: false,
      };
    case 'kubeflow':
      return {
        namespaceSelector: false,
        settingsManagement: false,
        userManagement: false,
        kubeflowIntegration: true,
        federationConfig: false,
      };
    case 'federated':
      return {
        namespaceSelector: true,
        settingsManagement: true,
        userManagement: true,
        kubeflowIntegration: true,
        federationConfig: true,
      };
    default:
      return {};
  }
};
```

## Mock Development Standards

All modules must support comprehensive mock development for offline capability.

### Required Mock Implementation

#### Mock Client Architecture

```go
// Standard mock system structure - REQUIRED
type MockConfig struct {
    K8sClient    bool  `env:"MOCK_K8S_CLIENT" envDefault:"false"`
    APIClient    bool  `env:"MOCK_API_CLIENT" envDefault:"false"`
    EnabledInProd bool  `env:"ENABLE_MOCKS_IN_PROD" envDefault:"false"`
}

type MockSystem struct {
    k8sClient   kubernetes.Interface
    apiClient   APIClient
    enabled     bool
}

// Required mock client factory
func NewMockSystem(config MockConfig) *MockSystem {
    system := &MockSystem{
        enabled: config.K8sClient || config.APIClient,
    }
    
    if config.K8sClient {
        system.k8sClient = NewMockK8sClient()
    }
    
    if config.APIClient {
        system.apiClient = NewMockAPIClient()
    }
    
    return system
}

// Standard mock K8s client - implement this interface
type MockK8sClient struct {
    namespaces     map[string]*corev1.Namespace
    permissions    map[string]bool
    serviceAccounts map[string]*corev1.ServiceAccount
    services       map[string]*corev1.Service
}

// Required mock namespaces for development
func NewMockK8sClient() *MockK8sClient {
    return &MockK8sClient{
        namespaces: map[string]*corev1.Namespace{
            "default":        createMockNamespace("default"),
            "kubeflow":       createMockNamespace("kubeflow"),
            "user-workspace": createMockNamespace("user-workspace"),
            "model-registry": createMockNamespace("model-registry"),
        },
        permissions: map[string]bool{
            // Grant broad permissions for development
            "get:services:default":        true,
            "list:services:default":       true,
            "get:services:kubeflow":       true,
            "list:services:kubeflow":      true,
            "get:services:user-workspace": true,
            "list:services:user-workspace": true,
            "get:services:model-registry": true,
            "list:services:model-registry": true,
        },
    }
}
```

#### Frontend Mock Integration

```typescript
// Required frontend mock client factory
export const createAPIClient = (config: { useMocks: boolean; baseURL: string }): APIClient => {
  if (config.useMocks) {
    console.log('Using mock API client for development');
    return new MockAPIClient();
  }
  
  return new ProductionAPIClient({
    baseURL: config.baseURL,
  });
};

// Standard mock API client structure
class MockAPIClient implements APIClient {
  private mockData: MockDataStore;
  
  constructor() {
    this.mockData = createRealisticMockData();
  }
  
  // Implement all API methods with realistic delays
  async get<T>(endpoint: string): Promise<T> {
    await simulateNetworkDelay();
    return this.mockData.get(endpoint);
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    await simulateNetworkDelay(800); // Longer delay for mutations
    return this.mockData.create(endpoint, data);
  }
  
  // ... implement all API methods
}

// Required mock data structure
const createRealisticMockData = (): MockDataStore => {
  return {
    models: [
      {
        id: 'fraud-detection-v1',
        name: 'Fraud Detection Model',
        version: '1.2.0',
        description: 'ML model for detecting fraudulent transactions',
        state: 'LIVE',
        created: new Date().toISOString(),
        author: 'data-science-team',
        metadata: {
          framework: 'scikit-learn',
          accuracy: 0.94,
          precision: 0.91,
          recall: 0.89,
        },
      },
      // ... more realistic mock data
    ],
  };
};
```
