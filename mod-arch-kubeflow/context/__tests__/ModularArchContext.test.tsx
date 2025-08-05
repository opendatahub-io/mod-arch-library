import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ModularArchContext, ModularArchContextProvider } from '~/context/ModularArchContext';
import { DeploymentMode } from '~/utilities';
import { ModularArchConfig } from '~/types';
import * as useFetchStateModule from '~/utilities/useFetchState';

// Mock the utilities
jest.mock('~/utilities/useFetchState');
jest.mock('~/api/k8s');

const mockUseFetchState = useFetchStateModule.useFetchState as jest.MockedFunction<
  typeof useFetchStateModule.useFetchState
>;

const mockNamespaces = [{ name: 'namespace-2' }, { name: 'namespace-3' }, { name: 'namespace-1' }];

const createMockConfig = (
  deploymentMode: DeploymentMode = DeploymentMode.Standalone,
  mandatoryNamespace?: string,
): ModularArchConfig => ({
  deploymentMode,
  URL_PREFIX: 'model-registry',
  BFF_API_VERSION: 'v1',
  ...(mandatoryNamespace && { mandatoryNamespace }),
});

describe('ModularArchContext', () => {
  const TestConsumer = () => {
    const context = React.useContext(ModularArchContext);
    if (!context) {
      return <div data-testid="no-context">No context</div>;
    }

    const {
      config,
      namespaces,
      namespacesLoaded,
      namespacesLoadError,
      preferredNamespace,
      initializationError,
      scriptLoaded,
    } = context;

    return (
      <div>
        <div data-testid="deployment-mode">{config.deploymentMode}</div>
        <div data-testid="loading-state">{namespacesLoaded.toString()}</div>
        <div data-testid="error-state">{namespacesLoadError?.message || 'no-error'}</div>
        <div data-testid="init-error">{initializationError?.message || 'no-init-error'}</div>
        <div data-testid="namespaces">{namespaces.map((ns) => ns.name).join(',')}</div>
        <div data-testid="preferred">{preferredNamespace?.name || 'none'}</div>
        <div data-testid="script-loaded">{scriptLoaded.toString()}</div>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global window.centraldashboard
    delete global.window.centraldashboard;
    // Mock fetch for script loading
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should provide initial empty state for standalone deployment', async () => {
    mockUseFetchState.mockReturnValue([[], true, undefined, jest.fn()]);

    const config = createMockConfig();

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    expect(screen.getByTestId('deployment-mode')).toHaveTextContent('standalone');
    expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
    expect(screen.getByTestId('namespaces')).toHaveTextContent('');
    expect(screen.getByTestId('preferred')).toHaveTextContent('none');
    expect(screen.getByTestId('script-loaded')).toHaveTextContent('true');
  });

  it('should load namespaces and set first namespace as preferred', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    const config = createMockConfig();

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
    expect(screen.getByTestId('namespaces')).toHaveTextContent(
      'namespace-1,namespace-2,namespace-3',
    );
    expect(screen.getByTestId('preferred')).toHaveTextContent('namespace-1');
  });

  it('should handle errors during namespace loading', async () => {
    const error = new Error('Failed to load namespaces');
    mockUseFetchState.mockReturnValue([[], true, error, jest.fn()]);

    const config = createMockConfig();

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to load namespaces');
    expect(screen.getByTestId('namespaces')).toHaveTextContent('');
    expect(screen.getByTestId('preferred')).toHaveTextContent('none');
  });

  it('should initialize central dashboard client when kubeflow', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    // Mock fetch to resolve successfully for script loading
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    // Mock window.centraldashboard before rendering
    const mockInit = jest.fn((callback) => {
      // Simulate the callback being called
      callback({
        onNamespaceSelected: jest.fn(),
      });
    });
    global.window.centraldashboard = {
      CentralDashboardEventHandler: {
        init: mockInit,
      },
    };

    // Mock script loading
    const originalCreateElement = document.createElement;
    const mockScript: Partial<HTMLScriptElement> = {
      src: '',
      async: true,
      onload: null,
      onerror: null,
    };
    document.createElement = jest.fn((tagName: string): HTMLElement | HTMLScriptElement => {
      if (tagName === 'script') {
        return mockScript as HTMLScriptElement;
      }
      return originalCreateElement.call(document, tagName);
    });

    const appendChild = jest.spyOn(document.head, 'appendChild').mockImplementation((): Node => {
      setTimeout(() => {
        if (mockScript.onload) {
          (mockScript.onload as (this: HTMLScriptElement, ev: Event) => unknown).call(
            mockScript as HTMLScriptElement,
            new Event('load'),
          );
        }
      }, 0);
      return mockScript as Node;
    });

    const config = createMockConfig(DeploymentMode.Kubeflow);

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    // Wait for script loading effect
    await waitFor(() => {
      expect(screen.getByTestId('preferred')).toHaveTextContent('namespace-1');
    });

    expect(mockInit).toHaveBeenCalled();

    // Cleanup
    document.createElement = originalCreateElement;
    appendChild.mockRestore();
  });

  it('should update preferred namespace when selected', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    const TestUpdater = () => {
      const context = React.useContext(ModularArchContext);
      React.useEffect(() => {
        if (context) {
          act(() => {
            context.updatePreferredNamespace({ name: 'namespace-2' });
          });
        }
      }, [context]);
      return null;
    };

    const config = createMockConfig();

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
        <TestUpdater />
      </ModularArchContextProvider>,
    );

    expect(screen.getByTestId('preferred')).toHaveTextContent('namespace-2');
  });

  it('should handle central dashboard initialization failure gracefully', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    // Mock fetch to resolve successfully for script loading
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock window.centraldashboard with an init function that throws an error
    const error = new Error('Central dashboard initialization failed');
    global.window.centraldashboard = {
      CentralDashboardEventHandler: {
        init: () => {
          throw error;
        },
      },
    };

    // Mock script loading
    const originalCreateElement = document.createElement;
    const mockScript = {
      src: '',
      async: true,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'script') {
        return mockScript as HTMLScriptElement;
      }
      return originalCreateElement.call(document, tagName);
    });

    const appendChild = jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
      // Simulate script loaded
      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);
      return mockScript as HTMLScriptElement;
    });

    const config = createMockConfig(DeploymentMode.Kubeflow);

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    // Wait for script loading and error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize central dashboard client',
        error,
      );
      // Wait for spinner to disappear (scriptLoaded = true)
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('init-error')).toHaveTextContent(
      'Central dashboard initialization failed',
    );
    expect(screen.getByTestId('preferred')).toHaveTextContent('namespace-1');

    // Cleanup
    consoleSpy.mockRestore();
    document.createElement = originalCreateElement;
    appendChild.mockRestore();
  });

  it('should handle multiple namespace updates correctly', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    const TestMultipleUpdates = () => {
      const context = React.useContext(ModularArchContext);

      React.useEffect(() => {
        if (context) {
          act(() => {
            context.updatePreferredNamespace({ name: 'namespace-2' });
            context.updatePreferredNamespace({ name: 'namespace-3' });
            context.updatePreferredNamespace({ name: 'namespace-1' });
          });
        }
      }, [context]);

      return null;
    };

    const config = createMockConfig();

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
        <TestMultipleUpdates />
      </ModularArchContextProvider>,
    );

    expect(screen.getByTestId('preferred')).toHaveTextContent('namespace-1');
  });

  it('should show loading spinner when script is not loaded for kubeflow integration', async () => {
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    // Mock fetch to simulate script loading delay
    let resolvePromise: (value: { ok: boolean }) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(promise);

    const config = createMockConfig(DeploymentMode.Kubeflow);

    render(
      <ModularArchContextProvider config={config}>
        <TestConsumer />
      </ModularArchContextProvider>,
    );

    // Should show loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('deployment-mode')).not.toBeInTheDocument();

    // Resolve the promise to simulate script loading
    act(() => {
      resolvePromise!({ ok: true });
    });
  });

  it('should throw error when used outside provider', () => {
    const TestConsumerWithError = () => {
      const context = React.useContext(ModularArchContext);
      return <div>{context ? 'Has context' : 'No context'}</div>;
    };

    render(<TestConsumerWithError />);
    expect(screen.getByText('No context')).toBeInTheDocument();
  });

  describe('mandatory namespace functionality', () => {
    it('should use mandatory namespace when provided in config', async () => {
      const mandatoryNamespace = 'mandatory-namespace';
      // Mock useFetchState to return only the mandatory namespace
      mockUseFetchState.mockReturnValue([
        [{ name: mandatoryNamespace }],
        true,
        undefined,
        jest.fn(),
      ]);

      const config = createMockConfig(DeploymentMode.Federated);

      render(
        <ModularArchContextProvider config={config}>
          <TestConsumer />
        </ModularArchContextProvider>,
      );

      expect(screen.getByTestId('namespaces')).toHaveTextContent(mandatoryNamespace);
      expect(screen.getByTestId('preferred')).toHaveTextContent(mandatoryNamespace);
    });

    it('should not fetch namespaces when mandatory namespace is set', async () => {
      const mandatoryNamespace = 'mandatory-namespace';
      // Mock useFetchState to return only the mandatory namespace
      mockUseFetchState.mockReturnValue([
        [{ name: mandatoryNamespace }],
        true,
        undefined,
        jest.fn(),
      ]);

      const config = createMockConfig(DeploymentMode.Federated, mandatoryNamespace);

      render(
        <ModularArchContextProvider config={config}>
          <TestConsumer />
        </ModularArchContextProvider>,
      );

      // Should show the mandatory namespace as loaded
      expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
      expect(screen.getByTestId('namespaces')).toHaveTextContent(mandatoryNamespace);
      expect(screen.getByTestId('preferred')).toHaveTextContent(mandatoryNamespace);
    });

    it('should not use kubeflow namespace loader when mandatory namespace is set', async () => {
      const mandatoryNamespace = 'mandatory-namespace';
      mockUseFetchState.mockReturnValue([
        [{ name: mandatoryNamespace }],
        true,
        undefined,
        jest.fn(),
      ]);

      // Mock fetch to resolve successfully for script loading
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // Mock script loading
      const originalCreateElement = document.createElement;
      const mockScript: Partial<HTMLScriptElement> = {
        src: '',
        async: true,
        onload: null,
        onerror: null,
      };
      document.createElement = jest.fn((tagName: string): HTMLElement | HTMLScriptElement => {
        if (tagName === 'script') {
          return mockScript as HTMLScriptElement;
        }
        return originalCreateElement.call(document, tagName);
      });

      const appendChild = jest.spyOn(document.head, 'appendChild').mockImplementation((): Node => {
        setTimeout(() => {
          if (mockScript.onload) {
            (mockScript.onload as (this: HTMLScriptElement, ev: Event) => unknown).call(
              mockScript as HTMLScriptElement,
              new Event('load'),
            );
          }
        }, 0);
        return mockScript as Node;
      });

      // Mock kubeflow window object
      global.window.centraldashboard = {
        CentralDashboardEventHandler: {
          init: jest.fn(),
        },
      };

      const config = createMockConfig(DeploymentMode.Kubeflow, mandatoryNamespace);

      render(
        <ModularArchContextProvider config={config}>
          <TestConsumer />
        </ModularArchContextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('preferred')).toHaveTextContent(mandatoryNamespace);
      });

      // Cleanup
      document.createElement = originalCreateElement;
      appendChild.mockRestore();
    });
  });
});
