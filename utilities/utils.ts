import { DeploymentMode, PlatformMode } from '~/utilities';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    centraldashboard: any;
  }
}

export const asEnumMember = <T extends object>(
  member: T[keyof T] | string | number | undefined | null,
  e: T,
): T[keyof T] | null => (isEnumMember(member, e) ? member : null);

export const isEnumMember = <T extends object>(
  member: T[keyof T] | string | number | undefined | unknown | null,
  e: T,
): member is T[keyof T] => {
  if (member != null) {
    return Object.entries(e)
      .filter(([key]) => Number.isNaN(Number(key)))
      .map(([, value]) => value)
      .includes(member);
  }
  return false;
};

/**
 * Utility function to load the Kubeflow dashboard script for integrated deployments
 * @param deploymentMode - The current deployment mode
 * @param platformMode - The current platform mode
 * @param onSuccess - Callback function to execute when script loads successfully
 * @param onError - Callback function to execute when script fails to load
 */
export const kubeflowScriptLoader = (
  deploymentMode: DeploymentMode,
  platformMode: PlatformMode,
  onSuccess: () => void,
  onError?: (error?: Error) => void,
): void => {
  const scriptUrl = '/dashboard_lib.bundle.js';

  // Only load script for integrated Kubeflow deployments
  if (
    !(deploymentMode === DeploymentMode.Integrated) ||
    !(platformMode === PlatformMode.Kubeflow)
  ) {
    // eslint-disable-next-line no-console
    console.warn('kubeflowScriptLoader: Script not loaded, only needed for kubeflow integration');
    onSuccess();
    return;
  }

  // Helper function to dynamically load a script
  const loadScript = (src: string, onLoad: () => void, onLoadError: () => void) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = onLoad;
    script.onerror = onLoadError;
    document.head.appendChild(script);
  };

  // Check if script exists before attempting to load it
  fetch(scriptUrl, { method: 'HEAD' })
    .then((response) => {
      if (response.ok) {
        loadScript(scriptUrl, onSuccess, () => {
          // eslint-disable-next-line no-console
          console.error('Failed to load the script');
          const error = new Error('Failed to load the script');
          onError?.(error);
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('Script not found');
        onSuccess();
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error checking script existence', err);
      onError?.(err);
    });
};

/**
 * Utility function to initialize Kubeflow namespace selection integration
 * @param deploymentMode - The current deployment mode
 * @param platformMode - The current platform mode
 * @param scriptLoaded - Whether the Kubeflow dashboard script is loaded
 * @param onNamespaceSelected - Callback function when a namespace is selected
 * @param onError - Callback function to execute when initialization fails
 * @param mandatoryNamespace - Optional mandatory namespace that disables selection
 * @returns boolean - Whether initialization was attempted
 */
export const kubeflowNamespaceLoader = (
  deploymentMode: DeploymentMode,
  platformMode: PlatformMode,
  scriptLoaded: boolean,
  onNamespaceSelected: (namespace: string) => void,
  onError?: (error: Error) => void,
  mandatoryNamespace?: string,
): boolean => {
  // Only initialize for integrated Kubeflow deployments with loaded script
  if (
    !(deploymentMode === DeploymentMode.Integrated) ||
    !(platformMode === PlatformMode.Kubeflow) ||
    !scriptLoaded
  ) {
    return false;
  }

  // Initialize the central dashboard client
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.centraldashboard.CentralDashboardEventHandler.init((cdeh: any) => {
      if (mandatoryNamespace) {
        // When mandatory namespace is set, ensure it's selected and disable selection
        onNamespaceSelected(mandatoryNamespace);
        // Disable namespace selection by overriding the handler
        // eslint-disable-next-line no-param-reassign
        cdeh.onNamespaceSelected = () => {
          // Ignore attempts to change namespace when mandatory namespace is set
          onNamespaceSelected(mandatoryNamespace);
        };
      } else {
        // Normal behavior - allow namespace selection
        // eslint-disable-next-line no-param-reassign
        cdeh.onNamespaceSelected = onNamespaceSelected;
      }
    });
    return true;
  } catch (err) {
    /* eslint-disable no-console */
    console.error('Failed to initialize central dashboard client', err);
    if (err instanceof Error && onError) {
      onError(err);
    }
    return false;
  }
};
