import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Namespace } from '~/types';
import { useBrowserStorage } from '~/context';

export type UseNamespacePersistenceArgs = {
  namespaces: Namespace[];
  contextPreferredNamespace: Namespace | undefined;
  contextUpdatePreferredNamespace: (namespace: Namespace | undefined) => void;
  storeLastNamespace: boolean;
  storageKey: string;
  namespacesLoaded: boolean;
};

export type UseNamespacePersistenceReturn = {
  preferredNamespace: Namespace | undefined;
  updatePreferredNamespace: (namespace: Namespace | undefined) => void;
  clearStoredNamespace: () => void;
};

/**
 * Persist namespace preference with a two-phase flow:
 * restore once after namespaces load, then track changes.
 */
export const useNamespacePersistence = ({
  namespaces,
  contextPreferredNamespace,
  contextUpdatePreferredNamespace,
  storeLastNamespace,
  storageKey,
  namespacesLoaded,
}: UseNamespacePersistenceArgs): UseNamespacePersistenceReturn => {
  const [lastUsedNamespace, setLastUsedNamespace] = useBrowserStorage<string>(
    storageKey,
    '',
    true,
    false,
  );

  const isInitializedRef = useRef(false);
  const previousPreferredNamespaceRef = useRef<string | undefined>(undefined);

  const namespaceNames = useMemo(() => namespaces.map((ns) => ns.name), [namespaces]);

  const preferredNamespace = useMemo(() => {
    if (!storeLastNamespace) {
      return contextPreferredNamespace;
    }

    if (lastUsedNamespace && namespaceNames.includes(lastUsedNamespace)) {
      const matchedNamespace = namespaces.find((namespace) => namespace.name === lastUsedNamespace);
      if (matchedNamespace) {
        return matchedNamespace;
      }
    }

    return contextPreferredNamespace;
  }, [
    storeLastNamespace,
    contextPreferredNamespace,
    lastUsedNamespace,
    namespaceNames,
    namespaces,
  ]);

  const updatePreferredNamespace = useCallback(
    (namespace: Namespace | undefined) => {
      contextUpdatePreferredNamespace(namespace);

      if (storeLastNamespace) {
        setLastUsedNamespace(namespace?.name ?? '');
      }
    },
    [contextUpdatePreferredNamespace, storeLastNamespace, setLastUsedNamespace],
  );

  const clearStoredNamespace = useCallback(() => {
    if (storeLastNamespace) {
      setLastUsedNamespace('');
    }
  }, [storeLastNamespace, setLastUsedNamespace]);

  // Initialization: restore stored namespace once after load.
  useEffect(() => {
    if (!storeLastNamespace || isInitializedRef.current || !namespacesLoaded) {
      return;
    }

    isInitializedRef.current = true;

    const storedNamespace =
      lastUsedNamespace && namespaceNames.includes(lastUsedNamespace)
        ? namespaces.find((namespace) => namespace.name === lastUsedNamespace)
        : undefined;

    if (storedNamespace) {
      previousPreferredNamespaceRef.current = storedNamespace.name;
      contextUpdatePreferredNamespace(storedNamespace);
    } else {
      const fallbackNamespace = contextPreferredNamespace?.name || '';
      if (fallbackNamespace) {
        previousPreferredNamespaceRef.current = fallbackNamespace;
        setLastUsedNamespace(fallbackNamespace);
      }
    }
  }, [
    storeLastNamespace,
    namespacesLoaded,
    lastUsedNamespace,
    namespaceNames,
    namespaces,
    contextPreferredNamespace?.name,
    contextUpdatePreferredNamespace,
    setLastUsedNamespace,
  ]);

  // Persistence: track changes after initialization.
  useEffect(() => {
    if (!storeLastNamespace || !isInitializedRef.current) {
      return;
    }

    const currentPreferredName = contextPreferredNamespace?.name;
    const previousPreferredName = previousPreferredNamespaceRef.current;

    if (currentPreferredName !== previousPreferredName && currentPreferredName) {
      previousPreferredNamespaceRef.current = currentPreferredName;
      setLastUsedNamespace(currentPreferredName);
    }
  }, [storeLastNamespace, contextPreferredNamespace?.name, setLastUsedNamespace]);

  return {
    preferredNamespace,
    updatePreferredNamespace,
    clearStoredNamespace,
  };
};
