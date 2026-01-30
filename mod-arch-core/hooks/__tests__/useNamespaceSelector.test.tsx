import '@testing-library/jest-dom';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as useFetchStateModule from '~/utilities/useFetchState';
import { ModularArchContextProvider } from '~/context/ModularArchContext';
import { BrowserStorageContextProvider } from '~/context/BrowserStorageContext';
import { DeploymentMode } from '~/utilities';
import { ModularArchConfig, Namespace } from '~/types';
import { useNamespaceSelector } from '../useNamespaceSelector';

jest.mock('~/api/k8s', () => ({
  getNamespaces: jest.fn(() => jest.fn(() => Promise.resolve([]))),
}));

jest.mock('~/utilities/useFetchState', () => ({
  useFetchState: jest.fn(),
}));

const mockUseFetchState = useFetchStateModule.useFetchState as jest.MockedFunction<
  typeof useFetchStateModule.useFetchState
>;

const createMockConfig = (
  mandatoryNamespace?: string,
  deploymentMode: DeploymentMode = DeploymentMode.Standalone,
): ModularArchConfig => ({
  deploymentMode,
  URL_PREFIX: 'test',
  BFF_API_VERSION: 'v1',
  ...(mandatoryNamespace && { mandatoryNamespace }),
});

const TestWrapper: React.FC<{ config: ModularArchConfig; children: React.ReactNode }> = ({
  config,
  children,
}) => (
  <BrowserStorageContextProvider>
    <ModularArchContextProvider config={config}>{children}</ModularArchContextProvider>
  </BrowserStorageContextProvider>
);

const createWrapper = (config: ModularArchConfig) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper config={config}>{children}</TestWrapper>
  );
  Wrapper.displayName = 'TestHookWrapper';
  return Wrapper;
};

describe('useNamespaceSelector', () => {
  const mockNamespaces: Namespace[] = [
    { name: 'namespace-a' },
    { name: 'namespace-b' },
    { name: 'namespace-c' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('basic functionality (without persistence)', () => {
    it('should return namespace data from context', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.namespacesLoaded).toBe(true);
      expect(result.current.namespaces).toEqual(mockNamespaces);
      expect(result.current.namespacesLoadError).toBeUndefined();
      expect(result.current.initializationError).toBeUndefined();
    });

    it('should return preferredNamespace as first namespace when no mandatory namespace', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.preferredNamespace?.name).toBe('namespace-a');
    });

    it('should update preferredNamespace when updatePreferredNamespace is called', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      act(() => {
        result.current.updatePreferredNamespace({ name: 'namespace-b' });
      });

      expect(result.current.preferredNamespace?.name).toBe('namespace-b');
    });
  });

  describe('with persistence enabled (integration test)', () => {
    it('should integrate with persistence hook when storeLastNamespace is true', async () => {
      const defaultStorageKey = 'mod-arch.namespace.lastUsed';
      localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector({ storeLastNamespace: true }), {
        wrapper: createWrapper(config),
      });

      await waitFor(() => {
        expect(result.current.preferredNamespace?.name).toBe('namespace-b');
      });

      act(() => {
        result.current.updatePreferredNamespace({ name: 'namespace-c' });
      });

      await waitFor(() => {
        expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-c');
      });
    });
  });

  describe('with mandatory namespace', () => {
    it('should return mandatory namespace as preferredNamespace', () => {
      const mandatoryNs = 'mandatory-namespace';
      mockUseFetchState.mockReturnValue([[{ name: mandatoryNs }], true, undefined, jest.fn()]);

      const config = createMockConfig(mandatoryNs);
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.preferredNamespace?.name).toBe(mandatoryNs);
    });
  });

  describe('API contract & backward compatibility', () => {
    it('should work without any arguments (defaults)', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.namespacesLoaded).toBe(true);
      expect(result.current.namespaces).toBeDefined();
      expect(result.current.preferredNamespace).toBeDefined();
      expect(typeof result.current.updatePreferredNamespace).toBe('function');
      expect(typeof result.current.clearStoredNamespace).toBe('function');
    });

    it('should work with empty object argument', () => {
      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector({}), {
        wrapper: createWrapper(config),
      });

      expect(result.current.namespacesLoaded).toBe(true);
    });

    it('should provide clearStoredNamespace function', async () => {
      const defaultStorageKey = 'mod-arch.namespace.lastUsed';
      localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector({ storeLastNamespace: true }), {
        wrapper: createWrapper(config),
      });

      act(() => {
        result.current.clearStoredNamespace();
      });

      await waitFor(() => {
        expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('');
      });
    });
  });

  describe('context integration & loading states', () => {
    it('should handle namespaces not yet loaded', () => {
      mockUseFetchState.mockReturnValue([[], false, undefined, jest.fn()]);

      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.namespacesLoaded).toBe(false);
      expect(result.current.namespaces).toEqual([]);
    });

    it('should handle namespace loading error', () => {
      const mockError = new Error('Failed to load namespaces');
      mockUseFetchState.mockReturnValue([[], true, mockError, jest.fn()]);

      const config = createMockConfig();
      const { result } = renderHook(() => useNamespaceSelector(), {
        wrapper: createWrapper(config),
      });

      expect(result.current.namespacesLoadError).toEqual(mockError);
    });
  });
});
