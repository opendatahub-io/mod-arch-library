# Hooks

This directory contains React hooks for the mod-arch-core library, providing functionality for namespaces, settings, and API state management.

## useNamespaceSelector

A hook for managing namespace selection with optional persistence to browser storage.

### Basic Usage (without persistence)

```typescript
import { SimpleSelect } from '@patternfly/react-templates';
import { useNamespaceSelector } from 'mod-arch-core';

const MyComponent = () => {
  const {
    namespaces,
    namespacesLoaded,
    preferredNamespace,
    updatePreferredNamespace,
  } = useNamespaceSelector();

  if (!namespacesLoaded) {
    return <div>Loading namespaces...</div>;
  }

  const options = namespaces.map((namespace) => ({
    content: namespace.name,
    value: namespace.name,
    selected: namespace.name === preferredNamespace?.name,
  }));

  return (
    <SimpleSelect
      initialOptions={options}
      onSelect={(_event, selection) => updatePreferredNamespace({ name: String(selection) })}
    />
  );
};
```

### With Persistence (storeLastNamespace)

Enable `storeLastNamespace` to persist the selected namespace to browser storage. When enabled:
- The last used namespace is restored from localStorage on initialization (if valid)
- The selected namespace is automatically saved to localStorage when it changes

```typescript
import { useNamespaceSelector } from 'mod-arch-core';

const MyComponent = () => {
  const {
    namespaces,
    preferredNamespace,
    updatePreferredNamespace,
  } = useNamespaceSelector({
    storeLastNamespace: true,
  });

  // The preferredNamespace will be restored from localStorage
  // if available and still valid (exists in the namespaces list)
  // ...
};
```

### With Custom Storage Key

You can customize the localStorage key used for persistence:

```typescript
const { preferredNamespace, updatePreferredNamespace } = useNamespaceSelector({
  storeLastNamespace: true,
  storageKey: 'myApp.namespace.lastUsed', // Default: 'mod-arch.namespace.lastUsed'
});
```

### Clearing Stored Namespace

When persistence is enabled, you have two ways to clear the stored namespace:

```typescript
const { updatePreferredNamespace, clearStoredNamespace } = useNamespaceSelector({
  storeLastNamespace: true,
});

// Method 1: Pass undefined to updatePreferredNamespace
updatePreferredNamespace(undefined);
// • Clears the current namespace selection in the context
// • Also clears the stored namespace from localStorage
// • Effectively "resets" both the UI state and the persistence

// Method 2: Use dedicated clear function
clearStoredNamespace();
// • Only clears the stored namespace from localStorage
// • Leaves the current namespace selection in context unchanged
// • Useful for scenarios like "forget my preference" without changing current state
```

### API Reference

**Arguments:**

| Property             | Type      | Default                       | Description                                                                                                              |
|----------------------|-----------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `storeLastNamespace` | `boolean` | `false`                       | When true, persists the last used namespace to browser storage and restores it on initialization if valid.              |
| `storageKey`         | `string`  | `'mod-arch.namespace.lastUsed'` | Custom storage key for persisting the last used namespace. Only used when `storeLastNamespace` is true.                 |

**Return Value:**

| Property                  | Type                                    | Description                                                                                                                     |
|---------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| `namespaces`              | `Namespace[]`                           | List of available namespaces                                                                                                    |
| `namespacesLoaded`        | `boolean`                               | Whether namespaces have finished loading                                                                                        |
| `namespacesLoadError`     | `Error \| undefined`                    | Error if namespace loading failed                                                                                               |
| `preferredNamespace`      | `Namespace \| undefined`                | The currently selected namespace                                                                                                |
| `updatePreferredNamespace` | `(namespace: Namespace \| undefined) => void` | Function to update the selected namespace. When `storeLastNamespace` is enabled, passing `undefined` will clear the stored namespace. |
| `clearStoredNamespace`    | `() => void`                            | Function to explicitly clear the stored namespace from browser storage. Only effective when `storeLastNamespace` is enabled.   |
| `initializationError`     | `Error \| undefined`                    | Error during initialization                                                                                                     |
