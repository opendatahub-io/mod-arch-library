import React, { createContext, useEffect, useState } from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { ModularArchConfig, Namespace } from '~/types';
import { DeploymentMode, PlatformMode } from '~/utilities';
import { useFetchState, FetchStateCallbackPromise } from '~/utilities/useFetchState';
import { getNamespaces } from '~/api/k8s';

export type ModularArchContextType = {
  config: ModularArchConfig;
  // Namespace-related properties
  namespacesLoaded: boolean;
  namespacesLoadError?: Error;
  namespaces: Namespace[];
  preferredNamespace: Namespace | undefined;
  updatePreferredNamespace: (namespace: Namespace | undefined) => void;
  initializationError?: Error;
  // Script loading state
  scriptLoaded: boolean;
};

type ModularArchContextProviderProps = {
  children: React.ReactNode;
  config: ModularArchConfig;
};

export const ModularArchContext = createContext<ModularArchContextType | undefined>(undefined);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    centraldashboard: any;
  }
}

const loadScript = (src: string, onLoad: () => void, onError: () => void) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.onload = onLoad;
  script.onerror = onError;
  document.head.appendChild(script);
};

export const ModularArchContextProvider: React.FC<ModularArchContextProviderProps> = ({
  children,
  config,
}) => {
  const { deploymentMode, platformMode } = config;

  // Script loading state
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Namespace-related state
  const modArchConfig = React.useMemo(
    () => ({
      BFF_API_VERSION: config.BFF_API_VERSION,
      URL_PREFIX: config.URL_PREFIX,
    }),
    [config.BFF_API_VERSION, config.URL_PREFIX],
  );

  const listNamespaces = React.useMemo(() => getNamespaces('', modArchConfig), [modArchConfig]);

  const callback = React.useCallback<FetchStateCallbackPromise<Namespace[]>>(
    (opts) => {
      if (!(deploymentMode === DeploymentMode.Standalone)) {
        return Promise.resolve([]);
      }
      return listNamespaces(opts);
    },
    [deploymentMode, listNamespaces],
  );

  const [unsortedNamespaces, isLoaded, error] = useFetchState<Namespace[]>(callback, []);
  const namespaces = React.useMemo(
    () => unsortedNamespaces.toSorted((a: Namespace, b: Namespace) => a.name.localeCompare(b.name)),
    [unsortedNamespaces],
  );
  const [preferredNamespace, setPreferredNamespace] = useState<Namespace | undefined>(undefined);
  const [initializationError, setInitializationError] = useState<Error>();

  const firstNamespace = namespaces.length > 0 ? namespaces[0] : null;

  // Script loader for kubeflow integration
  useEffect(() => {
    const scriptUrl = '/dashboard_lib.bundle.js';

    if (
      !(deploymentMode === DeploymentMode.Integrated) ||
      !(platformMode === PlatformMode.Kubeflow)
    ) {
      // eslint-disable-next-line no-console
      console.warn('ModularArchContext: Script not loaded, only needed for kubeflow integration');
      setScriptLoaded(true);
      return;
    }

    fetch(scriptUrl, { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          loadScript(
            scriptUrl,
            () => setScriptLoaded(true),
            // eslint-disable-next-line no-console
            () => console.error('Failed to load the script'),
          );
        } else {
          // eslint-disable-next-line no-console
          console.warn('Script not found');
          setScriptLoaded(true);
        }
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error('Error checking script existence', err));
  }, [deploymentMode, platformMode]);

  // Namespace selector for kubeflow integration
  useEffect(() => {
    if (
      deploymentMode === DeploymentMode.Integrated &&
      platformMode === PlatformMode.Kubeflow &&
      scriptLoaded
    ) {
      // Initialize the central dashboard client
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.centraldashboard.CentralDashboardEventHandler.init((cdeh: any) => {
          // eslint-disable-next-line no-param-reassign
          cdeh.onNamespaceSelected = (newNamespace: string) => {
            setPreferredNamespace({ name: newNamespace });
          };
        });
      } catch (err) {
        /* eslint-disable no-console */
        console.error('Failed to initialize central dashboard client', err);
        if (err instanceof Error) {
          setInitializationError(err);
        }
      }
    }
  }, [deploymentMode, platformMode, scriptLoaded]);

  const contextValue = React.useMemo(
    () => ({
      config,
      namespacesLoaded: isLoaded,
      namespacesLoadError: error,
      namespaces,
      preferredNamespace: preferredNamespace ?? firstNamespace ?? undefined,
      updatePreferredNamespace: setPreferredNamespace,
      initializationError,
      scriptLoaded,
    }),
    [
      config,
      isLoaded,
      error,
      namespaces,
      preferredNamespace,
      firstNamespace,
      initializationError,
      scriptLoaded,
    ],
  );

  // Show loading spinner if script is not loaded yet
  if (!scriptLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return <ModularArchContext.Provider value={contextValue}>{children}</ModularArchContext.Provider>;
};
