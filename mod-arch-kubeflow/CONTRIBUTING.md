[contributing guidelines]: ../CONTRIBUTING.md
[AGENTS.md]: ./AGENTS.md
[patternfly-design-tokens]: .cursor/rules/patternfly-design-tokens.mdc
[scss-architecture]: .cursor/rules/scss-architecture.mdc
[workflow]: .cursor/rules/workflow.mdc

# Contributing to mod-arch-kubeflow

This package has theming and styling specifics that go beyond the repo-wide process. Start with the [contributing guidelines] for PR workflow, releases, and code style, then read below before working on theming or styles.

## Theming and styling

All styling decisions in this package follow a strict priority order and workflow. Before making changes:

1. Read [AGENTS.md] — covers the package structure, key files, and compliance requirements.
2. Follow the Cursor rules in `.cursor/rules/`:
   - [patternfly-design-tokens] — how to map PatternFly design tokens to MUI variables
   - [scss-architecture] — SCSS patterns and file organization
   - [workflow] — decision trees for choosing the right override approach

The core rule: **PatternFly variable first, then find the MUI equivalent — never the other way around.**

## Local development workflow

To test theming changes against a consuming app (e.g. notebooks UI):

1. Point the consuming app's `package.json` to your local copy of the package:

   ```json
   "mod-arch-kubeflow": "file:../../../../mod-arch-library/mod-arch-kubeflow"
   ```

   Adjust the path to match your local directory structure.

2. Install dependencies in the consuming app:

   ```bash
   npm install
   ```

3. After making style changes in this package, rebuild it:

   ```bash
   npm run build
   ```

4. Restart the consuming app's dev server to pick up the new build output.
