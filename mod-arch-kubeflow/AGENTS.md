# AGENTS.md - mod-arch-kubeflow

This package provides Kubeflow-specific theming, styling, and Material UI integration for PatternFly components. This document provides guidance for AI agents and developers working on theming and styling in this package.

## Rule Organization

The detailed rules and guidelines are organized in the `.cursor/rules/` directory:

- **[patternfly-design-tokens.mdc](.cursor/rules/patternfly-design-tokens.mdc)** - PatternFly design token usage and MUI theme integration
- **[scss-architecture.mdc](.cursor/rules/scss-architecture.mdc)** - SCSS architecture patterns and best practices
- **[workflow.mdc](.cursor/rules/workflow.mdc)** - Development workflow and decision trees

## Quick Reference

When working with styling in this package:

1. **Always check** `style/pf-tokens-SSOT.json` for PatternFly design tokens
2. **Reference** `style/MUI-default-theme-object.json` for MUI theme values
3. **Follow** the priority order: PF global tokens → PF component variables → Direct CSS (last resort)
4. **Use** `.mui-theme` scope for all PatternFly component overrides

## Documentation

- **PatternFly Tokens**: <https://www.patternfly.org/tokens/all-patternfly-tokens/>
- **MUI Theming**: <https://mui.com/material-ui/customization/theming/>
- **Repository**: <https://github.com/opendatahub-io/mod-arch-library>

## Package Structure

```
mod-arch-kubeflow/
├── AGENTS.md                          # This file
├── .cursor/
│   └── rules/                         # Cursor rules for theming
│       ├── patternfly-design-tokens.mdc
│       ├── scss-architecture.mdc
│       └── workflow.mdc
├── style/                             # Theming files
│   ├── MUI-theme.scss                 # Main SCSS file with PF overrides
│   ├── MUI-default-theme-object.json  # MUI theme reference
│   └── pf-tokens-SSOT.json           # PatternFly tokens (SSOT)
├── context/                           # Theme context provider
├── hooks/                             # Theme hooks
└── utilities/                         # Kubeflow-specific utilities
```

## Compliance

All styling changes must follow the rules defined in `.cursor/rules/`. Code reviewers should verify compliance with the design token usage guidelines before approving PRs.

