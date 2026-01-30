import { Namespace } from '~/types';
import { useModularArchContext } from './useModularArchContext';
import { useNamespacePersistence } from './useNamespacePersistence';

const DEFAULT_STORAGE_KEY = 'mod-arch.namespace.lastUsed';

export type UseNamespaceSelectorArgs = {
  storeLastNamespace?: boolean;
  storageKey?: string;
};

export type UseNamespaceSelectorReturn = {
  namespacesLoaded: boolean;
  namespacesLoadError?: Error;
  namespaces: Namespace[];
  preferredNamespace: Namespace | undefined;
  updatePreferredNamespace: (namespace: Namespace | undefined) => void;
  clearStoredNamespace: () => void;
  initializationError?: Error;
};

export const useNamespaceSelector = (
  args: UseNamespaceSelectorArgs = {},
): UseNamespaceSelectorReturn => {
  const { storeLastNamespace = false, storageKey = DEFAULT_STORAGE_KEY } = args;
  const context = useModularArchContext();

  const {
    namespacesLoaded,
    namespacesLoadError,
    namespaces,
    preferredNamespace: contextPreferredNamespace,
    updatePreferredNamespace: contextUpdatePreferredNamespace,
    initializationError,
  } = context;

  const { preferredNamespace, updatePreferredNamespace, clearStoredNamespace } =
    useNamespacePersistence({
      namespaces,
      contextPreferredNamespace,
      contextUpdatePreferredNamespace,
      storeLastNamespace,
      storageKey,
      namespacesLoaded,
    });

  return {
    namespacesLoaded,
    namespacesLoadError,
    namespaces,
    preferredNamespace,
    updatePreferredNamespace,
    clearStoredNamespace,
    initializationError,
  };
};
