import { useDeepCompareMemoize } from '~/utilities/useDeepCompareMemoize';
import { useNamespaceSelector } from './useNamespaceSelector';

export const useQueryParamNamespaces = (): Record<string, unknown> => {
  const { preferredNamespace: namespaceSelector } = useNamespaceSelector();
  const namespace = namespaceSelector?.name;

  return useDeepCompareMemoize({ namespace });
};
