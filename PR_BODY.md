## Summary

Enhance mod-arch-installer and mod-arch-starter for optimal developer onboarding experience with parameterized module names, post-installation guidance, and improved code quality.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [x] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [x] Refactoring (no functional changes)
- [ ] Documentation update
- [x] CI/CD or tooling changes

## Related Issues

- Resolves: RHOAIENG-48897 (Parameterize module names)
- Resolves: RHOAIENG-48899 (Post-install checklist)

## Changes Made

### Task 1: npm Vulnerability Fixes & ESLint 9 Migration
- Migrated from ESLint 8 to ESLint 9 with flat config (`eslint.config.mjs`)
- Removed `cypress-mochawesome-reporter` (unnecessary dependency with vulnerabilities)
- Added `axios` override to fix vulnerability
- Deleted legacy `.eslintrc.cjs` and `.eslintignore`

### Task 2: Code Quality Improvements
- Fixed type-safe React context pattern in `AppContext.ts`
- Simplified `MainPage.tsx` by removing unnecessary variables
- Extracted Go server timeout constants in `main.go`
- Applied direct return pattern in `user.go`

### Task 3: Module Name Parameterization (RHOAIENG-48897)
- Added `--name <module-name>` CLI option
- Created `nameTransform.ts` for case transformations (kebab, camel, Pascal, Title, snake, UPPER_SNAKE)
- Created `templateReplacer.ts` for template string/file replacement
- Interactive prompt when `--name` not provided
- Automatic file renaming (e.g., `ModArchWrapper.tsx` → `{PascalCase}Wrapper.tsx`)

### Task 4: Post-Install Checklist (RHOAIENG-48899)
- Added `postInstall.ts` with flavor-specific guidance
- Default flavor: ODH Dashboard integration steps (feature flags, config, commands)
- Kubeflow flavor: Standalone development setup instructions
- Includes documentation links

## Testing

### How to Test

1. Build the installer:
   ```bash
   cd mod-arch-installer
   npm run build
   ```

2. Test module creation with parameterization:
   ```bash
   node dist/cli.js /tmp/test-module --name auto-rag --flavor default --skip-install --no-git
   ```

3. Verify replacements:
   ```bash
   grep -r "autoRag" /tmp/test-module/
   grep -r "mod-arch" /tmp/test-module/ --include="*.ts" | grep -v "mod-arch-core"
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Test Results

- [x] Unit tests pass (`npm test`)
- [x] Lint checks pass (`npm run lint`)
- [x] Build succeeds (`npm run build`)
- [x] Manual testing completed

## Checklist

- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated (if applicable)
- [x] No new warnings introduced
- [x] Changes are backwards compatible (or breaking changes are documented)

## Screenshots / Output

### Post-Install Checklist (Default Flavor)
```
[mod-arch-installer] Module created at /tmp/test-module

Next steps for ODH Dashboard integration:

Required:
  1. Add 'autoRagModule' feature flag to
     frontend/src/k8sTypes.ts

  2. Add default config to
     frontend/src/concepts/areas/const.ts

  3. Run 'npm install' at repo root

  4. Start with 'make dev-start-federated'

Optional:
  - Export types via package.json exports field
  - Configure parent area (e.g., gen-ai-studio)
  - Add navigation icon in AutoRagNavIcon.ts

Documentation:
  - https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/onboard-modular-architecture.md
  - https://github.com/opendatahub-io/mod-arch-library/tree/main/docs
```

## Additional Notes

- Remaining npm audit warnings are from ESLint plugin dependencies (minimatch, glob) which require upstream fixes
- The `mod-arch-core`, `mod-arch-kubeflow`, and `mod-arch-library` references are intentionally preserved as they are actual package/module names
