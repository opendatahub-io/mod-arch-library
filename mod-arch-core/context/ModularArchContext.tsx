import React, { createContext, useEffect, useState } from 'react';
import { ModularArchConfig, Namespace } from '~/types';
import { kubeflowScriptLoader, kubeflowNamespaceLoader } from '~/utilities';
import { useNamespacesWithConfig } from '~/hooks/useNamespaces';

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

export const ModularArchContextProvider: React.FC<ModularArchContextProviderProps> = ({
  children,
  config,
}) => {
  const { deploymentMode, mandatoryNamespace } = config;

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [preferredNamespace, setPreferredNamespace] = useState<Namespace | undefined>(undefined);
  const [initializationError, setInitializationError] = useState<Error>();

  // Namespace-related state
  const [unsortedNamespaces, isLoaded, error] = useNamespacesWithConfig(config);
  const namespaces = React.useMemo(
    () => unsortedNamespaces.toSorted((a: Namespace, b: Namespace) => a.name.localeCompare(b.name)),
    [unsortedNamespaces],
  );

  const firstNamespace = namespaces.length > 0 ? namespaces[0] : null;

  // Set preferred namespace based on mandatory namespace or first available namespace
  const defaultPreferredNamespace = React.useMemo(() => {
    if (mandatoryNamespace) {
      return { name: mandatoryNamespace };
    }
    return firstNamespace;
  }, [mandatoryNamespace, firstNamespace]);

  // Script loader for kubeflow integration
  useEffect(() => {
    kubeflowScriptLoader(
      deploymentMode,
      () => setScriptLoaded(true),
      (scriptError) => {
        // eslint-disable-next-line no-console
        console.error('Error loading kubeflow script:', scriptError);
        setScriptLoaded(true); // Still set to true to not block the UI
      },
    );
  }, [deploymentMode]);

  // Namespace selector for kubeflow integration
  useEffect(() => {
    // If mandatory namespace is set, don't use kubeflow namespace loader
    if (mandatoryNamespace) {
      return;
    }

    kubeflowNamespaceLoader(
      deploymentMode,
      scriptLoaded,
      (newNamespace: string) => {
        setPreferredNamespace({ name: newNamespace });
      },
      (err: Error) => {
        setInitializationError(err);
      },
      mandatoryNamespace,
    );
  }, [deploymentMode, scriptLoaded, mandatoryNamespace]);

  const contextValue = React.useMemo(
    () => ({
      config,
      namespacesLoaded: isLoaded,
      namespacesLoadError: error,
      namespaces,
      preferredNamespace: preferredNamespace ?? defaultPreferredNamespace ?? undefined,
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
      defaultPreferredNamespace,
      initializationError,
      scriptLoaded,
    ],
  );

  // Show loading spinner if script is not loaded yet
  if (!scriptLoaded) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return <ModularArchContext.Provider value={contextValue}>{children}</ModularArchContext.Provider>;
};
