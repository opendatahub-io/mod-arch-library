# AGENTS.md - mod-arch-kubeflow

This package provides Kubeflow-specific theming, styling, and Material UI integration for PatternFly components. This document provides guidance for AI agents and developers working on theming and styling in this package.

## Rule Organization

The detailed rules and guidelines are organized in the `.cursor/rules/` directory. **Read these before making any SCSS changes** — they define the token priority order, naming conventions, and architecture patterns that all overrides must follow.

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

## Form fields and the MUI theme

When the MUI theme is active, PatternFly form inputs must be wrapped to maintain parity with MUI's `TextField` structure. MUI's `TextField` renders an `<OutlinedInput>` which includes a `<fieldset>` and `<legend>` element. PatternFly inputs don't render this structure natively, so `FormFieldset` replicates it. Without this wrapper, form fields under the MUI theme will have native PatternFly borders and a stacked label. **Always use the shared components from `mod-arch-shared`** — never roll your own wrapper.

### Components that need a wrapper

| Component | When to use |
| --------------------------------- | ----------------------------------------------------------------- |
| `ThemeAwareFormGroupWrapper` | Any bordered input box: `TextInput`, `Select`, `TypeaheadSelect`, `MultiTypeaheadSelect`, etc. |
| `ThemeAwareFormGroupWrapper` with `skipFieldset` | `NumberInput` — the SCSS manages its own border; wrapping in `FormFieldset` would conflict with the floating label and border rules |
| `ThemeAwareSearchInput` | Search/filter inputs in toolbars and lists |
| `FormFieldset` directly | `TextArea` with `autoResize` — the textarea must expand freely inside the wrapper |

```tsx
import { ThemeAwareFormGroupWrapper, ThemeAwareSearchInput, FormFieldset } from 'mod-arch-shared';

// Standard form field
<ThemeAwareFormGroupWrapper label="Name" fieldId="name" isRequired>
  <TextInput id="name" value={name} onChange={...} />
</ThemeAwareFormGroupWrapper>

// Typeahead select — same wrapper as TextInput
<ThemeAwareFormGroupWrapper label="Secret" fieldId="secret-select">
  <TypeaheadSelect id="secret-select" ... />
</ThemeAwareFormGroupWrapper>

// Search input
<ThemeAwareSearchInput value={search} onChange={setSearch} fieldLabel="Search" />

// Auto-resizing TextArea — use FormFieldset directly so the wrapper expands with the content
const descriptionInput = <TextArea value={description} onChange={...} autoResize />;
{isMUITheme ? (
  <FormFieldset component={descriptionInput} field="Description" />
) : (
  descriptionInput
)}
```

### Components that do not need a wrapper

These components render their own visual affordances rather than a bordered input box — there is no `OutlinedInput`-style fieldset to replicate. The SCSS handles their MUI styling natively.

| Component | Reason |
| ----------- | ------- |
| `Switch` | Renders a pill toggle; the SCSS handles the shape via `--mui-switch--BorderRadius` |
| `Radio` | Renders a custom dot; the SCSS handles the styling natively |
| `Checkbox` | Renders a tick box; no text input border in MUI either |
| `FileUpload` | Has dedicated SCSS rules for its filename input and textarea; wrapping in `FormFieldset` would add a conflicting outer fieldset around a component with its own complex internal structure |

If you add a new bordered input without a wrapper under the MUI theme, the floating label and border will not match the MUI styles. Code reviewers must reject any PR that introduces bare bordered inputs without a wrapper.

### Helper text under the MUI theme

`ThemeAwareFormGroupWrapper` renders `helperTextNode` **after** the closing `</FormGroup>` when MUI is active. This mirrors MUI's own helper text placement, which sits outside the fieldset structure. Do not nest `HelperText` inside the wrapper's children — pass it via the `helperTextNode` prop instead.

```tsx
<ThemeAwareFormGroupWrapper
  label="Resource name"
  fieldId="resource-name"
  hasError={showWarning}
  helperTextNode={
    showWarning ? (
      <HelperText>
        <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
          The name does not match.
        </HelperTextItem>
      </HelperText>
    ) : null
  }
>
  <TextInput id="resource-name" value={value} onChange={...} validated={showWarning ? 'error' : 'default'} />
</ThemeAwareFormGroupWrapper>
```
