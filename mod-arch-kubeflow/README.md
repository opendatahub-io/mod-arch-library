# mod-arch-kubeflow

Kubeflow-specific theme and UI components for modular architecture micro-frontend projects.

## Installation

```bash
npm install mod-arch-kubeflow @mui/material sass sass-loader
```

## Peer Dependencies

- `react` (>=16.8.0)
- `@mui/material` (^7.0.0)

## Usage

```typescript
import {
  ThemeProvider,
  useThemeContext,
  style,
  images,
  Theme
} from 'mod-arch-kubeflow';

// In your app root
<ThemeProvider theme={Theme.MUI}>
  <App />
</ThemeProvider>
```

## What's Included

- **Context providers**: Theme context provider for Kubeflow styling
- **Hooks**: Theme management hooks
- **Styles**: Kubeflow-specific SCSS and CSS files
- **Images**: Kubeflow branding assets (logos, icons)
- **Utilities**: Kubeflow-specific constants and helpers

## Theme Support

This package provides Material-UI themes optimized for Kubeflow environments with proper branding and styling, including support for both light and dark variants.

## Documentation

For detailed documentation, visit the [main repository](https://github.com/opendatahub-io/mod-arch-library).

## License

Apache-2.0
