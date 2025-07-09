# Getting Started

This guide provides practical steps for teams looking to adopt modular architecture, whether you're starting new projects or migrating existing applications.

## Quick Assessment

### For New Projects

**You should start here if:**

- Building a new feature or application from scratch
- Have no existing codebase constraints
- Want to adopt upstream-first development practices

**Recommended Path:** [New Project Setup](#new-project-setup)

### For Existing Projects

**You should start here if:**

- Have an existing monolithic application
- Need to maintain business continuity during migration
- Want to gradually adopt modular patterns

**Recommended Path:** [Migration Strategy](./09-migration-strategy.md)

## New Project Setup

### Prerequisites

Ensure you have the required tools:

```bash
# Check versions
node --version    # Node.js 18.x LTS or later
go version        # Go 1.21 or later
docker --version  # For containerization
kubectl version   # For Kubernetes deployment
```

### Step 1: Create Module Repository

```bash
# Create new module (template coming soon)
git clone https://github.com/kubeflow/model-registry my-new-module
cd my-new-module

# Install dependencies
cd frontend && npm install
cd ../backend && go mod tidy
```

### Step 2: Configure Shared Library Integration

For detailed configuration instructions, see [Shared Library Guide](./12-shared-library-guide.md).

Basic setup:

```typescript
// src/main.tsx
import { 
  ModularArchContextProvider, 
  ThemeProvider,
  DeploymentMode 
} from 'mod-arch-shared';

const config = {
  deploymentMode: DeploymentMode.Standalone,
  URL_PREFIX: '/api',
  BFF_API_VERSION: 'v1',
};

root.render(
  <ModularArchContextProvider config={config}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ModularArchContextProvider>
);
```

### Step 3: Development Workflow

```bash
# Start frontend development
cd frontend && npm run dev

# Start backend in mock mode (in another terminal)
cd backend && go run cmd/main.go --mock-mode
```

## Existing Project Migration

For migrating existing applications, follow the [Migration Strategy](./09-migration-strategy.md) guide which provides:

- **Phased Migration Approach**: Gradual transition from monolith to modules
- **Risk Mitigation**: Maintain functionality during migration
- **Integration Patterns**: How to integrate with existing systems

## Next Steps

### Essential Reading

1. **[Shared Library Guide](./12-shared-library-guide.md)** - Complete technical reference
2. **[Technology Standards](./07-technology-standards.md)** - Required tools and frameworks
3. **[Development Workflow](./08-development-workflow.md)** - Upstream-first practices

### Team Onboarding

For comprehensive team onboarding with structured guidance:

**[Golden Path Team Onboarding](./18-golden-path-team-onboarding.md)** - 4-week structured program that takes teams from zero to production-ready modular applications.

### Advanced Topics

- **[API Integration](./13-api-integration.md)** - REST and Kubernetes API patterns
- **[Component Library](./14-component-library.md)** - UI components documentation
- **[Advanced Patterns](./15-advanced-patterns.md)** - Sophisticated development patterns

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Comprehensive guides in this repository
- **Community**: Join discussions and share feedback

For strategic context and goals, see [Executive Summary](./01-executive-summary.md).
