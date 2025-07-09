# Modular Architecture Shared Library

`mod-arch-shared` is a TypeScript-based shared component library that serves as the cornerstone of our modular architecture initiative. It provides common UI components, utilities, and context management for building consistent, reusable micro-frontend applications across the AI platform ecosystem.

## 🚀 Quick Start

### Installation

```bash
npm install mod-arch-shared @mui/material @mui/icons-material @mui/types sass sass-loader
```

### Basic Usage

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ModularArchContextProvider, 
  ThemeProvider,
  DeploymentMode,
  Theme
} from 'mod-arch-shared';

const modularArchConfig = {
  deploymentMode: DeploymentMode.Standalone,
  URL_PREFIX: '/api',
  BFF_API_VERSION: 'v1',
};

const root = createRoot(document.getElementById('root')!);

root.render(
  <ModularArchContextProvider config={modularArchConfig}>
    <ThemeProvider theme={Theme.Patternfly}>
      <App />
    </ThemeProvider>
  </ModularArchContextProvider>
);
```

## 📚 Documentation

This library is part of a comprehensive modular architecture initiative. For detailed information, please refer to our documentation:

### Getting Started

- **📖 [Complete Documentation](./docs/README.md)** - Comprehensive guide to the modular architecture initiative
- **🏁 [Getting Started Guide](./docs/10-getting-started.md)** - Practical setup guide for new and existing projects
- **🎯 [Golden Path Team Onboarding](./docs/18-golden-path-team-onboarding.md)** - 4-week structured onboarding program

### Core Guides

- **📚 [Shared Library Guide](./docs/12-shared-library-guide.md)** - Complete reference for this library
- **🧩 [Component Library](./docs/14-component-library.md)** - UI components documentation
- **🔗 [API Integration](./docs/13-api-integration.md)** - REST and Kubernetes API patterns
- **⚡ [Advanced Patterns](./docs/15-advanced-patterns.md)** - Sophisticated development patterns

### Architecture

- **🏗️ [Architecture Overview](./docs/03-architecture-overview.md)** - Comprehensive guide to modular architecture concepts and core patterns
- **🔄 [Development Workflow](./docs/08-development-workflow.md)** - Upstream-first development practices

## 🏗️ Library Structure

The library is organized into focused modules:

- **`api/`** - API utilities for REST and Kubernetes calls
- **`components/`** - Reusable UI components
- **`hooks/`** - Custom React hooks
- **`context/`** - React context providers
- **`utilities/`** - Helper functions and constants
- **`types/`** - TypeScript type definitions
- **`style/`** - SCSS styles and themes

## 🛠️ Development

### Prerequisites

- Node.js >= 20.17
- npm >= 10.8

### Setup

```bash
git clone <repository-url>
cd mod-arch-shared
npm install
npm run build
npm test
```

For detailed development information, see the [Shared Library Guide](./docs/12-shared-library-guide.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for:

- Development setup and workflow
- Code standards and testing requirements  
- Pull request process
- Community guidelines

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
