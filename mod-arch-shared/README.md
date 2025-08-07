# mod-arch-shared

Shared UI components and utilities for modular architecture micro-frontend projects.

## Installation

```bash
npm install mod-arch-shared sass sass-loader
```

## Peer Dependencies

- `react` (>=16.8.0)
- `react-dom` (>=16.8.0)

Note: This package includes PatternFly components and requires SASS processing capabilities in your build system.

## Usage

```typescript
import {
  DashboardSearchField,
  DashboardModalFooter,
  SimpleSelect,
  MarkdownView,
  images
} from 'mod-arch-shared';
```

## What's Included

- **Components**: Common UI components like search fields, modals, tables, and form elements
- **Utilities**: Shared utility functions for UI interactions
- **Images**: Common image assets and icons
- **Types**: Shared TypeScript type definitions

## SASS/SCSS Requirements

This package contains SCSS files that need to be processed by your build system. Most modern build tools (Create React App, Vite, etc.) support SASS out of the box when you install the `sass` package.

## Documentation

For detailed documentation, visit the [main repository](https://github.com/opendatahub-io/mod-arch-library).

## License

Apache-2.0
