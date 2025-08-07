# Modular Architecture Essentials

## Overview

The Modular Architecture Essentials project provides a set of modular libraries designed for building scalable micro-frontend applications. The libraries are split into three focused packages, each serving a specific purpose in the modular architecture ecosystem:

- **`mod-arch-core`**: Core functionality, API utilities, context providers, and hooks
- **`mod-arch-shared`**: Shared UI components and utilities for upstream applications  
- **`mod-arch-kubeflow`**: Kubeflow-specific themes, styling, and integration utilities

This modular approach ensures better separation of concerns, improved maintainability, and allows applications to only import what they need.

## Installation

Install the packages you need based on your application requirements:

### Core Package (Required)

```bash
npm install mod-arch-core
```

### Shared Components Package

```bash
npm install mod-arch-shared sass sass-loader
```

### Kubeflow Integration Package

```bash
npm install mod-arch-kubeflow @mui/material sass sass-loader
```

### Peer Dependencies

The libraries require certain peer dependencies:

- **React** (`react`, `react-dom`) - Required for all packages
- **MUI dependencies** (`@mui/material`, `@mui/icons-material`, `@mui/types`) - Required for shared components and theming
- **SASS dependencies** (`sass`, `sass-loader`) - Required for processing SCSS files

### SASS/SCSS Processing Requirements

This library contains SCSS files that need to be processed by your application's build system. You must:

1. **Install the required dependencies:**

   ```bash
   npm install sass sass-loader
   ```

2. **Configure your webpack to handle SCSS files** by adding this rule to your webpack configuration:

   ```js
   {
     test: /\.s[ac]ss$/i,
     use: [
       // Creates `style` nodes from JS strings
       'style-loader',
       // Translates CSS into CommonJS
       'css-loader',
       // Compiles Sass to CSS
       'sass-loader',
     ],
   }
   ```

If you're using Create React App, Vite, or similar build tools, SCSS support is typically included by default when you install the `sass` package.

## Package Overview

### mod-arch-core

The core package provides essential functionality for modular architecture applications:

- **API utilities**: HTTP clients, error handling, and API state management
- **Context providers**: Core context providers for configuration, notifications, and browser storage
- **Hooks**: React hooks for namespaces, settings, and API state management
- **Utilities**: Common utility functions, fetch state management, and Kubeflow integration helpers
- **Types**: Core TypeScript type definitions

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

### mod-arch-shared

The shared package provides reusable UI components and utilities for upstream applications:

- **Components**: Common UI components like search fields, modals, tables, and form elements
- **Utilities**: Shared utility functions for UI interactions
- **Images**: Common image assets and icons
- **Types**: Shared TypeScript type definitions

```typescript
import {
  DashboardSearchField,
  DashboardModalFooter,
  SimpleSelect,
  MarkdownView,
  images
} from 'mod-arch-shared';
```

### mod-arch-kubeflow

The Kubeflow package provides theme and styling integration for Kubeflow environments:

- **Context providers**: Theme context provider for Kubeflow styling
- **Hooks**: Theme management hooks
- **Styles**: Kubeflow-specific SCSS and CSS files
- **Images**: Kubeflow branding assets (logos, icons)
- **Utilities**: Kubeflow-specific constants and helpers

```typescript
import {
  ThemeProvider,
  useThemeContext,
  style,
  images
} from 'mod-arch-kubeflow';
```

## Usage

### Basic Usage Example

Import components and utilities from the appropriate packages:

```jsx
// Core functionality
import {
  ModularArchContextProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  useNamespaces,
  DeploymentMode
} from 'mod-arch-core';

// Shared components
import { 
  DashboardSearchField, 
  SimpleSelect,
  images as sharedImages 
} from 'mod-arch-shared';

// Kubeflow theming
import { 
  ThemeProvider,
  images as kubeflowImages 
} from 'mod-arch-kubeflow';

const MyComponent = () => {
  const { namespaces, loading } = useNamespaces();
  
  return (
    <>
      <DashboardSearchField onChange={handleSearch} />
      <SimpleSelect options={namespaces} />
      <img src={kubeflowImages.logoKubeflowLightTheme} alt="Kubeflow" />
    </>
  );
};
```

### Using Styles and Images

Each package exports styles and images that can be imported and used in your application.

#### Importing Styles

```javascript
// Import Kubeflow-specific styles
import { style } from 'mod-arch-kubeflow';

// Or import specific style files directly
import 'mod-arch-kubeflow/dist/style/MUI-theme.scss';
```

#### Importing Images

```javascript
// Import from shared package
import { images as sharedImages } from 'mod-arch-shared';

// Import from Kubeflow package
import { images as kubeflowImages } from 'mod-arch-kubeflow';

// Use them in your components
<img src={kubeflowImages.logoKubeflowLightTheme} alt="Kubeflow Light" />
<img src={kubeflowImages.logoKubeflowDarkTheme} alt="Kubeflow Dark" />
<img src={sharedImages.emptyStateNotebooks} alt="Empty state" />
```

## Repository Structure

The repository is organized into three main packages:

### mod-arch-core/

- **api/**: API utilities for making service calls and handling errors
- **context/**: Core context providers (ModularArchContext, BrowserStorageContext, NotificationContext)  
- **hooks/**: React hooks for namespaces, settings, and state management
- **types/**: Core TypeScript type definitions
- **utilities/**: Core utility functions and constants

### mod-arch-shared/

- **components/**: Reusable UI components for upstream applications
- **images/**: Common image assets and icons
- **types/**: Shared TypeScript type definitions  
- **utilities/**: Shared utility functions

### mod-arch-kubeflow/

- **context/**: Theme context provider for Kubeflow styling
- **hooks/**: Theme management hooks
- **images/**: Kubeflow branding assets (logos, icons)
- **style/**: Kubeflow-specific SCSS and MUI theme files
- **utilities/**: Kubeflow-specific constants and helpers

## Provider Setup

The Modular Architecture libraries require proper context setup to function correctly. The libraries provide several essential providers that must be configured at the root of your application.

### Core Providers (mod-arch-core)

#### ModularArchContextProvider

The `ModularArchContextProvider` is **mandatory** for using these libraries. It provides essential configuration and state management for:

- **Deployment mode configuration** (Standalone, Federated, or Kubeflow)
- **Namespace management** and selection
- **API endpoint configuration**
- **Script loading state** for Kubeflow integration
- **Mandatory namespace enforcement** when required

#### BrowserStorageContextProvider

Provides browser storage management for persisting user preferences and application state.

#### NotificationContextProvider

Handles application-wide notifications and toast messages.

### Theme Provider (mod-arch-kubeflow)

The `ThemeProvider` from `mod-arch-kubeflow` manages UI theming for Kubeflow environments and supports:

- **Material-UI theme** with Kubeflow branding
- **CSS variables support** for dynamic theming
- **Light and dark theme variants**

### Complete Setup Example

Here's how to properly set up your application root with all providers:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  ModularArchContextProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  DeploymentMode,
  type ModularArchConfig
} from 'mod-arch-core';
import { ThemeProvider, Theme } from 'mod-arch-kubeflow';
import App from './App';

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
        <ThemeProvider theme={Theme.MUI}>
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

When using `mod-arch-kubeflow`, the ThemeProvider supports Material-UI themes optimized for Kubeflow environments with proper branding and styling.

### Using the Context in Components

Once providers are set up, you can access the configuration and state throughout your application:

```typescript
import { useModularArchContext } from 'mod-arch-core';
import { useThemeContext } from 'mod-arch-kubeflow';

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

The core library supports various configuration options through the `ModularArchConfig` interface:

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

## Development

### Prerequisites

- Node.js >= 20.0
- npm >= 10.8

### Setup

```bash
git clone <repository-url>
cd modular-architecture-essentials
npm install
```

### Building Individual Packages

Each package can be built independently:

```bash
# Build core package
cd mod-arch-core
npm run build

# Build shared package  
cd mod-arch-shared
npm run build

# Build kubeflow package
cd mod-arch-kubeflow
npm run build
```

### Testing

Run tests for individual packages:

```bash
# Test core package
cd mod-arch-core
npm test

# Test shared package
cd mod-arch-shared  
npm test

# Test kubeflow package (type checking only)
cd mod-arch-kubeflow
npm run test:type-check
```

### Linting

```bash
# Lint core package
cd mod-arch-core
npm run test:lint

# Lint shared package
cd mod-arch-shared
npm run test:lint
```

## Migration Guide

If you're migrating from the previous single-package structure, here's how to update your imports:

### Before (Single Package)

```typescript
import { 
  ModularArchContextProvider,
  ThemeProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  DashboardSearchField,
  useNamespaces,
  DeploymentMode,
  Theme
} from 'mod-arch-shared';
```

### After (Modular Packages)

```typescript
// Core functionality
import {
  ModularArchContextProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  useNamespaces,
  DeploymentMode,
  type ModularArchConfig
} from 'mod-arch-core';

// Shared components
import {
  DashboardSearchField
} from 'mod-arch-shared';

// Kubeflow theming
import {
  ThemeProvider
} from 'mod-arch-kubeflow';
```

### Package Installation Updates

**Before:**

```bash
npm install mod-arch-shared
```

**After:**

```bash
npm install mod-arch-core mod-arch-shared mod-arch-kubeflow
```

## Contributing

We welcome contributions to the project. Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
