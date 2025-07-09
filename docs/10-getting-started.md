# Getting Started

This guide provides practical steps for teams looking to adopt modular architecture, whether you're starting new projects or migrating existing applications.

## Quick Assessment

Before diving into implementation, assess your current situation to choose the best approach:

### For New Projects

**You should start here if:**
- Building a new feature or application from scratch
- Have no existing codebase constraints
- Want to adopt upstream-first development practices
- Team is comfortable with modern development practices

**Recommended Path:** [Standalone Micro-Frontend Approach](#new-project-setup)

### For Existing Projects

**You should start here if:**
- Have an existing monolithic application
- Need to maintain business continuity during migration
- Want to gradually adopt modular patterns
- Have existing development processes to consider

**Recommended Path:** [Migration from Existing Application](#existing-project-migration)

## New Project Setup

### Prerequisites

Before starting, ensure you have the following tools installed:

```bash
# Node.js (18.x LTS or later)
node --version

# Go (1.21 or later)
go version

# Docker (for containerization)
docker --version

# kubectl (for Kubernetes deployment)
kubectl version --client

# Git (for version control)
git --version
```

### Step 1: Repository Setup

Create a new repository with mod-arch-shared integration:

```bash
# Create new module using shared library template
npx @mod-arch/create-module --name=my-new-module --type=standalone

# Navigate to the new module
cd my-new-module

# Initialize git repository
git init
git add .
git commit -m "Initial module setup with mod-arch-shared"
```

### Step 2: Configure Development Environment

#### Frontend Setup with Shared Library

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (mod-arch-shared already included)
npm install

# Verify shared library installation
npm list @mod-arch/shared

# Start development server with shared library hot reload
npm run dev:shared
```

#### Backend Setup with Shared Utilities

```bash
# Navigate to backend directory
cd backend

# Initialize Go module
go mod init github.com/my-org/my-new-module

# Add shared backend utilities
go get github.com/mod-arch/shared/auth
go get github.com/mod-arch/shared/api
go get github.com/mod-arch/shared/k8s

# Run BFF with shared middleware
go run ./cmd/main.go
```

### Step 3: Implement Core Features with Shared Library

#### Frontend Development with Shared Providers

Create your main application component using shared providers:

```typescript
// src/App.tsx
import React from 'react';
import {
  AppContextProvider,
  ThemeProvider,
  UserProvider,
  NotificationProvider,
  AppLayout
} from '@mod-arch/shared';

const MyModuleApp: React.FC = () => {
  return (
    <AppContextProvider config={moduleConfig}>
      <ThemeProvider>
        <UserProvider>
          <NotificationProvider>
            <AppLayout>
              <h1>My New Module</h1>
              {/* Your module content using shared components */}
            </AppLayout>
          </NotificationProvider>
        </UserProvider>
      </ThemeProvider>
    </AppContextProvider>
  );
};

export default MyModuleApp;
```

#### Using Shared Components and Hooks

```typescript
// src/components/DataTable.tsx
import React from 'react';
import {
  Table,
  Button,
  useApi,
  useNotifications,
  LoadingSpinner
} from '@mod-

interface DataTableProps {
  endpoint: string;
}

const DataTable: React.FC<DataTableProps> = ({ endpoint }) => {
  const { data, loading, error, refetch } = useApi(endpoint);
  const { showSuccess, showError } = useNotifications();

  const handleRefresh = async () => {
    try {
      await refetch();
      showSuccess('Data refreshed successfully');
    } catch (error) {
      showError('Failed to refresh data');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <Button onClick={handleRefresh}>Refresh</Button>
      <Table
        data={data}
        columns={[
          { key: 'name', title: 'Name' },
          { key: 'status', title: 'Status' },
          { key: 'created', title: 'Created' }
        ]}
      />
    </div>
  );
};

export default DataTable;
```

#### BFF Development with Shared Middleware

Implement your BFF API endpoints using shared utilities:

```go
// cmd/main.go
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
    
    // Initialize Kubernetes client with shared config
    k8sClient := k8s.NewClientWithAuth()
    
    // Register API routes
    api.RegisterRoutes(r, k8sClient)
    
    r.Run(":8080")
}

// pkg/handlers/data.go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/mod-arch/shared/api"
    "github.com/mod-arch/shared/k8s"
)

func GetData(k8sClient *k8s.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Use shared K8s client for data retrieval
        data, err := k8sClient.ListResources("v1", "configmaps", c.Query("namespace"))
        if err != nil {
            api.HandleError(c, err)
            return
        }
        
        // Use shared response format
        api.RespondWithData(c, data)
    }
}
```

type Handler struct {
    logger logging.Logger
}

func (h *Handler) GetResources(w http.ResponseWriter, r *http.Request) {
    user, err := auth.GetUserFromRequest(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    h.logger.Info("Fetching resources for user", "user", user.Name)
    
    // Your business logic here
    resources := []Resource{
        {ID: "1", Name: "Resource 1"},
        {ID: "2", Name: "Resource 2"},
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resources)
}
```

### Step 4: Testing with Shared Library Utilities

#### Frontend Testing

```typescript
// src/components/__tests__/DataTable.test.tsx
import React from 'react';
import { renderWithProviders, mockApiClient } from '@mod-arch/shared/testing';
import { DataTable } from '../DataTable';

describe('DataTable Component', () => {
  beforeEach(() => {
    mockApiClient.reset();
  });

  it('should render data table with shared providers', () => {
    const mockData = [
      { name: 'Item 1', status: 'Active', created: '2024-01-01' }
    ];
    
    mockApiClient.get('/api/data').mockResolvedValue({ data: mockData });
    
    const { getByText } = renderWithProviders(
      <DataTable endpoint="/api/data" />,
      {
        initialAppState: { theme: 'light' },
        user: { name: 'Test User', roles: ['viewer'] }
      }
    );
    
    expect(getByText('Item 1')).toBeInTheDocument();
  });

  it('should handle errors with shared error boundary', () => {
    mockApiClient.get('/api/data').mockRejectedValue(new Error('API Error'));
    
    const { getByText } = renderWithProviders(<DataTable endpoint="/api/data" />);
    
    expect(getByText('Error: API Error')).toBeInTheDocument();
  });
});
```

#### Backend Testing

```go
// pkg/handlers/data_test.go
package handlers

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/mod-arch/shared/testing"
    "github.com/stretchr/testify/assert"
)

func TestGetData(t *testing.T) {
    // Use shared testing utilities
    mockK8sClient := testing.NewMockK8sClient()
    mockK8sClient.
        On("ListResources", "v1", "configmaps", "default").
        Return([]interface{}{{"name": "test-config"}}, nil)
    
    r := gin.New()
    r.GET("/api/data", GetData(mockK8sClient))
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/api/data?namespace=default", nil)
    r.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "test-config")
}
```

#### Integration Testing

```bash
# Run all tests with shared library
npm run test:all

# Run integration tests
npm run test:integration

# Run E2E tests with shared utilities
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Step 5: Deployment Configuration

Create Kubernetes manifests:

```yaml
# manifests/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-new-module
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-new-module
  template:
    metadata:
      labels:
        app: my-new-module
    spec:
      containers:
      - name: frontend
        image: my-new-module-frontend:latest
        ports:
        - containerPort: 80
      - name: bff
        image: my-new-module-bff:latest
        ports:
        - containerPort: 8080
```

## Existing Project Migration

### Step 1: Assessment

Analyze your current application:

```bash
# Clone our assessment tools
git clone https://github.com/kubeflow/migration-tools
cd migration-tools

# Run application analysis
./analyze-app.sh --source=/path/to/your/app

# Generate migration report
./generate-report.sh
```

### Step 2: Pilot Feature Selection

Choose a pilot feature based on these criteria:

**Good Pilot Candidates:**
- Clear business domain boundaries
- Minimal dependencies on other features
- Well-defined API surface
- Manageable complexity
- Willing team ownership

**Example Assessment:**
```bash
# Analyze feature boundaries
./analyze-features.sh --feature=model-registry

# Check dependencies
./check-dependencies.sh --feature=model-registry

# Generate pilot report
./pilot-assessment.sh --feature=model-registry
```

### Step 3: API Contract Definition

Define the API contract for your pilot feature:

```yaml
# api-contract.yaml
openapi: 3.0.0
info:
  title: Model Registry API
  version: 1.0.0
paths:
  /api/v1/models:
    get:
      summary: List models
      responses:
        '200':
          description: List of models
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Model'
components:
  schemas:
    Model:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        version:
          type: string
```

### Step 4: Extract and Refactor

#### Create Module Structure

```bash
# Create new module repository
mkdir model-registry-module
cd model-registry-module

# Set up standard structure
mkdir -p frontend/src backend/cmd/bff manifests docs

# Initialize frontend
cd frontend
npm init -y
npm install react react-dom @patternfly/react-core
npm install @kubeflow/ui-essentials

# Initialize backend
cd ../backend
go mod init github.com/kubeflow/model-registry
```

#### Migrate Frontend Components

```typescript
// Extract components from existing app
// frontend/src/components/ModelList.tsx
import React from 'react';
import { DataList, DataListItem } from '@patternfly/react-core';
import { useModels } from '../hooks/useModels';

export const ModelList: React.FC = () => {
  const { models, loading } = useModels();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <DataList>
      {models.map(model => (
        <DataListItem key={model.id}>
          {model.name} - {model.version}
        </DataListItem>
      ))}
    </DataList>
  );
};
```

#### Implement BFF

```go
// backend/cmd/bff/main.go
package main

import (
    "log"
    "net/http"
    
    "github.com/gorilla/mux"
    "github.com/kubeflow/model-registry/internal/handlers"
)

func main() {
    r := mux.NewRouter()
    h := handlers.New()
    
    // API routes
    api := r.PathPrefix("/api/v1").Subrouter()
    api.HandleFunc("/models", h.GetModels).Methods("GET")
    
    log.Println("Starting BFF on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

### Step 5: Integration Testing

Test the extracted module:

```bash
# Test standalone functionality
cd frontend && npm start
cd backend && go run ./cmd/bff

# Test integration with existing app
./test-integration.sh --module=model-registry
```

### Step 6: Gradual Rollout

Implement feature flags for gradual rollout:

```typescript
// In existing application
import { useFeatureFlag } from './hooks/useFeatureFlag';
import { ModelRegistryModule } from './modules/ModelRegistryModule';
import { LegacyModelRegistry } from './components/LegacyModelRegistry';

const ModelRegistryPage: React.FC = () => {
  const useNewModule = useFeatureFlag('new-model-registry');
  
  return useNewModule ? (
    <ModelRegistryModule />
  ) : (
    <LegacyModelRegistry />
  );
};
```

## Development with Feature Flags

### Overview

Developing with feature flags allows you to work on new features without affecting production builds. This approach enables:

- Safe development of experimental features
- A/B testing capabilities
- Gradual rollout of new functionality
- Quick rollback mechanisms

### Setting Up Feature Flags

#### Frontend Configuration

```typescript
// src/config/features.ts
export interface FeatureFlags {
  enableNewModelRegistry: boolean;
  enableRAGWorkflows: boolean;
  enableAdvancedMetrics: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    enableNewModelRegistry: process.env.REACT_APP_ENABLE_MODEL_REGISTRY === 'true',
    enableRAGWorkflows: process.env.REACT_APP_ENABLE_RAG === 'true',
    enableAdvancedMetrics: process.env.REACT_APP_ENABLE_METRICS === 'true',
  };
};
```

#### Using Feature Flags in Components

```typescript
// src/components/FeatureGate.tsx
import React from 'react';
import { getFeatureFlags } from '../config/features';

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback = null 
}) => {
  const flags = getFeatureFlags();
  
  if (flags[feature]) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// Usage in your components
export const ModelRegistryPage: React.FC = () => {
  return (
    <Page>
      <FeatureGate feature="enableNewModelRegistry">
        <NewModelRegistryComponent />
      </FeatureGate>
    </Page>
  );
};
```

### Development Environment Setup

#### Environment Variables

Create environment-specific configuration:

```bash
# .env.development
REACT_APP_ENABLE_MODEL_REGISTRY=true
REACT_APP_ENABLE_RAG=true
REACT_APP_ENABLE_METRICS=false

# .env.production
REACT_APP_ENABLE_MODEL_REGISTRY=false
REACT_APP_ENABLE_RAG=false
REACT_APP_ENABLE_METRICS=false
```

#### BFF Feature Flag Support

```go
// pkg/features/flags.go
package features

import (
    "os"
    "strconv"
)

type FeatureFlags struct {
    EnableNewModelRegistry bool
    EnableRAGWorkflows     bool
    EnableAdvancedMetrics  bool
}

func GetFeatureFlags() FeatureFlags {
    return FeatureFlags{
        EnableNewModelRegistry: getBoolEnv("ENABLE_MODEL_REGISTRY", false),
        EnableRAGWorkflows:     getBoolEnv("ENABLE_RAG", false),
        EnableAdvancedMetrics:  getBoolEnv("ENABLE_METRICS", false),
    }
}

func getBoolEnv(key string, defaultValue bool) bool {
    if value := os.Getenv(key); value != "" {
        if parsed, err := strconv.ParseBool(value); err == nil {
            return parsed
        }
    }
    return defaultValue
}
```

### Production Enablement

#### Gradual Rollout Strategy

1. **Development Testing**: Enable feature flags in development environment
2. **Staging Validation**: Test in staging with production-like data
3. **Canary Deployment**: Enable for small percentage of users
4. **Full Rollout**: Enable for all users after validation

#### Deployment Configuration

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-module
spec:
  template:
    spec:
      containers:
      - name: frontend
        env:
        - name: REACT_APP_ENABLE_MODEL_REGISTRY
          value: "{{ .Values.features.modelRegistry.enabled }}"
      - name: bff
        env:
        - name: ENABLE_MODEL_REGISTRY
          value: "{{ .Values.features.modelRegistry.enabled }}"
```

```yaml
# helm/values.yaml
features:
  modelRegistry:
    enabled: false  # Set to true when ready for production
  ragWorkflows:
    enabled: false
  advancedMetrics:
    enabled: false
```

### Testing with Feature Flags

#### Feature Flag Testing

```typescript
// src/components/__tests__/FeatureGate.test.tsx
import { render } from '@testing-library/react';
import { FeatureGate } from '../FeatureGate';

// Mock feature flags for testing
jest.mock('../config/features', () => ({
  getFeatureFlags: () => ({
    enableNewModelRegistry: true,
    enableRAGWorkflows: false,
    enableAdvancedMetrics: false,
  }),
}));

describe('FeatureGate', () => {
  it('renders children when feature is enabled', () => {
    const { getByText } = render(
      <FeatureGate feature="enableNewModelRegistry">
        <div>Feature Content</div>
      </FeatureGate>
    );
    
    expect(getByText('Feature Content')).toBeInTheDocument();
  });
  
  it('renders fallback when feature is disabled', () => {
    const { getByText } = render(
      <FeatureGate 
        feature="enableRAGWorkflows" 
        fallback={<div>Coming Soon</div>}
      >
        <div>Feature Content</div>
      </FeatureGate>
    );
    
    expect(getByText('Coming Soon')).toBeInTheDocument();
  });
});
```

## Development Workflow

### Daily Development

```bash
# Start development environment
npm run dev          # Starts frontend with hot reload
go run ./cmd/bff     # Starts BFF in mock mode

# Run tests during development
npm run test:watch   # Frontend tests with watch mode
go test ./... -watch # Backend tests with watch mode
```

### Testing Strategy

#### Unit Tests

```javascript
// frontend/src/components/__tests__/ModelList.test.tsx
import { render, screen } from '@testing-library/react';
import { ModelList } from '../ModelList';

test('renders model list', () => {
  render(<ModelList />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

```go
// backend/internal/handlers/api_test.go
func TestGetModels(t *testing.T) {
    req := httptest.NewRequest("GET", "/api/v1/models", nil)
    w := httptest.NewRecorder()
    
    handler := &Handler{}
    handler.GetModels(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
}
```

#### Integration Tests

```bash
# Run integration test suite
npm run test:integration

# Test specific scenarios
npm run test:e2e -- --spec="model-registry"
```

### Deployment

#### Local Development

```bash
# Build and run locally
docker-compose up --build
```

#### Staging Deployment

```bash
# Deploy to staging
kubectl apply -f manifests/ -n staging

# Run smoke tests
npm run test:smoke -- --env=staging
```

#### Production Deployment

```bash
# Deploy to production
helm upgrade --install model-registry ./charts/model-registry \
  --values production-values.yaml
```

## Common Patterns and Best Practices

### Error Handling

```typescript
// Frontend error handling
import { useNotifications } from '@kubeflow/ui-essentials';

const { addNotification } = useNotifications();

try {
  await apiCall();
} catch (error) {
  addNotification({
    type: 'error',
    title: 'Operation Failed',
    description: error.message
  });
}
```

```go
// Backend error handling
func (h *Handler) handleError(w http.ResponseWriter, err error, statusCode int) {
    h.logger.Error("Request failed", "error", err)
    
    response := ErrorResponse{
        Error: err.Error(),
        Code:  statusCode,
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(response)
}
```

### State Management

```typescript
// Use shared context patterns
import { createContext, useContext } from 'react';

const ModelContext = createContext();

export const useModels = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModels must be used within ModelProvider');
  }
  return context;
};
```

### API Integration

```typescript
// Standardized API client
import { ApiClient } from '@kubeflow/ui-essentials';

const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_BFF_URL,
  timeout: 10000
});

export const modelsApi = {
  list: () => apiClient.get('/api/v1/models'),
  get: (id: string) => apiClient.get(`/api/v1/models/${id}`),
  create: (data: CreateModelRequest) => apiClient.post('/api/v1/models', data)
};
```

## Troubleshooting

### Common Issues

#### Module Federation Errors

```bash
# Check module federation configuration
npm run analyze:bundle

# Debug module loading
console.log('Available modules:', window.__webpack_share_scopes__);
```

#### Authentication Issues

```bash
# Check authentication headers
curl -H "kubeflow-user: test@example.com" \
     http://localhost:8080/api/v1/models
```

#### Build Issues

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### Getting Help

- **Documentation**: Review the comprehensive documentation in this repository
- **Community**: Join Kubeflow Slack workspace (#ui-team channel)
- **Issues**: Report issues in the relevant GitHub repositories
- **Support**: Contact the platform team for architecture guidance

## Next Steps

1. **Complete Setup**: Follow the setup steps for your chosen approach
2. **Review Patterns**: Study the [Core Patterns](./04-core-patterns.md) for implementation guidance
3. **Understand Workflow**: Familiarize yourself with the [Development Workflow](./08-development-workflow.md)
4. **Join Community**: Participate in community meetings and discussions
5. **Contribute**: Start contributing to shared libraries and upstream projects

---

**Success!** You're now ready to start building with modular architecture. For questions or support, engage with the platform team and community through our established channels.

## Model Registry UI Example

The Model Registry UI provides an excellent real-world example of modular architecture implementation. Here's how to set up a similar project structure:

```bash
# Create Model Registry-style module
npx @mod-arch/create-module --name=my-model-registry --template=model-registry

# Navigate to the module
cd my-model-registry

# The template includes:
# - React frontend with TypeScript
# - Go BFF with comprehensive middleware
# - Multi-deployment mode support
# - Theme switching capabilities
# - Kubernetes integration patterns
```

### Frontend Structure Based on Model Registry

```typescript
// src/App.tsx - Main application with deployment mode support
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  AppContextProvider,
  ThemeProvider,
  UserProvider,
  NotificationProvider
} from '@mod-arch/shared';

interface AppConfig {
  deploymentMode: 'standalone' | 'kubeflow' | 'federated';
  styleTheme: 'patternfly-theme' | 'mui-theme';
  authMethod: 'internal' | 'user_token';
}

const MyModelRegistryApp: React.FC = () => {
  const config: AppConfig = {
    deploymentMode: process.env.REACT_APP_DEPLOYMENT_MODE as any || 'standalone',
    styleTheme: process.env.REACT_APP_STYLE_THEME as any || 'patternfly-theme',
    authMethod: process.env.REACT_APP_AUTH_METHOD as any || 'user_token'
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider config={config}>
        <ThemeProvider theme={config.styleTheme}>
          <UserProvider authMethod={config.authMethod}>
            <NotificationProvider>
              <BrowserRouter>
                <MyModelRegistryRoutes />
              </BrowserRouter>
            </NotificationProvider>
          </UserProvider>
        </ThemeProvider>
      </AppContextProvider>
    </QueryClientProvider>
  );
};

export default MyModelRegistryApp;
```

### BFF Implementation Based on Model Registry

```go
// cmd/main.go - BFF server with Model Registry patterns
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/gorilla/mux"
    "github.com/mod-arch/shared/auth"
    "github.com/mod-arch/shared/api"
    "github.com/mod-arch/shared/k8s"
    "github.com/mod-arch/shared/monitoring"
)

type Config struct {
    Port           string
    DeploymentMode string
    AuthMethod     string
    StaticDir      string
    AllowedOrigins []string
}

func main() {
    config := loadConfig()
    
    router := mux.NewRouter()
    
    // Apply comprehensive middleware stack (Model Registry pattern)
    router.Use(middleware.Recovery())
    router.Use(middleware.Telemetry())
    router.Use(middleware.CORS(config.AllowedOrigins))
    
    // Health check endpoint (no auth required)
    router.HandleFunc("/healthcheck", healthCheckHandler).Methods("GET")
    
    // API routes with full middleware chain
    apiRouter := router.PathPrefix("/api/v1").Subrouter()
    apiRouter.Use(middleware.IdentityInjection(config.AuthMethod))
    apiRouter.Use(middleware.NamespaceAttachment())
    apiRouter.Use(middleware.Authorization())
    apiRouter.Use(middleware.RESTClientAttachment())
    
    // Register module-specific API routes
    registerAPIRoutes(apiRouter)
    
    // Conditional endpoint registration based on deployment mode
    if config.DeploymentMode == "standalone" {
        // Additional endpoints for standalone mode
        router.HandleFunc("/namespace", namespaceHandler).Methods("GET")
        router.HandleFunc("/settings", settingsHandler).Methods("GET", "POST")
    }
    
    // Static file serving with SPA support (Model Registry pattern)
    router.PathPrefix("/").Handler(newSPAHandler(config.StaticDir))
    
    // Start server with graceful shutdown
    server := &http.Server{
        Addr:         ":" + config.Port,
        Handler:      router,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    startServerWithGracefulShutdown(server)
}

func loadConfig() *Config {
    return &Config{
        Port:           getEnv("PORT", "8080"),
        DeploymentMode: getEnv("DEPLOYMENT_MODE", "standalone"),
        AuthMethod:     getEnv("AUTH_METHOD", "user_token"),
        StaticDir:      getEnv("STATIC_ASSETS_DIR", "/app/dist"),
        AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "*"), ","),
    }
}

// SPA handler implementation (from Model Registry)
type spaHandler struct {
    staticDir string
    indexPath string
}

func newSPAHandler(staticDir string) http.Handler {
    return &spaHandler{
        staticDir: staticDir,
        indexPath: filepath.Join(staticDir, "index.html"),
    }
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    path := filepath.Join(h.staticDir, r.URL.Path)
    
    if _, err := os.Stat(path); os.IsNotExist(err) {
        // Serve index.html for SPA routing
        http.ServeFile(w, r, h.indexPath)
        return
    }
    
    // Serve static file
    http.FileServer(http.Dir(h.staticDir)).ServeHTTP(w, r)
}
```

### Deployment Configuration Examples

```yaml
# Standalone deployment (Model Registry pattern)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-model-registry-standalone
  namespace: kubeflow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-model-registry
  template:
    metadata:
      labels:
        app: my-model-registry
    spec:
      serviceAccountName: my-model-registry
      containers:
      - name: ui
        image: my-model-registry:latest
        ports:
        - containerPort: 8080
        env:
        - name: DEPLOYMENT_MODE
          value: "standalone"
        - name: STYLE_THEME
          value: "patternfly-theme"
        - name: AUTH_METHOD
          value: "user_token"
        - name: PORT
          value: "8080"
        - name: STATIC_ASSETS_DIR
          value: "/app/dist"
        livenessProbe:
          httpGet:
            path: /healthcheck
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthcheck
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: my-model-registry
  namespace: kubeflow
spec:
  selector:
    app: my-model-registry
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
# Kubeflow integration deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-model-registry-kubeflow
  namespace: kubeflow
spec:
  template:
    spec:
      containers:
      - name: ui
        image: my-model-registry:kubeflow
        ports:
        - containerPort: 8080
        env:
        - name: DEPLOYMENT_MODE
          value: "kubeflow"
        - name: AUTH_METHOD
          value: "internal"
        - name: STYLE_THEME
          value: "patternfly-theme"
        volumeMounts:
        - name: kubeflow-config
          mountPath: /etc/kubeflow
          readOnly: true
      volumes:
      - name: kubeflow-config
        configMap:
          name: kubeflow-config
---
# Kubeflow-specific ingress configuration
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-model-registry-vs
  namespace: kubeflow
spec:
  gateways:
  - kubeflow-gateway
  hosts:
  - '*'
  http:
  - match:
    - uri:
        prefix: /model-registry
    rewrite:
      uri: /
    route:
    - destination:
        host: my-model-registry.kubeflow.svc.cluster.local
        port:
          number: 80
```

This Model Registry-based approach demonstrates real-world patterns for:

- **Multi-mode deployment** with environment-specific configuration
- **Sophisticated authentication** using Kubernetes RBAC integration  
- **Mock development** with offline capability
- **Advanced testing** with E2E and integration test suites
- **Theme switching** for different UI frameworks
- **BFF architecture** with comprehensive middleware chains

For a complete analysis of these patterns, see the [Model Registry Case Study](./16-model-registry-case-study.md).

### Module Federation Integration (Optional)

If your module needs to integrate with the main dashboard through module federation, follow these additional setup steps:

#### 1. Configure Module Federation in Package.json

```json
{
  "name": "@odh-dashboard/my-new-module",
  "exports": {
    "./extensions": "./src/extensions.ts"
  },
  "module-federation": {
    "name": "myNewModule",
    "remoteEntry": "/remoteEntry.js",
    "authorize": true,
    "proxy": [
      {
        "path": "/my-module/api",
        "pathRewrite": "/api"
      }
    ],
    "local": {
      "host": "localhost",
      "port": 9004
    },
    "service": {
      "name": "my-module-service",
      "namespace": "opendatahub",
      "port": 8080
    }
  }
}
```

#### 2. Create Extensions File

```typescript
// src/extensions.ts
import type { Extension } from '@openshift/dynamic-plugin-sdk';

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    properties: {
      id: 'myNewModule',
      title: 'My New Module',
      href: '/my-module',
      section: 'models',
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/my-module/*',
      component: () => import('./MyModuleWrapper'),
    },
  },
];

export default extensions;
```

#### 3. Configure Webpack for Module Federation

```javascript
// webpack.config.js
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

const moduleFederationConfig = {
  name: 'myNewModule',
  filename: 'remoteEntry.js',
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
    'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
    '@patternfly/react-core': { singleton: true, requiredVersion: '^5.0.0' },
    '@openshift/dynamic-plugin-sdk': { singleton: true, requiredVersion: '*' },
    'mod-arch-shared': { singleton: true, requiredVersion: '*' },
  },
  exposes: {
    './extensions': './src/extensions',
  },
};

module.exports = {
  plugins: [new ModuleFederationPlugin(moduleFederationConfig)],
  // ... other webpack configuration
};
```

#### 4. Create Module Wrapper Component

```typescript
// src/MyModuleWrapper.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  ModularArchContextProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  ModularArchConfig,
} from 'mod-arch-shared';

const modularArchConfig: ModularArchConfig = {
  platformMode: process.env.PLATFORM_MODE || 'integrated',
  deploymentMode: process.env.DEPLOYMENT_MODE || 'standalone',
  URL_PREFIX: process.env.URL_PREFIX || '/my-module',
  BFF_API_VERSION: process.env.BFF_API_VERSION || 'v1',
};

const MyModuleWrapper: React.FC = () => {
  return (
    <ModularArchContextProvider config={modularArchConfig}>
      <BrowserStorageContextProvider>
        <NotificationContextProvider>
          <Routes>
            <Route path="/" element={<MyModuleMainPage />} />
            <Route path="/details/:id" element={<MyModuleDetailsPage />} />
          </Routes>
        </NotificationContextProvider>
      </BrowserStorageContextProvider>
    </ModularArchContextProvider>
  );
};

export default MyModuleWrapper;
```

#### 5. Test Module Federation Integration

```bash
# Start main dashboard (in separate terminal)
cd /path/to/main-dashboard
npm run dev

# Start your module
npm run dev

# Verify integration
# 1. Check browser console for module federation logs
# 2. Verify navigation item appears in dashboard
# 3. Test routing and component loading
# 4. Verify API proxy is working
curl http://localhost:4000/my-module/api/health
```

#### 6. Development Workflow

1. **Auto-Discovery**: The main dashboard automatically discovers your module based on the `module-federation` configuration in `package.json`

2. **Hot Reloading**: Both the dashboard and your module support hot reloading during development

3. **Debugging**: Use browser developer tools to inspect:
   - Network tab for `remoteEntry.js` loading
   - Console for module federation runtime logs
   - Extensions loading and registration

For comprehensive module federation details, see the [Module Federation Integration Guide](./17-module-federation-integration.md).
