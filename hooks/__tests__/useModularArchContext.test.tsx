import '@testing-library/jest-dom';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { ModularArchContextProvider } from '~/context/ModularArchContext';
import { DeploymentMode, PlatformMode } from '~/utilities';
import { useModularArchContext } from '../useModularArchContext';

// Mock the k8s API module
jest.mock('~/api/k8s', () => ({
  getNamespaces: jest.fn(() => jest.fn(() => Promise.resolve([]))),
}));

const mockConfig = {
  deploymentMode: DeploymentMode.Standalone,
  platformMode: PlatformMode.Default,
  URL_PREFIX: 'test',
  BFF_API_VERSION: 'v1',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ModularArchContextProvider config={mockConfig}>{children}</ModularArchContextProvider>
);

describe('useModularArchContext', () => {
  beforeEach(() => {
    // Mock fetch for script loading
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return full context', () => {
    const { result } = renderHook(() => useModularArchContext(), { wrapper });
    expect(result.current).toHaveProperty('namespaces');
    expect(result.current).toHaveProperty('namespacesLoaded');
    expect(result.current).toHaveProperty('scriptLoaded');
  });
  it('should return config from context', () => {
    const { result } = renderHook(() => useModularArchContext(), { wrapper });
    expect(result.current.config).toEqual(mockConfig);
  });

  it('should throw error when used outside provider', () => {
    expect(() => renderHook(() => useModularArchContext())).toThrow();
  });
});
