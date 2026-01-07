# Agent Configuration

This repository uses AI coding assistants to maintain code quality and consistency. The rules and guidelines are organized in the `.cursor/rules/` directory.

## Rule Organization

- **[patternfly-design-tokens.mdc](rules/patternfly-design-tokens.mdc)** - PatternFly design token usage and MUI theme integration
- **[scss-architecture.mdc](rules/scss-architecture.mdc)** - SCSS architecture patterns and best practices
- **[workflow.mdc](rules/workflow.mdc)** - Development workflow and decision trees

## Quick Reference

When working with styling in this project:

1. **Always check** `mod-arch-kubeflow/style/pf-tokens-SSOT.json` for PatternFly design tokens
2. **Reference** `mod-arch-kubeflow/style/MUI-default-theme-object.json` for MUI theme values
3. **Follow** the priority order: PF global tokens → PF component variables → Direct CSS (last resort)
4. **Use** `.mui-theme` scope for all PatternFly component overrides

## Documentation

- **PatternFly Tokens**: https://www.patternfly.org/tokens/all-patternfly-tokens/
- **MUI Theming**: https://mui.com/material-ui/customization/theming/
- **Repository**: https://github.com/opendatahub-io/mod-arch-library

## Compliance

All styling changes must follow the rules defined in `rules/`. Code reviewers should verify compliance with the design token usage guidelines before approving PRs.

