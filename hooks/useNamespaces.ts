import * as React from 'react';
import { useFetchState, FetchState, FetchStateCallbackPromise } from '~/utilities/useFetchState';
import { Namespace } from '~/types';
import { getNamespaces } from '~/api/k8s';
import { DeploymentMode } from '~/utilities';
import { useModularArchContext } from './useModularArchContext';

const useNamespaces = (): FetchState<Namespace[]> => {
  const { BFF_API_VERSION, URL_PREFIX, deploymentMode } = useModularArchContext();
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
      if (!(deploymentMode === DeploymentMode.Standalone)) {
        return Promise.resolve([]);
      }
      return listNamespaces({
        ...opts,
      });
    },
    [listNamespaces, deploymentMode],
  );
  return useFetchState(callback, [], { initialPromisePurity: true });
};

export default useNamespaces;
