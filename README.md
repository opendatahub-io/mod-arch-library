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
