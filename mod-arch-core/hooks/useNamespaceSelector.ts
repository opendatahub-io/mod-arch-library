import { Namespace } from '~/types';
import { useModularArchContext } from './useModularArchContext';

export const useNamespaceSelector = (): {
  namespacesLoaded: boolean;
  namespacesLoadError?: Error;
  namespaces: Namespace[];
  preferredNamespace: Namespace | undefined;
  updatePreferredNamespace: (namespace: Namespace | undefined) => void;
  initializationError?: Error;
} => {
  const context = useModularArchContext();

  return {
    namespacesLoaded: context.namespacesLoaded,
    namespacesLoadError: context.namespacesLoadError,
    namespaces: context.namespaces,
    preferredNamespace: context.preferredNamespace,
    updatePreferredNamespace: context.updatePreferredNamespace,
    initializationError: context.initializationError,
  };
};
