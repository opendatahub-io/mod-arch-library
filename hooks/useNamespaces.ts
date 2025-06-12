import * as React from 'react';
import { useFetchState, FetchState, FetchStateCallbackPromise } from '~/utilities/useFetchState';
import { Namespace, ModularArchConfig } from '~/types';
import { getNamespaces } from '~/api/k8s';
import { DeploymentMode, PlatformMode } from '~/utilities';
import { useModularArchContext } from './useModularArchContext';

// Create a version that accepts config directly (for use in context provider)
export const useNamespacesWithConfig = (config: ModularArchConfig): FetchState<Namespace[]> => {
  const { BFF_API_VERSION, URL_PREFIX, deploymentMode, platformMode, mandatoryNamespace } = config;
  const modArchConfig = React.useMemo(
    () => ({
      BFF_API_VERSION,
      URL_PREFIX,
    }),
    [BFF_API_VERSION, URL_PREFIX],
  );
  const listNamespaces = React.useMemo(() => getNamespaces('', modArchConfig), [modArchConfig]);
  const callback = React.useCallback<FetchStateCallbackPromise<Namespace[]>>(
    (opts) => {
      // If mandatory namespace is set, return only that namespace
      if (mandatoryNamespace) {
        return Promise.resolve([{ name: mandatoryNamespace }]);
      }

      if (deploymentMode !== DeploymentMode.Standalone && platformMode === PlatformMode.Kubeflow) {
        return Promise.resolve([]);
      }
      return listNamespaces({
        ...opts,
      });
    },
    [deploymentMode, platformMode, listNamespaces, mandatoryNamespace],
  );
  return useFetchState(callback, [], { initialPromisePurity: true });
};

// Regular hook that uses context (for use in components)
const useNamespaces = (): FetchState<Namespace[]> => {
  const { config } = useModularArchContext();
  return useNamespacesWithConfig(config);
};

export default useNamespaces;
