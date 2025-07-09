# Technology Standards

To ensure consistency and leverage modern best practices, we've established comprehensive technology standards for all modules in our modular architecture. These standards are built around our **mod-arch-shared** library.

## Required Technology Stack

### Frontend Standards

- **Framework**: React 18+ with TypeScript
- **Shared Library**: `mod-arch-shared` (mandatory for all applications)
- **Styling**: PatternFly 6+ (primary), Material-UI 6+ (optional)
- **Bundling**: Webpack 5+ with Module Federation support
- **Testing**: Jest + React Testing Library

### Backend Standards

- **Language**: Go 1.21+ (recommended), Node.js 18+ (legacy support)
- **API Framework**: Gin (Go) or Express (Node.js)
- **Authentication**: OAuth2/OIDC integration
- **API Patterns**: REST with OpenAPI specification
- **Testing**: Go testing package or Jest

### Infrastructure Standards

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes 1.24+
- **CI/CD**: GitHub Actions (preferred)
- **Monitoring**: Prometheus + Grafana

## Shared Library Integration

### Core Dependencies

All applications **MUST** include:

```bash
# Required core dependency
npm install mod-arch-shared@latest

# Required peer dependencies
npm install @mui/material@^6.0.0 @mui/icons-material@^6.0.0 sass@^1.83.0
```

### Provider Setup

All applications **MUST** implement the required provider hierarchy:

```typescript
import { 
  ModularArchContextProvider, 
  ThemeProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  DeploymentMode,
  Theme
} from 'mod-arch-shared';

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

For complete configuration examples and technical details, see [Shared Library Guide](./12-shared-library-guide.md).

## Development Standards

### Code Quality

- **TypeScript**: Strict mode enabled with proper type definitions
- **Linting**: ESLint with shared configuration
- **Formatting**: Prettier with consistent rules
- **Testing**: Minimum 80% code coverage

### Git Workflow

- **Branching**: Feature branches with descriptive names
- **Commits**: Conventional commit messages
- **Reviews**: Required pull request reviews
- **CI/CD**: Automated testing and deployment

### Documentation

- **API Documentation**: OpenAPI/Swagger specifications
- **Component Documentation**: Storybook for UI components
- **Code Documentation**: JSDoc for TypeScript, GoDoc for Go
- **Architecture**: Decision records for significant changes

## Deployment Standards

### Container Standards

- **Base Images**: Official minimal images (alpine, distroless)
- **Security**: Non-root user, minimal attack surface
- **Size**: Optimized for small footprint
- **Health Checks**: Proper liveness and readiness probes

### Kubernetes Standards

- **Resources**: CPU and memory limits defined
- **Labels**: Consistent labeling strategy
- **Networking**: Service mesh integration where applicable
- **Monitoring**: Prometheus metrics endpoints

## Compliance and Security

### Security Requirements

- **Authentication**: Integration with platform identity providers
- **Authorization**: RBAC implementation
- **Data Protection**: Encryption at rest and in transit
- **Vulnerability Scanning**: Regular security scans

### Accessibility Standards

- **WCAG 2.1**: Level AA compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: Meets accessibility requirements

For implementation guidance and examples, refer to:

- [Getting Started Guide](./10-getting-started.md) - Practical setup steps
- [Shared Library Guide](./12-shared-library-guide.md) - Technical integration details
- [Development Workflow](./08-development-workflow.md) - Process and practices
