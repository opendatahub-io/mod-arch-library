# Core Architectural Patterns

Our modular architecture is built on three foundational patterns that work together to create a scalable and maintainable system.

## 1. Micro-Frontend Architecture

**Micro-frontends** are the building blocks of our new architecture. Each micro-frontend represents a distinct business domain or feature set.

### Key Characteristics

- **Self-Contained**: Each micro-frontend is a complete web application with its own components, state management, and data-fetching logic
- **Domain-Focused**: Aligned with specific business capabilities (e.g., Model Registry, Experiment Tracking)
- **Technology Flexibility**: While we recommend standard technologies, teams can choose different approaches when justified
- **Independent Lifecycle**: Development, testing, and deployment happen independently

### Examples of Micro-Frontends

- **Model Registry Module**: Manages model artifacts and metadata
- **Experiment Tracking Module**: Handles ML experiment lifecycle
- **Serving Dashboards Module**: Monitors and manages model serving infrastructure
- **Data Management Module**: Handles dataset operations and versioning

### Implementation Approaches

#### Standalone Applications

Each micro-frontend is a complete, independently deployable application:

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Model Registry │    │ Experiment      │    │ Serving         │
│                 │    │ Tracking        │    │ Dashboards      │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ Frontend  │  │    │  │ Frontend  │  │    │  │ Frontend  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │    BFF    │  │    │  │    BFF    │  │    │  │    BFF    │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Module Federation

Runtime composition of micro-frontends within a host application:

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Host Application                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Remote    │  │   Remote    │  │   Remote    │            │
│  │   Module    │  │   Module    │  │   Module    │            │
│  │     A       │  │     B       │  │     C       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│                     Shared Dependencies                        │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits

- **Independent Development**: Teams can work autonomously without coordination overhead
- **Technology Diversity**: Different modules can use different technologies when appropriate
- **Deployment Flexibility**: Modules can be deployed independently and at different frequencies
- **Fault Isolation**: Issues in one module don't affect others

## 2. Backend-for-Frontend (BFF) Pattern

Each micro-frontend is supported by its own **Backend-for-Frontend (BFF)** - a dedicated server-side component tailored to the specific needs of its corresponding frontend.

### Primary Functions

- **API Aggregation**: Combines data from multiple backend services into optimized frontend-specific APIs
- **Authentication Handling**: Manages authentication flows and token validation
- **Data Transformation**: Converts backend data formats into frontend-optimized structures
- **Business Logic**: Contains domain-specific logic that doesn't belong in the frontend
- **Caching and Performance**: Implements caching strategies to improve frontend performance

### BFF Benefits

```text
Frontend ←→ BFF ←→ [K8s APIs | ML Services | Databases]
                ↑
            Single, optimized
            API surface for 
            the frontend
```

### Key Advantages

- **Optimized APIs**: Each BFF provides APIs specifically tailored to its frontend's needs
- **Reduced Complexity**: Frontend complexity is reduced by abstracting backend integration details
- **Performance**: Optimized data fetching and caching strategies
- **Security**: Centralized authentication and authorization handling
- **Evolution**: BFF can evolve independently to serve changing frontend requirements

### BFF Architecture Example

```text
┌─────────────────┐
│   Frontend      │
│   (React)       │
└─────────┬───────┘
          │ HTTP/REST
          ▼
┌─────────────────┐
│       BFF       │
│   (Golang)      │
├─────────────────┤
│ • Authentication│
│ • Data Aggreg.  │
│ • Business Logic│
│ • Caching       │
└─────────┬───────┘
          │ gRPC/HTTP
          ▼
┌─────────────────┐
│  Backend APIs   │
│ • Kubernetes    │
│ • ML Services   │
│ • Databases     │
└─────────────────┘
```

### Development Benefits

- **Mocked Development**: BFF can provide mocked responses for frontend development
- **API Versioning**: BFF can handle API version translation and compatibility
- **Testing**: Each BFF can be tested independently with its frontend
- **Monitoring**: Dedicated observability for each domain's API interactions

## 3. Shared UI Essentials Library (mod-arch-shared)

The **Shared UI Essentials Library** (`mod-arch-shared`) is the cornerstone of consistency and reusability across all modules, providing both frontend and backend primitives for unified development.

### Core Architecture Principles

- **Provider-Based Architecture**: Centralized service registration and dependency injection
- **Context-Driven State Management**: Global state management with optimized rendering
- **Type-Safe API Integration**: Unified patterns for REST and Kubernetes API interactions
- **Theme-Aware Components**: Consistent UI components that adapt to platform themes

### Frontend Assets

#### React Components Library

- **Navigation Components**: `AppLayout`, `Navigation`, `Breadcrumbs`
- **Data Display**: `Table`, `Card`, `EmptyState`, `LoadingSpinner`
- **Form Controls**: `Input`, `Select`, `Checkbox`, `Button`, `ActionButton`
- **Feedback Components**: `Alert`, `Toast`, `ConfirmDialog`, `Modal`
- **Data Visualization**: `Chart`, `Metrics`, `StatusIndicator`

#### Custom Hooks

- **Data Fetching**: `useApi`, `useK8sResource`, `usePagination`
- **State Management**: `useAppContext`, `useNotifications`, `useUser`
- **UI Interactions**: `useModal`, `useToggle`, `useLocalStorage`
- **Performance**: `useDebounce`, `useThrottle`, `useMemoizedCallback`

#### Context Providers

- **AppContextProvider**: Global application state and configuration
- **NotificationProvider**: Toast notifications and alerts management
- **UserProvider**: Authentication state and user preferences
- **ThemeProvider**: Design system and theme management

#### API Integration Layer

- **REST Client**: Type-safe HTTP client with error handling and caching
- **Kubernetes Client**: Custom resource management with watch capabilities
- **Error Handling**: Unified error boundaries and retry mechanisms
- **Loading States**: Consistent loading and error state management

### Backend Assets

#### Authentication & Authorization

- **OAuth Integration**: Token validation and refresh patterns
- **RBAC Middleware**: Role-based access control for BFF endpoints
- **Session Management**: Secure session handling and cleanup
- **API Key Management**: Service-to-service authentication

#### API Utilities

- **Request Validation**: JSON schema validation middleware
- **Response Formatting**: Consistent API response structure
- **Error Handling**: Standardized error codes and messages
- **Rate Limiting**: Request throttling and quota management

#### Kubernetes Integration

- **Client Libraries**: Type-safe Kubernetes API clients
- **Custom Resources**: CRD management and validation
- **Watch Mechanisms**: Real-time resource state monitoring
- **Operator Patterns**: Controller and operator development utilities

### Library Structure

```text
mod-arch-shared/
├── src/
│   ├── components/          # React component library
│   │   ├── navigation/      # Navigation components
│   │   ├── data-display/    # Tables, cards, lists
│   │   ├── forms/          # Input controls and validation
│   │   ├── feedback/       # Alerts, toasts, modals
│   │   └── layout/         # Layout and container components
│   ├── hooks/              # Custom React hooks
│   │   ├── api/            # Data fetching hooks
│   │   ├── state/          # State management hooks
│   │   └── ui/             # UI interaction hooks
│   ├── providers/          # Context providers and services
│   │   ├── app/            # Application context
│   │   ├── notifications/  # Notification system
│   │   ├── auth/           # Authentication provider
│   │   └── theme/          # Theme and design system
│   ├── api/                # API integration layer
│   │   ├── rest/           # REST client utilities
│   │   ├── k8s/            # Kubernetes client
│   │   └── types/          # API type definitions
│   ├── utils/              # Utility functions
│   │   ├── formatting/     # Data formatting utilities
│   │   ├── validation/     # Input validation
│   │   └── helpers/        # General helper functions
│   └── styles/             # Design system and themes
│       ├── tokens/         # Design tokens
│       ├── components/     # Component styles
│       └── themes/         # Theme definitions
├── backend/
│   ├── auth/               # Authentication middleware
│   ├── api/                # API utilities and middleware
│   ├── k8s/                # Kubernetes integration
│   └── monitoring/         # Observability patterns
├── docs/                   # Comprehensive documentation
└── examples/               # Usage examples and demos
```

### Version Management

The shared library follows semantic versioning to enable:

- **Backward Compatibility**: Modules can upgrade at their own pace
- **Breaking Change Management**: Clear communication of breaking changes
- **Feature Rollout**: New features can be adopted gradually
- **Security Updates**: Critical updates can be applied across all modules

### Usage Patterns

#### Frontend Module Integration

```typescript
// Module setup with shared providers
import {
  AppContextProvider,
  NotificationProvider,
  UserProvider,
  ThemeProvider
} from '@mod-arch/shared';

function ModuleApp() {
  return (
    <AppContextProvider>
      <ThemeProvider>
        <UserProvider>
          <NotificationProvider>
            <ModelRegistryModule />
          </NotificationProvider>
        </UserProvider>
      </ThemeProvider>
    </AppContextProvider>
  );
}

// Using shared components and hooks
import { 
  Table, 
  Button, 
  useApi, 
  useNotifications 
} from '@mod-arch/shared';

function ModelsList() {
  const { data, loading, error } = useApi('/api/models');
  const { showSuccess, showError } = useNotifications();

  const handleDelete = async (id: string) => {
    try {
      await deleteModel(id);
      showSuccess('Model deleted successfully');
    } catch (error) {
      showError('Failed to delete model');
    }
  };

  return (
    <Table
      data={data}
      loading={loading}
      error={error}
      actions={(row) => (
        <Button
          variant="danger"
          onClick={() => handleDelete(row.id)}
        >
          Delete
        </Button>
      )}
    />
  );
}
```

#### BFF Implementation with Shared Utilities

```go
// Using shared authentication middleware
package main

import (
    "github.com/mod-arch/shared/auth"
    "github.com/mod-arch/shared/api"
    "github.com/mod-arch/shared/k8s"
)

func main() {
    r := gin.New()
    
    // Apply shared middleware
    r.Use(auth.ValidateToken())
    r.Use(api.ErrorHandler())
    r.Use(api.RequestLogging())
    
    // Kubernetes client with shared utilities
    k8sClient := k8s.NewClient()
    
    r.GET("/api/models", func(c *gin.Context) {
        models, err := k8sClient.ListCustomResources(
            "models.example.com/v1",
            "models",
            c.Query("namespace"),
        )
        if err != nil {
            api.HandleError(c, err)
            return
        }
        
        api.RespondWithData(c, models)
    })
    
    r.Run(":8080")
}
```

### Version Management Strategy

The shared library follows a structured versioning approach:

#### Semantic Versioning

- **Major (X.0.0)**: Breaking changes requiring module updates
- **Minor (0.X.0)**: New features with backward compatibility
- **Patch (0.0.X)**: Bug fixes and improvements

#### Release Cadence

- **Weekly Patches**: Bug fixes and minor improvements
- **Monthly Minors**: New features and enhancements
- **Quarterly Majors**: Breaking changes and architectural updates

#### Migration Support

- **Deprecation Warnings**: 2-version deprecation cycle
- **Migration Guides**: Automated migration tooling
- **Compatibility Matrix**: Version compatibility tracking

### Development Workflow Integration

#### Local Development

```bash
# Link shared library for local development
npm link @mod-arch/shared

# Hot reload with shared library changes
npm run dev:with-shared

# Run tests with shared library mocks
npm run test:integration
```

#### CI/CD Integration

```yaml
# Shared library version checking
- name: Check shared library compatibility
  run: npm run check-shared-version

# Automated dependency updates
- name: Update shared dependencies
  run: npm run update-shared-deps
```

## Pattern Integration

These three patterns work together to create a cohesive architecture:

### Development Flow

1. **Shared Library Development**: Common patterns and components are developed and versioned
2. **BFF Implementation**: Backend logic is implemented using shared utilities
3. **Frontend Development**: UI is built using shared components and BFF APIs
4. **Integration**: Modules are composed together in the host application

### Runtime Interaction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Host Application                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Micro-      │  │ Micro-      │  │ Micro-      │            │
│  │ Frontend A  │  │ Frontend B  │  │ Frontend C  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                   │
├─────────┼────────────────┼────────────────┼───────────────────┤
│         ▼                ▼                ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   BFF A     │  │   BFF B     │  │   BFF C     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                Shared UI Essentials Library                    │
│     (Components, Hooks, Styles, Auth, Logging, Utils)         │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Considerations

### Technology Alignment

- **Frontend**: React with TypeScript for consistency
- **Backend**: Golang for BFF implementations
- **Build Tools**: Webpack with Module Federation support
- **Testing**: Jest for frontend, native Go testing for backend

### Development Workflow

- **Shared Library First**: Common functionality developed in shared library
- **API Contract Definition**: BFF APIs designed before implementation
- **Independent Development**: Modules developed in parallel
- **Integration Testing**: End-to-end testing across module boundaries

### Deployment Strategy

- **Library Versioning**: Shared library follows semantic versioning
- **Module Independence**: Modules can be deployed independently
- **Runtime Composition**: Modules composed at runtime through host application
- **Progressive Rollout**: New versions can be deployed gradually

## Conclusion

These three core patterns - Micro-Frontends, Backend-for-Frontend, and Shared UI Essentials - provide the foundation for our modular architecture. Together, they enable independent development, consistent user experience, and scalable deployment while maintaining the flexibility to evolve with our platform's needs.

---

**Next Steps**: Explore [Implementation Approaches](./05-implementation-approaches.md) to understand how these patterns are applied in practice, or review [Benefits and Value](./06-benefits-and-value.md) to understand the business impact.
