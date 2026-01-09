# AGENTS.md - Modular Architecture Library

This document provides guidance for AI agents and developers working on the mod-arch-library
monorepo.

## Repository Overview

The Modular Architecture Essentials project provides libraries for building scalable micro-frontend
applications. This is a **monorepo** with npm workspaces containing four packages:

| Package              | Description                                                     | Key Technologies                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------- |
| `mod-arch-core`      | Core functionality, API utilities, context providers, and hooks | React, TypeScript                |
| `mod-arch-shared`    | Shared UI components and utilities for upstream applications    | React, PatternFly v6, TypeScript |
| `mod-arch-kubeflow`  | Kubeflow-specific themes, styling, and MUI integration          | React, Material UI v7, SCSS      |
| `mod-arch-installer` | CLI installer for bootstrapping mod-arch-starter projects       | Node.js, Commander               |

**Note**: The `mod-arch-starter` directory within this repo has its own rules and should be treated
as a separate project.

## Repository Structure

```
mod-arch-library/
├── mod-arch-core/           # Core package
│   ├── api/                 # API utilities (apiUtils, errorUtils, k8s, useAPIState)
│   ├── context/             # Context providers (ModularArch, BrowserStorage, Notification)
│   ├── hooks/               # React hooks (useNamespaces, useSettings, useNotification)
│   ├── types/               # TypeScript type definitions
│   └── utilities/           # Utility functions
├── mod-arch-shared/         # Shared components package
│   ├── components/          # UI components (SimpleSelect, MarkdownView, Tables, etc.)
│   ├── images/              # Image assets
│   ├── types/               # Shared type definitions
│   └── utilities/           # Shared utilities
├── mod-arch-kubeflow/       # Kubeflow theming package
│   ├── context/             # Theme context provider
│   ├── hooks/               # Theme hooks
│   ├── images/              # Kubeflow branding assets
│   ├── style/               # SCSS and design tokens
│   │   ├── MUI-theme.scss           # MUI-to-PatternFly mappings
│   │   ├── MUI-default-theme-object.json  # MUI theme reference
│   │   └── pf-tokens-SSOT.json      # PatternFly tokens (Single Source of Truth)
│   └── utilities/           # Kubeflow-specific utilities
├── mod-arch-installer/      # CLI installer package
│   ├── src/                 # CLI source code
│   ├── templates/           # Project templates
│   ├── flavors/             # Flavor configurations (kubeflow, default)
│   └── scripts/             # Build and utility scripts
├── docs/                    # Documentation
│   ├── architecture.md      # Architecture overview
│   ├── deployment-modes.md  # Deployment mode details
│   ├── development-flow.md  # Development workflow
│   ├── extensibility.md     # Extensibility guide
│   ├── golden-path.md       # Golden path documentation
│   └── testing.md           # Testing guidelines
└── mod-arch-starter/        # Starter template (has its own rules)
```

## Development Requirements

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **TypeScript**: ~5.0.x
- **React**: >= 18.x

## Common Commands

```bash
# Install dependencies (from root)
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:shared
npm run build:kubeflow
npm run build:installer

# Run tests
npm run test              # All packages
npm run test:core         # Core package only
npm run test:shared       # Shared package only
npm run test:kubeflow     # Kubeflow package only

# Linting
npm run lint              # Lint all packages
npm run lint:fix          # Fix linting issues
```

## Code Style and Conventions

### General TypeScript/React Rules

- Use **functional components** with React hooks
- Use **TypeScript** for all code with proper type annotations
- Follow **Conventional Commits** for commit messages:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `docs:` - Documentation changes
  - `style:` - Code style changes (formatting)
  - `refactor:` - Code refactoring
  - `test:` - Test additions/changes
  - `chore:` - Build/tooling changes

### Naming Conventions

- **Variables**: `camelCase` or `UPPER_CASE` for constants
- **Functions**: `camelCase` or `PascalCase` for components
- **Types/Interfaces**: `PascalCase`
- **Files**: Match the main export (e.g., `SimpleSelect.tsx` exports `SimpleSelect`)

### ESLint Rules (Key Points)

- No `console.log` statements - use proper logging
- Use `===` for equality (except null checks)
- No `.sort()` - use `.toSorted()` instead
- Prefer destructuring for objects
- Use template literals over string concatenation
- Self-closing JSX components when no children
- Explicit return types on exported functions (`@typescript-eslint/explicit-module-boundary-types`)
- No type assertions in production code (only in tests/mocks)

### Import Order

1. Built-in modules
2. External packages
3. Internal modules (using `~` prefix)
4. Index imports
5. Sibling imports
6. Parent imports

---

## Package-Specific Guidelines

Each package may have its own AGENTS.md with package-specific guidance:

- **[mod-arch-kubeflow/AGENTS.md](mod-arch-kubeflow/AGENTS.md)** - Kubeflow theming, PatternFly
  design tokens, and MUI integration guidelines

---

## Architecture Overview

### Deployment Modes

The libraries support three deployment modes:

| Mode           | Description                                      |
| -------------- | ------------------------------------------------ |
| **Standalone** | Single-application deployments                   |
| **Federated**  | Micro-frontend architectures (Module Federation) |
| **Kubeflow**   | Integration with Kubeflow environments           |

### Module Components

| Element        | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| **Frontend**   | React workspace with shared UI libraries, Module Federation support |
| **BFF**        | Go backend-for-frontend service handling auth and API orchestration |
| **Contracts**  | OpenAPI spec, generated clients, shared constants                   |
| **Deployment** | Manifests, Helm/Kustomize fragments, Module Federation metadata     |

### Context Provider Setup

Applications using these libraries must set up providers in this order:

```typescript
import { ModularArchContextProvider, BrowserStorageContextProvider, NotificationContextProvider } from 'mod-arch-core';
import { ThemeProvider, Theme } from 'mod-arch-kubeflow';

<Router>
  <ModularArchContextProvider config={config}>
    <ThemeProvider theme={Theme.MUI}>
      <BrowserStorageContextProvider>
        <NotificationContextProvider>
          <App />
        </NotificationContextProvider>
      </BrowserStorageContextProvider>
    </ThemeProvider>
  </ModularArchContextProvider>
</Router>
```

---

## Testing Guidelines

### Test Commands

```bash
# Run all tests
npm run test

# Run only Jest tests
npm run test:jest

# Type checking only
npm run test:type-check

# Linting
npm run test:lint
```

### Testing Patterns

- Use **React Testing Library** for component testing
- Use **Jest** as the test runner
- Tests are located in `__tests__/` directories alongside source code
- Test files should be named `*.test.ts` or `*.test.tsx`

### What to Test

- Custom hooks behavior
- Component rendering and interactions
- API utility functions
- Context provider behavior
- Error handling

---

## Adding New Components

When adding new components:

1. Create the component in the appropriate package
2. Include proper TypeScript typings
3. Add unit tests in the `__tests__` directory
4. Export from the package's barrel file (`index.ts`)
5. For shared components, consider SCSS co-location
6. Follow the existing component patterns in the codebase

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the commit message conventions
4. Ensure all tests pass
5. Submit a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Additional Resources

- [Architecture Documentation](docs/architecture.md)
- [Deployment Modes](docs/deployment-modes.md)
- [Development Flow](docs/development-flow.md)
- [Extensibility Guide](docs/extensibility.md)
- [Golden Path](docs/golden-path.md)
