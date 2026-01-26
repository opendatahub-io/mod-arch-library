---
name: release-version
description: Prepare version bump PRs and releases for mod-arch-library. Use when the user asks to prepare a release, bump version, create a release PR, or publish packages.
---

# Release Version

Workflow for releasing new versions of mod-arch-library packages.

## Overview

The release process has two phases:
1. **Version Bump PR** - Update package versions, get PR merged
2. **GitHub Release** - Create release/tag to trigger npm publish

## Phase 1: Prepare Version Bump PR

### Step 1: Analyze Changes Since Last Release

```bash
# Get the last release tag
git describe --tags --abbrev=0

# List commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s (#%h)" --no-merges
```

### Step 2: Categorize Changes

Group commits into:
- **Features** (`feat:`) - New functionality
- **Bug Fixes** (`fix:`) - Bug fixes, style fixes
- **Internal** (`chore:`, `docs:`, `refactor:`) - Non-user-facing changes

### Step 3: Determine Semver Bump

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | **Major** (X.0.0) | API removal, breaking interface changes |
| New features (with or without fixes) | **Minor** (x.Y.0) | New hooks, new components, new exports |
| Only bug/style fixes | **Patch** (x.x.Z) | CSS fixes, bug fixes, no new features |

### Step 4: Calculate New Version

```bash
# Get current version
node -p "require('./package.json').version"
```

### Step 5: Generate PR Content

**DO NOT create the PR directly.** Provide the following for user review:

#### Branch Name

```text
bump-version-{NEW_VERSION}
```

#### PR Title

```text
Bump to version {NEW_VERSION}
```

#### PR Description Template
```markdown
## Description

Bump version from {OLD_VERSION} to {NEW_VERSION}

Unblocks:
- {Link to any dependent PRs in other repos, if applicable}

## Changes in this release

### Features
- {Feature description} (#{PR_NUMBER})

### Bug Fixes
- {Fix description} (#{PR_NUMBER})

### Internal
- {Internal change description} (#{PR_NUMBER})

## Merge criteria:

- [ ] The commits are squashed in a cohesive manner and have meaningful messages.
- [ ] Testing instructions have been added in the PR body (for PRs involving changes that are not immediately obvious).
- [ ] The developer has manually tested the changes and verified that the changes work
```

### Step 6: Files to Update

After user approves the version, **update the files but DO NOT commit or push**.

Provide the git commands for the user to run manually:

```bash
git checkout -b bump-version-{NEW_VERSION}
git add .
git commit -m "chore: bump version to {NEW_VERSION}"
git push -u origin bump-version-{NEW_VERSION}
```

Update these files:

| File | Field to Update |
|------|-----------------|
| `package.json` | `version` |
| `package-lock.json` | `version` (2 places: root and `packages[""]`) |
| `mod-arch-core/package.json` | `version` |
| `mod-arch-core/package-lock.json` | `version` (2 places) |
| `mod-arch-shared/package.json` | `version` |
| `mod-arch-shared/package-lock.json` | `version` (2 places) |
| `mod-arch-kubeflow/package.json` | `version` |
| `mod-arch-kubeflow/package-lock.json` | `version` (2 places) |
| `mod-arch-installer/package.json` | `version` |

**All packages get the same version number** (monorepo versioning).

---

## Phase 2: Create GitHub Release (After PR Merged)

Once the version bump PR is merged to `main`:

### Step 1: Provide Release Instructions

**DO NOT create the release directly.** Provide these instructions:

```markdown
## Create GitHub Release

1. Go to: https://github.com/opendatahub-io/mod-arch-library/releases/new
2. Click "Choose a tag" → Type `{NEW_VERSION}` (e.g., `1.5.0`, no `v` prefix) → "Create new tag on publish"
3. Target: `main`
4. Release title: `v{NEW_VERSION}` (e.g., `v1.5.0`, with `v` prefix)
5. Click "Generate release notes" to auto-generate the changelog
6. Review and edit if needed
7. Click "Publish release"

This triggers the `release.yml` workflow which publishes to npm.
```

### Step 2: Verify Publish

After release is created, verify:
- Check GitHub Actions for `release.yml` workflow success
- Verify on npm: https://www.npmjs.com/package/mod-arch-core

---

## Quick Reference

### Workflow Triggers

| Workflow | Trigger | Action |
|----------|---------|--------|
| `version-bump.yml` | Manual (Actions tab) | Auto-creates version bump PR |
| `release.yml` | GitHub Release created | Publishes to npm |
| `publish.yml` | Manual (Actions tab) | Publish individual packages |

### npm Scripts

```bash
npm run version:patch  # x.x.Z
npm run version:minor  # x.Y.0  
npm run version:major  # X.0.0
npm run publish:all    # Publish all packages
```
