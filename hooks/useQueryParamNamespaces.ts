import { useDeepCompareMemoize } from '~/utilities/useDeepCompareMemoize';
import { useNamespaceSelector } from './useNamespaceSelector';

export const useQueryParamNamespaces = (): Record<string, unknown> => {
  const { preferredNamespace: namespaceSelector } = useNamespaceSelector();
  // When mandatoryNamespace is set in config, preferredNamespace will be that mandatory namespace
  const namespace = namespaceSelector?.name;

  return useDeepCompareMemoize({ namespace });
};
