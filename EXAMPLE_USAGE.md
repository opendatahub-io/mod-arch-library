# Example: Using mod-arch-shared without MUI

This example demonstrates how to use specific components from mod-arch-shared without requiring MUI dependencies.

## Before (with MUI dependency issues)

```typescript
// This would require MUI dependencies even if you only needed PatternFly
import ApplicationsPage from 'mod-arch-shared/dist/components/ApplicationsPage';
```

## After (with optional MUI)

```typescript
// Option 1: Import from the main package (recommended)
import { ApplicationsPage, ThemeProvider, Theme } from 'mod-arch-shared';

function App() {
  return (
    <ThemeProvider theme={Theme.Patternfly}>
      <ApplicationsPage />
    </ThemeProvider>
  );
}

// Option 2: Direct component import (still works)
import ApplicationsPage from 'mod-arch-shared/dist/components/ApplicationsPage';
// This now works without MUI dependencies!

// Option 3: Use with MUI theme (requires optional dependencies)
import { ApplicationsPage, ThemeProvider, Theme } from 'mod-arch-shared';
// npm install @mui/material @emotion/react @emotion/styled

function AppWithMUI() {
  return (
    <ThemeProvider theme={Theme.MUI}>
      <ApplicationsPage />
    </ThemeProvider>
  );
}
```

## Package.json for Non-MUI Project

```json
{
  "dependencies": {
    "mod-arch-shared": "^0.1.8",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

No MUI packages required! The library will work with PatternFly theme only.

## Package.json for MUI Project

```json
{
  "dependencies": {
    "mod-arch-shared": "^0.1.8",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@mui/material": "^6.1.7",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.13.5"
  }
}
```

Both themes available, automatically detected based on installed packages.