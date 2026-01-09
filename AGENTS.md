# AGENTS.md - Modular Architecture Library

This document provides guidance for AI agents and developers working on the mod-arch-library monorepo.

## Repository Overview

The Modular Architecture Essentials project provides libraries for building scalable micro-frontend applications. This is a **monorepo** with npm workspaces containing four packages:

| Package              | Description                                                     | Key Technologies                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------- |
| `mod-arch-core`      | Core functionality, API utilities, context providers, and hooks | React, TypeScript                |
| `mod-arch-shared`    | Shared UI components and utilities for upstream applications    | React, PatternFly v6, TypeScript |
| `mod-arch-kubeflow`  | Kubeflow-specific themes, styling, and MUI integration          | React, Material UI v7, SCSS      |
| `mod-arch-installer` | CLI installer for bootstrapping mod-arch-starter projects       | Node.js, Commander               |

**Note**: The `mod-arch-starter` directory within this repo has its own rules and should be treated as a separate project.

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

# PatternFly Design Token Usage Rules

## Critical: Value Priority Order

When adding ANY styling override, follow this strict priority order:

1. **FIRST**: Check if a PF global token (`--pf-t--global--*`) exists
   - Look in `pf-tokens-SSOT.json` or PatternFly documentation
   - If found → Map it to a MUI variable at `.mui-theme:root` (affects ALL components)

2. **SECOND**: Check if a PF component variable (`--pf-v6-c-{component}--*`) exists
   - Inspect the DOM element or check PatternFly component documentation
   - If found → Map it to a MUI variable in the component section

3. **THIRD**: Determine the MUI value to use
   - **Option A**: Check `MUI-default-theme-object.json` for the equivalent value
     - If it's a standard theme property → **Use auto-available MUI variable** (from `<MUIThemeProvider>`)
     - If it's computed/custom → **Define a custom MUI variable** in SCSS
   - **Option B**: Inspect the DOM to see what MUI uses for this component
   - Map the MUI variable to the PF variable you identified in steps 1 or 2

4. **LAST RESORT**: Use hardcoded CSS (only when no PF variable exists)
   - Example: layout properties like `position`, `display`, etc.

**Key Principle**: Find the PF variable first, then determine the MUI value to map to it!

## Design Token Reference

When working with styling (CSS, SCSS, or JavaScript/TypeScript theming), reference these files:

- **MUI Theme Values**: `mod-arch-kubeflow/style/MUI-default-theme-object.json` - CHECK THIS FIRST for all values
- **PF Design Tokens**: `mod-arch-kubeflow/style/pf-tokens-SSOT.json` - Single Source of Truth (SSOT) for all PatternFly v6 design tokens
- **Token Values**: https://www.patternfly.org/tokens/all-patternfly-tokens/ - Official PatternFly documentation showing computed values for all tokens

## Project-Specific Pattern: MUI-theme.scss Architecture

This project follows a specific pattern for styling PatternFly components to match Material UI design:

### Architecture Overview

```scss
// 1. Define MUI design values as custom variables (top of file)
.mui-theme:root {
  --mui-button-FontWeight: 500;
  --mui-button--PaddingBlockStart: 6px;
  --mui-spacing-8px: var(--mui-spacing);

  // 2. Override PF global tokens with MUI equivalents (affects ALL components)
  --pf-t--global--border--width--regular: 1px;
  --pf-t--global--color--brand--default: var(--mui-palette-primary-main);
  --pf-t--global--text--color--brand--default: var(--mui-palette-primary-main);
}

// 3. Only override component variables when they need different values from globals
.mui-theme .pf-v6-c-button {
  --pf-v6-c-button--FontWeight: var(--mui-button-FontWeight);
  --pf-v6-c-button--PaddingBlockStart: var(--mui-button--PaddingBlockStart);
}
```

### Hierarchy of Variable Usage (Priority Order)

**MOST EFFICIENT: Override PF global tokens at :root (affects all components automatically)**

**ALWAYS check MUI-default-theme-object.json FIRST for values!**

1. **First Priority: Override PF Global Tokens at :root**

   ```scss
   .mui-theme:root {
     // Step 1: Use auto-available MUI variables from ThemeProvider
     // (These already exist from <MUIThemeProvider> - don't redefine)
     --pf-t--global--color--brand--default: var(--mui-palette-primary-main);
     --pf-t--global--border--color--default: var(--mui-palette-divider);

     // Step 2: Only define custom MUI variables when needed
     --mui-custom-spacing: 6px; // Custom: computed value not in theme
     --pf-t--global--border--width--regular: var(--mui-custom-spacing);
   }
   ```

   **Why**: One override affects all components. Scalable and efficient.

2. **Second Priority: Use PF Component Variables (only when different from global)**

   ```scss
   // At top of file - only define custom MUI variables
   .mui-theme:root {
     --mui-button--PaddingBlockStart: 6px; // Custom: computed from spacing
   }

   // In component section - use both auto-available and custom MUI variables
   .mui-theme .pf-v6-c-button {
     // Use auto-available MUI variable (don't define it)
     --pf-v6-c-button--FontWeight: var(--mui-typography-fontWeightMedium);

     // Use custom MUI variable (defined above)
     --pf-v6-c-button--PaddingBlockStart: var(--mui-button--PaddingBlockStart);
   }
   ```

3. **Third Priority: Direct CSS (only when no PF token/variable exists)**
   ```scss
   .mui-theme .pf-v6-c-form {
     position: relative; // No PF variable for this
     letter-spacing: 0.02857em; // MUI-specific, no PF equivalent
   }
   ```

### Critical Rules

**DON'T** use direct CSS properties when PF variables exist:

```scss
.mui-theme .pf-v6-c-button {
  padding: 6px 16px; // BAD
  border: none; // BAD
}
```

**DO** use PF component variables or tokens:

```scss
.mui-theme .pf-v6-c-button {
  --pf-v6-c-button--PaddingBlockStart: var(
    --mui-button--PaddingBlockStart
  ); // GOOD
}
```

**DON'T** forget `.mui-theme` scope:

```scss
.pf-v6-c-button {
  --pf-v6-c-button--FontWeight: 500; // BAD - not scoped
}
```

**DO** always scope to `.mui-theme`:

```scss
.mui-theme .pf-v6-c-button {
  --pf-v6-c-button--FontWeight: var(--mui-button-FontWeight); // GOOD
}
```

### Token Categories Available in pf-tokens-SSOT.json

- **Colors**: `--pf-t--global--color--*`
- **Spacing**: `--pf-t--global--spacer--*`
- **Typography**: `--pf-t--global--font--*`
- **Borders**: `--pf-t--global--border--*`
- **Shadows**: `--pf-t--global--box-shadow--*`
- **Z-index**: `--pf-t--global--z-index--*`
- **Motion**: `--pf-t--global--motion--*`
- **Component-specific**: `--pf-v6-c-{component}--*`

### PatternFly Variable Naming Patterns

#### PF Component Variables (Use These First!)

```scss
// Pattern: --pf-v6-c-{component}--{property}--{modifier}
--pf-v6-c-button--FontWeight
--pf-v6-c-button--PaddingBlockStart
--pf-v6-c-button--hover--BackgroundColor
--pf-v6-c-alert--PaddingInlineStart
--pf-v6-c-menu-toggle--expanded--Color
```

#### PF Global Tokens (Use When Component Variables Don't Exist)

```scss
/* Brand colors */
--pf-t--global--color--brand--default
--pf-t--global--color--brand--hover
--pf-t--global--color--brand--clicked

/* Status colors */
--pf-t--global--color--status--danger--default
--pf-t--global--color--status--warning--default
--pf-t--global--color--status--success--default

/* Text colors */
--pf-t--global--text--color--regular
--pf-t--global--text--color--subtle
--pf-t--global--text--color--disabled

/* Background colors */
--pf-t--global--background--color--primary--default
--pf-t--global--background--color--secondary--default
```

#### Spacing

```css
--pf-t--global--spacer--xs     /* 4px */
--pf-t--global--spacer--sm     /* 8px */
--pf-t--global--spacer--md     /* 16px */
--pf-t--global--spacer--lg     /* 24px */
--pf-t--global--spacer--xl     /* 32px */
```

#### Borders

```css
--pf-t--global--border--width--regular
--pf-t--global--border--width--strong
--pf-t--global--border--color--default
--pf-t--global--border--radius--small
--pf-t--global--border--radius--medium
--pf-t--global--border--radius--large
```

## MUI Variables Available from ThemeProvider

**IMPORTANT**: Most MUI variables are **automatically available** via `<MUIThemeProvider theme={createMUITheme}>` and **DO NOT** need to be defined in SCSS.

### Variables Already Available (DO NOT redefine these)

```scss
// CORRECT - Use directly without defining
.mui-theme .pf-v6-c-card {
  --pf-v6-c-card--BorderColor: var(--mui-palette-divider); // Already exists!
  --pf-v6-c-card--BackgroundColor: var(
    --mui-palette-background-paper
  ); // Already exists!
}
```

**Available MUI variables from ThemeProvider**:

- `--mui-palette-*` (all palette colors: primary, secondary, error, text, grey, etc.)
- `--mui-typography-*` (font families, weights, sizes)
- `--mui-spacing-*` (spacing multipliers)
- `--mui-shape-*` (border radius, etc.)
- `--mui-shadows-*` (elevation shadows)

### When to Define Custom MUI Variables

**ONLY** define custom `--mui-*` variables when:

1. The value doesn't exist in the MUI theme
2. You need a computed/derived value
3. You need a component-specific customization

```scss
.mui-theme:root {
  // Custom computed values (not in MUI theme)
  --mui-button--PaddingBlockStart: 6px; // spacing(0.75) - custom computation
  --mui-card--BorderWidth: 1px; // Custom: card border width not in theme
}
```

## Quick Decision Tree for Adding Overrides

```
Need to add styling/override for a component?
│
├─ Step 1: Check if PF global token exists (--pf-t--global--*)
│  │        Look in pf-tokens-SSOT.json or PF docs
│  │
│  └─ YES → Find MUI equivalent value
│     │     • Check MUI-default-theme-object.json OR inspect DOM
│     │     • Is it standard theme property? Use auto-available var
│     │     • Is it custom/computed? Define custom MUI var
│     └─ This affects ALL components - MOST EFFICIENT!
│
├─ Step 2: Check if PF component variable exists (--pf-v6-c-{component}--*)
│  │        Inspect DOM element or check PF component docs
│  │
│  └─ YES → Find MUI equivalent value and map it
│
├─ Step 3: Is it a layout/positioning/descriptive property?
│  └─ YES → Direct CSS is acceptable (document with comment)
│
└─ Step 4: Last resort - hardcoded value
   Document why with a comment
```

## Code Review Checklist for Styling

Before submitting styling changes, verify:

- [ ] No hardcoded color values (use PF color tokens)
- [ ] No hardcoded spacing values (use PF spacer tokens or theme.spacing())
- [ ] Border styles use PF border tokens
- [ ] Interactive states (hover, active, focus) use appropriate token variants
- [ ] Typography uses PF font tokens
- [ ] All tokens referenced exist in `pf-tokens-SSOT.json`
- [ ] All overrides are scoped to `.mui-theme`

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
- [PatternFly Tokens Reference](https://www.patternfly.org/tokens/all-patternfly-tokens/)
- [Material UI Theming](https://mui.com/material-ui/customization/theming/)
