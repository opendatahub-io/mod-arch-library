# mod-arch-core

Core functionality and API utilities for modular architecture micro-frontend projects.

## Installation

```bash
npm install mod-arch-core
```

## Peer Dependencies

- `react` (>=16.8.0)
- `react-dom` (>=16.8.0)

## Usage

```typescript
import {
  ModularArchContextProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  useModularArchContext,
  useNamespaces,
  DeploymentMode,
  type ModularArchConfig
} from 'mod-arch-core';
```

## What's Included

- **API utilities**: HTTP clients, error handling, and API state management
- **Context providers**: Core context providers for configuration, notifications, and browser storage
- **Hooks**: React hooks for namespaces, settings, and API state management
- **Utilities**: Common utility functions, fetch state management, and Kubeflow integration helpers
- **Types**: Core TypeScript type definitions

## Documentation

For detailed documentation, visit the [main repository](https://github.com/opendatahub-io/mod-arch-library).

## License

Apache-2.0
