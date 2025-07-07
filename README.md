# Modular Architecture Shared Library

## Overview

`mod-arch-shared` is a shared library providing common UI components and utilities for micro-frontend projects following a modular architecture. This library follows a modular design to ensure reusability and maintainability across various projects. The library is versioned to facilitate consistent updates and integration.

## Installation

```bash
npm install mod-arch-shared
```

## Usage

Import components and utilities as needed:

```jsx
import { DashboardSearchField, useNamespaces, ToastNotification } from 'mod-arch-shared';

const MyComponent = () => {
  const { namespaces, loading } = useNamespaces();
  
  return (
    <>
      <DashboardSearchField onChange={handleSearch} />
      {/* Your component code */}
      <ToastNotification title="Success" type="success" message="Operation completed" />
    </>
  );
};
```

## Using Styles and Images

This library exports both style files and image assets that can be imported and used in your application.

### Importing Styles

You can import specific styles or all styles at once:

```javascript
// Import all styles
import { style } from 'mod-arch-shared';

// Or import specific style components directly
import 'mod-arch-shared/style';
```

### Importing Images

Images can be imported in several ways:

```javascript
// Import specific images
import { emptyStateNotebooks, iconRedHatStorage } from 'mod-arch-shared/images';

// Or import all images as a namespace
import * as Images from 'mod-arch-shared/images';

// Then use them in your components
<img src={emptyStateNotebooks} alt="Empty state notebooks" />
```

## Folder Structure

The repository contains the following modules:

- **api**: API utilities for making service calls and handling errors
- **components**: Reusable UI components
- **hooks**: Custom React hooks
- **utilities**: Utility functions
- **context**: Context providers
- **style**: Global styles
- **types**: TypeScript type definitions

## Provider Setup

The Modular Architecture library requires proper context setup to function correctly. The library provides two essential providers that must be configured at the root of your application:

### ModularArchContextProvider

The `ModularArchContextProvider` is **mandatory** for using this library. It provides essential configuration and state management for:

- **Deployment mode configuration** (Standalone, Federated, or Kubeflow)
- **Namespace management** and selection
- **API endpoint configuration**
- **Script loading state** for Kubeflow integration
- **Mandatory namespace enforcement** when required

### ThemeProvider

The `ThemeProvider` manages UI theming and supports:

- **PatternFly theme** (default)
- **Material-UI theme** with CSS variables support
- **Dynamic theme switching** at runtime

### Complete Setup Example

Here's how to properly set up your application root with both providers:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  ModularArchContextProvider, 
  ThemeProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  DeploymentMode,
  Theme
} from 'mod-arch-shared';

// Define your configuration
const modularArchConfig: ModularArchConfig = {
  deploymentMode: DeploymentMode.Standalone, // or Federated, Kubeflow
  URL_PREFIX: '/api',
  BFF_API_VERSION: 'v1',
  // Optional: Force a specific namespace
  // mandatoryNamespace: 'production'
};

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Router>
      <ModularArchContextProvider config={modularArchConfig}>
        <ThemeProvider theme={Theme.Patternfly}>
          <BrowserStorageContextProvider>
            <NotificationContextProvider>
              <App />
            </NotificationContextProvider>
          </BrowserStorageContextProvider>
        </ThemeProvider>
      </ModularArchContextProvider>
    </Router>
  </React.StrictMode>,
);
```

### Configuration Options

#### Deployment Modes

- **`DeploymentMode.Standalone`**: For single-application deployments
- **`DeploymentMode.Federated`**: For micro-frontend architectures
- **`DeploymentMode.Kubeflow`**: For integration with Kubeflow environments

#### Theme Options

- **`Theme.Patternfly`**: Red Hat PatternFly design system (default)
- **`Theme.MUI`**: Material-UI design system with CSS variables (requires optional MUI dependencies)

#### MUI Dependencies (Optional)

The library supports both PatternFly and MUI themes. MUI dependencies are **optional**:

**For PatternFly-only projects** (no additional dependencies needed):
```bash
npm install mod-arch-shared
```

**For projects using MUI theme** (install optional MUI dependencies):
```bash
npm install mod-arch-shared @mui/material @emotion/react @emotion/styled
```

If you request `Theme.MUI` without installing MUI dependencies, the library will:
- Log a warning message
- Automatically fall back to PatternFly theme
- Continue working without errors

### Using the Context in Components

Once providers are set up, you can access the configuration and state throughout your application:

```typescript
import { useModularArchContext, useThemeContext } from 'mod-arch-shared';

const MyComponent = () => {
  const { 
    config, 
    namespaces, 
    preferredNamespace, 
    updatePreferredNamespace 
  } = useModularArchContext();
  
  const { theme } = useThemeContext();
  
  return (
    <div>
      <p>Current deployment mode: {config.deploymentMode}</p>
      <p>Available namespaces: {namespaces.length}</p>
      <p>Current theme: {theme}</p>
    </div>
  );
};
```

## Configuration

### ModularArchConfig

The library supports various configuration options through the `ModularArchConfig` interface:

```typescript
interface ModularArchConfig {
  deploymentMode: DeploymentMode;
  URL_PREFIX: string;
  BFF_API_VERSION: string;
  mandatoryNamespace?: string; // Optional: Force a specific namespace
}
```

#### Mandatory Namespace

The `mandatoryNamespace` option allows you to enforce a specific namespace throughout the application:

```typescript
const config = {
  deploymentMode: DeploymentMode.Standalone,
  URL_PREFIX: '/api',
  BFF_API_VERSION: 'v1',
  mandatoryNamespace: 'production' // Force the use of 'production' namespace
};
```

When `mandatoryNamespace` is set:

- The namespace selector in the UI will be disabled
- All API calls will be restricted to the specified namespace
- Users cannot switch to different namespaces
- The `useNamespaces` hook will only return the mandatory namespace

This is useful for production environments or when you want to restrict users to a specific namespace.

## Migration Guide

### Upgrading to Optional MUI Support

If you're upgrading from a version where MUI was a required dependency:

**No changes needed** if you're using MUI theme:
- Your existing code will continue to work
- MUI dependencies that were previously required are now optional but still detected

**To reduce bundle size** if you're only using PatternFly theme:
```bash
# You can now safely remove MUI dependencies
npm uninstall @mui/material @emotion/react @emotion/styled
```

**For new projects**:
- Use `Theme.Patternfly` (default) - no additional dependencies needed
- Use `Theme.MUI` - install the optional MUI packages first

The library will automatically detect which theme system is available and behave accordingly.

## Development

### Prerequisites

- Node.js >= 20.17
- npm >= 10.8

### Setup

```bash
git clone <repository-url>
cd mod-arch-shared
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

We welcome contributions to the project. Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
