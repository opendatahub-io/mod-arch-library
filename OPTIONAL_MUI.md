# Optional MUI Support

This library now supports optional MUI (Material-UI) integration. You can use the library with either PatternFly (default) or MUI themes without requiring MUI dependencies for PatternFly-only projects.

## Using with PatternFly Only (No MUI required)

If you only need PatternFly theme, you can install and use the library without any MUI dependencies:

```bash
npm install mod-arch-shared
```

```jsx
import { ThemeProvider, Theme } from 'mod-arch-shared';
import { ApplicationsPage } from 'mod-arch-shared';

function App() {
  return (
    <ThemeProvider theme={Theme.Patternfly}>
      <ApplicationsPage />
    </ThemeProvider>
  );
}
```

## Using with MUI Theme

If you want to use the MUI theme, install the required MUI dependencies:

```bash
npm install mod-arch-shared @mui/material @emotion/react @emotion/styled
```

```jsx
import { ThemeProvider, Theme } from 'mod-arch-shared';
import { ApplicationsPage } from 'mod-arch-shared';

function App() {
  return (
    <ThemeProvider theme={Theme.MUI}>
      <ApplicationsPage />
    </ThemeProvider>
  );
}
```

## Migration Guide

If you're upgrading from a previous version where MUI was a hard dependency:

1. **No changes needed** if you're already using MUI theme - your existing code will work as before
2. **Remove MUI dependencies** if you're only using PatternFly theme:
   ```bash
   npm uninstall @mui/material @emotion/react @emotion/styled
   ```

## How It Works

The library uses conditional loading for MUI:

- When `Theme.MUI` is requested, the library checks if MUI packages are available
- If MUI is not installed, it logs a warning and falls back to PatternFly theme
- MUI theme styles are only loaded when MUI theme is active and MUI is available
- All PatternFly functionality works independently of MUI

## Package Dependencies

- **Required dependencies**: PatternFly packages, React, utility libraries
- **Optional peer dependencies**: `@mui/material`, `@emotion/react`, `@emotion/styled`

The MUI packages are marked as optional peer dependencies, so npm won't require them unless you explicitly install them.