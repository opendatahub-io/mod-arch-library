import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import * as useFetchStateModule from '~/utilities/useFetchState';
import { ModularArchContextProvider } from '~/context/ModularArchContext';
import { DeploymentMode, PlatformMode } from '~/utilities';
import { ModularArchConfig } from '~/types';
import NavBar from '../NavBar';

// Mock the utilities
jest.mock('~/utilities/useFetchState');
jest.mock('~/api/k8s', () => ({
  getNamespaces: jest.fn(() => jest.fn(() => Promise.resolve([]))),
}));

const mockUseFetchState = useFetchStateModule.useFetchState as jest.MockedFunction<
  typeof useFetchStateModule.useFetchState
>;

const createMockConfig = (
  mandatoryNamespace?: string,
  deploymentMode: DeploymentMode = DeploymentMode.Standalone,
  platformMode: PlatformMode = PlatformMode.Federated,
): ModularArchConfig => ({
  deploymentMode,
  platformMode,
  URL_PREFIX: 'test',
  BFF_API_VERSION: 'v1',
  ...(mandatoryNamespace && { mandatoryNamespace }),
});

const createWrapper = (config: ModularArchConfig) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ModularArchContextProvider config={config}>{children}</ModularArchContextProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('NavBar mandatory namespace functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for script loading
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up fetch stub explicitly
    // @ts-expect-error – fetch might be undefined in node
    delete global.fetch;
  });

  it('should disable namespace selection when mandatory namespace is set', async () => {
    const mandatoryNamespace = 'mandatory-namespace';
    const config = createMockConfig(mandatoryNamespace);
    const Wrapper = createWrapper(config);

    // Mock useFetchState to return only the mandatory namespace
    mockUseFetchState.mockReturnValue([[{ name: mandatoryNamespace }], true, undefined, jest.fn()]);

    render(<NavBar onLogout={jest.fn()} />, { wrapper: Wrapper });

    const namespaceButton = await screen.findByText(mandatoryNamespace);
    expect(namespaceButton).toBeInTheDocument();

    // The MenuToggle button should be disabled due to mandatory namespace
    const menuToggle = namespaceButton.closest('button');
    expect(menuToggle).toBeDisabled();
  });

  it('should allow namespace selection when no mandatory namespace is set', async () => {
    const config = createMockConfig();
    const Wrapper = createWrapper(config);

    const mockNamespaces = [{ name: 'namespace-1' }, { name: 'namespace-2' }];

    // Mock useFetchState to return multiple namespaces
    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    render(<NavBar onLogout={jest.fn()} />, { wrapper: Wrapper });

    // Check that the namespace selector is present and enabled
    const namespaceButton = screen.getByText('namespace-1');
    expect(namespaceButton).toBeInTheDocument();

    // The MenuToggle button should be enabled (not disabled)
    const menuToggle = namespaceButton.closest('button');
    expect(menuToggle).not.toBeDisabled();
  });
});
