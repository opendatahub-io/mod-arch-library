---
name: review
description: Review code for design token violations, SCSS convention drift, and theme wrapper compliance. Compares source files against pf-tokens-SSOT.json, MUI-default-theme-object.json, and the project's styling rules. Use when the user asks to review code, audit styling, check token usage, or review a PR for convention compliance.
---

# Design Token & Convention Review

Audit source files against the project's design token SSOT files and styling conventions. Produces a structured report of violations with specific file locations and fixes.

## Inputs

The user may provide:

- **No arguments** — review all SCSS and TSX files under `mod-arch-kubeflow/` and `mod-arch-shared/`.
- **A file or directory path** — review only those files.
- **A PR number or branch** — review the diff (changed files only).

## Phase 1: Load reference data

Read these files into context. They are the sources of truth for the review.

1. `mod-arch-kubeflow/style/pf-tokens-SSOT.json` — all valid PF global tokens and component variables.
2. `mod-arch-kubeflow/style/MUI-default-theme-object.json` — MUI theme values; properties here are auto-available via `--mui-*` CSS variables from ThemeProvider and must NOT be redefined in SCSS.
3. `mod-arch-kubeflow/.cursor/rules/patternfly-design-tokens.mdc` — token priority rules.
4. `mod-arch-kubeflow/.cursor/rules/scss-architecture.mdc` — SCSS architecture patterns.
5. `mod-arch-kubeflow/.cursor/rules/workflow.mdc` — decision tree and form-field wrapper rules.
6. `mod-arch-kubeflow/AGENTS.md` — form-field wrapper component table and exceptions.

## Phase 2: Determine scope

| User input | Files to review |
|---|---|
| No arguments | All `*.scss` and `*.tsx` files under `mod-arch-kubeflow/` and `mod-arch-shared/` |
| File or directory path | Only the specified path(s) |
| PR number (`#N`) | Run `gh pr diff N` to get changed files and review only those matching `*.scss` or `*.tsx` |
| Branch name | Validate the branch ref matches `^[A-Za-z0-9._/][A-Za-z0-9._/-]*$` (anchored, no leading hyphens, no whitespace or shell metacharacters), then resolve it with `git rev-parse --verify <branch>` before use; if it resolves cleanly, run `git diff "main...<branch>" -- '*.scss' '*.tsx'` using the validated ref and review the changed files |

## Phase 3: Run checks

For each file in scope, run the following checks. Use Grep and Read tools to examine the actual source code.

### Check 1: Hardcoded values where tokens exist

Search SCSS files for hardcoded values that should use PF tokens:

- **Colors**: hex values (`#xxx`, `#xxxxxx`), `rgb()`, `rgba()`, named colors used as property values (not inside `var()` or comments). Exception: `rgba(0, 0, 0, X)` patterns used to define custom MUI variables at `:root` scope are acceptable when no MUI auto-available variable exists for that opacity.
- **Spacing**: bare `px`, `rem`, `em` values used for padding, margin, gap, or spacer properties where a `--pf-t--global--spacer--*` token exists.
- **Font sizes**: bare values for `font-size` where `--pf-t--global--font--size--*` tokens exist.
- **Border radius**: bare values where `--pf-t--global--border--radius--*` tokens exist.

For each finding, check `pf-tokens-SSOT.json` to suggest the correct token.

### Check 2: Global tokens set inside component selectors

Search for `--pf-t--global--` being set (not referenced) inside a selector other than `.mui-theme:root`. Global tokens must only be overridden at the `:root` level.

Pattern to flag:

```scss
.mui-theme .pf-v6-c-* {
  --pf-t--global--*: ...;  // VIOLATION
}
```

### Check 3: Missing `.mui-theme` scoping

Search for PF component class selectors (`.pf-v6-c-*`) or PF variable overrides (`--pf-v6-c-*`) that are NOT nested inside `.mui-theme`. Every override must be scoped.

### Check 4: Auto-available MUI variables redefined in SCSS

Cross-reference any `--mui-palette-*`, `--mui-typography-*`, `--mui-shape-*`, `--mui-spacing-*`, `--mui-shadows-*` variable definitions in SCSS against `MUI-default-theme-object.json`. If the variable maps to a standard theme property, it should NOT be defined in SCSS — it's already auto-available from `<MUIThemeProvider>`.

### Check 5: Component variables used where global tokens cascade

For each `--pf-v6-c-*` override in SCSS, check `pf-tokens-SSOT.json` to see if that component variable references a global token (`--pf-t--global--*`). If it does, and the global token is already overridden at `:root`, the component-level override may be redundant.

### Check 6: Direct CSS properties where PF variables exist

Search for direct CSS property assignments (e.g., `padding:`, `color:`, `background:`, `border:`, `font-size:`, `font-weight:`, `border-radius:`) in component selectors where PF component variables exist for that property. Cross-reference against `pf-tokens-SSOT.json`.

Exception: `position`, `display`, `flex-direction`, `letter-spacing`, `text-transform`, `overflow`, `visibility`, `z-index` (layout/descriptive properties) are acceptable as direct CSS.

### Check 7: Form-field wrapper compliance (TSX files)

Search TSX files for bordered form input components that should be wrapped:

- `<TextInput` without a parent `<ThemeAwareFormGroupWrapper`
- `<Select`, `<TypeaheadSelect`, `<MultiTypeaheadSelect` without wrapper
- `<NumberInput` without wrapper (should use `skipFieldset` prop)
- `<SearchInput` that should use `<ThemeAwareSearchInput` instead
- Ad-hoc inline `isMUITheme` conditionals (e.g., `{isMUITheme ? <A /> : <B />}`) used directly in consumer components to branch rendering for anything other than `<TextArea` with `autoResize`. Named wrapper components like `ThemeAwareFormGroupWrapper` and `ThemeAwareSearchInput` that encapsulate `isMUITheme` logic internally are exempt — those are the intended pattern

### Check 8: Inline styles in TSX with hardcoded values

Search TSX files for `style={{` or `style={` containing hardcoded pixel values, hex colors, or spacing values instead of `var(--pf-t--*)` references.

---

### mod-arch-shared specific checks

The following checks apply only to files under `mod-arch-shared/`.

### Check 9: Theme-aware component contract integrity

Review the canonical theme-aware wrapper components to verify their contract is maintained:

- **`ThemeAwareFormGroupWrapper.tsx`** must:
  - Read `isMUITheme` from `useThemeContext()` (not accept it as a prop)
  - Wrap children in `<FormFieldset>` when `isMUITheme` is true (unless `skipFieldset` is set)
  - Render `helperTextNode` **outside** `<FormGroup>` when `isMUITheme` is true
  - Pass through all PF `FormGroup` props

- **`ThemeAwareSearchInput.tsx`** must:
  - Read `isMUITheme` from `useThemeContext()`
  - Render `<FormFieldset>` with a `<TextInput>` when `isMUITheme` is true
  - Render `<SearchInput>` when `isMUITheme` is false
  - Support `fieldLabel` for the MUI fieldset legend

- **`FormFieldset.tsx`** must:
  - Render a `<fieldset>` with `aria-hidden="true"` and a `<legend>` matching MUI's `OutlinedInput` structure
  - Accept any `ReactNode` as `component`

Flag any changes that break these contracts (removed props, changed branching logic, missing `aria-hidden`, etc.).

### Check 10: Shared component SCSS using PF tokens

Search all SCSS files under `mod-arch-shared/` for the same hardcoded value patterns as Check 1, but with shared-specific context:

- Hardcoded colors in component SCSS (e.g., `SimpleSelect.scss`, `MarkdownView.scss`) should use PF semantic tokens or `--ai-*` project variables
- Hardcoded spacing should use `--pf-t--global--spacer--*` tokens
- PF component variable overrides should follow the same priority order as kubeflow SCSS (global tokens first)

## Phase 4: Generate report

Produce a structured report with the following format:

```md
## Design Token & Convention Review

### Summary
- Files reviewed: N
- Violations found: N
- By severity: N critical, N warning, N info

### Critical (must fix)
Violations that will cause visual inconsistency or break theme switching.

### Warning (should fix)
Violations that reduce maintainability or bypass the token cascade.

### Info (consider)
Suggestions for improvement that aren't strict violations.

---

For each violation:

**[SEVERITY] Check N: Description**
- File: `path/to/file.scss`
- Line: NN
- Found: `the problematic code`
- Expected: `the corrected code`
- Why: Brief explanation referencing the specific rule
```

### Severity classification

| Severity | Criteria |
|---|---|
| Critical | Hardcoded colors/spacing in component selectors; missing `.mui-theme` scope; bare bordered inputs without wrapper; theme-aware component contract broken |
| Warning | Redundant component variable overrides; global tokens in component selectors; auto-available MUI vars redefined; shared component SCSS hardcoded values |
| Info | Direct CSS where a PF variable probably exists but isn't in the SSOT file; minor style improvements |

## Phase 5: Suggest fixes

For each critical and warning violation, provide the exact replacement code. For example:

```text
Found:  padding: 16px;
Fix:    --pf-v6-c-card--PaddingBlockStart: var(--pf-t--global--spacer--md);
```

If there are no violations, confirm the files pass review and note any particularly well-structured patterns worth preserving.
