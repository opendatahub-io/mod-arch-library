import '@testing-library/jest-dom';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserStorageContextProvider } from '~/context/BrowserStorageContext';
import { Namespace } from '~/types';
import { useNamespacePersistence } from '../useNamespacePersistence';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserStorageContextProvider>{children}</BrowserStorageContextProvider>
);

const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper>{children}</TestWrapper>
  );
  Wrapper.displayName = 'TestPersistenceHookWrapper';
  return Wrapper;
};

describe('useNamespacePersistence', () => {
  const mockNamespaces: Namespace[] = [
    { name: 'namespace-a' },
    { name: 'namespace-b' },
    { name: 'namespace-c' },
  ];

  const defaultStorageKey = 'test.namespace.key';
  const mockContextUpdatePreferredNamespace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('when storeLastNamespace is false', () => {
    it('should return the context preferredNamespace directly', () => {
      const contextPreferredNamespace = { name: 'namespace-b' };

      const { result } = renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace,
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: false,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.preferredNamespace).toEqual(contextPreferredNamespace);
    });

    it('should not persist to storage when updatePreferredNamespace is called', () => {
      const { result } = renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace: { name: 'namespace-a' },
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: false,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.updatePreferredNamespace({ name: 'namespace-b' });
      });

      expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-b' });
      expect(localStorage.getItem(defaultStorageKey)).toBeNull();
    });
  });

  describe('when storeLastNamespace is true', () => {
    describe('initialization', () => {
      it('should call context update with valid namespace from storage', async () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

        renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-b' });
        });
      });

      it('should fallback to context preference when stored namespace is invalid', async () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('invalid-namespace'));

        const contextPreferredNamespace = { name: 'namespace-a' };
        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace,
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(result.current.preferredNamespace).toEqual(contextPreferredNamespace);
        });

        await waitFor(() => {
          expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-a');
        });
      });

      it('should sync storage with context preference when no stored namespace', async () => {
        const contextPreferredNamespace = { name: 'namespace-c' };

        renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace,
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-c');
        });
      });

      it('should not initialize until namespaces are loaded', () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

        renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: false,
            }),
          { wrapper: createWrapper() },
        );

        expect(mockContextUpdatePreferredNamespace).not.toHaveBeenCalled();
      });
    });

    describe('persistence during usage', () => {
      it('should persist to storage when updatePreferredNamespace is called', async () => {
        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(localStorage.getItem(defaultStorageKey)).not.toBeNull();
        });

        act(() => {
          result.current.updatePreferredNamespace({ name: 'namespace-c' });
        });

        expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-c' });
        expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-c');
      });

      it('should clear storage when namespace is set to undefined', async () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        act(() => {
          result.current.updatePreferredNamespace(undefined);
        });

        expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith(undefined);
        await waitFor(() => {
          expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('');
        });
      });

      it('should provide clearStoredNamespace function', async () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        expect(typeof result.current.clearStoredNamespace).toBe('function');

        act(() => {
          result.current.clearStoredNamespace();
        });

        await waitFor(() => {
          expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('');
        });
        expect(mockContextUpdatePreferredNamespace).not.toHaveBeenCalledWith(undefined);
      });

      it('should not affect storage when clearStoredNamespace is called with storeLastNamespace false', () => {
        localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: false,
              storageKey: defaultStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        act(() => {
          result.current.clearStoredNamespace();
        });

        expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-b');
      });
    });

    describe('storage key customization', () => {
      it('should use custom storage key', async () => {
        const customStorageKey = 'myApp.custom.namespace';

        const { result } = renderHook(
          () =>
            useNamespacePersistence({
              namespaces: mockNamespaces,
              contextPreferredNamespace: { name: 'namespace-a' },
              contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
              storeLastNamespace: true,
              storageKey: customStorageKey,
              namespacesLoaded: true,
            }),
          { wrapper: createWrapper() },
        );

        act(() => {
          result.current.updatePreferredNamespace({ name: 'namespace-b' });
        });

        expect(JSON.parse(localStorage.getItem(customStorageKey) || '')).toBe('namespace-b');
        expect(localStorage.getItem(defaultStorageKey)).toBeNull();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty namespaces list', () => {
      const { result } = renderHook(
        () =>
          useNamespacePersistence({
            namespaces: [],
            contextPreferredNamespace: { name: 'namespace-a' },
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.preferredNamespace?.name).toBe('namespace-a');
    });

    it('should handle context with no preferred namespace', async () => {
      renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace: undefined,
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(localStorage.getItem(defaultStorageKey)).toBeNull();
      });
    });

    it('should handle rapid namespace changes during initialization', async () => {
      localStorage.setItem(defaultStorageKey, JSON.stringify('namespace-b'));

      const { rerender } = renderHook(
        ({ contextPreferredNamespace }) =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace,
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { contextPreferredNamespace: { name: 'namespace-a' } },
        },
      );

      await waitFor(() => {
        expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-b' });
      });

      rerender({ contextPreferredNamespace: { name: 'namespace-c' } });
      rerender({ contextPreferredNamespace: { name: 'namespace-a' } });
      rerender({ contextPreferredNamespace: { name: 'namespace-c' } });

      await waitFor(() => {
        expect(JSON.parse(localStorage.getItem(defaultStorageKey) || '')).toBe('namespace-c');
      });
    });

    it('should handle storage quota exceeded scenarios gracefully', async () => {
      const originalSetItem = Storage.prototype.setItem;
      const setItemSpy = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError: localStorage quota exceeded');
      });
      Storage.prototype.setItem = setItemSpy;

      const { result } = renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace: { name: 'namespace-a' },
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      expect(() => {
        act(() => {
          result.current.updatePreferredNamespace({ name: 'namespace-b' });
        });
      }).not.toThrow();

      expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-b' });

      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem(defaultStorageKey, 'invalid-json-{');

      renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace: { name: 'namespace-a' },
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: defaultStorageKey,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        const storedValue = localStorage.getItem(defaultStorageKey);
        expect(storedValue).not.toBe('invalid-json-{');
        expect(JSON.parse(storedValue!)).toBe('namespace-a');
      });
    });

    it('should handle different storage keys independently', async () => {
      const storageKey1 = 'test.namespace.instance1';
      const storageKey2 = 'test.namespace.instance2';

      localStorage.setItem(storageKey1, JSON.stringify('namespace-b'));
      localStorage.setItem(storageKey2, JSON.stringify('namespace-c'));

      const { result: result1 } = renderHook(
        () =>
          useNamespacePersistence({
            namespaces: mockNamespaces,
            contextPreferredNamespace: { name: 'namespace-a' },
            contextUpdatePreferredNamespace: mockContextUpdatePreferredNamespace,
            storeLastNamespace: true,
            storageKey: storageKey1,
            namespacesLoaded: true,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockContextUpdatePreferredNamespace).toHaveBeenCalledWith({ name: 'namespace-b' });
      });

      act(() => {
        result1.current.updatePreferredNamespace({ name: 'namespace-a' });
      });

      await waitFor(() => {
        expect(JSON.parse(localStorage.getItem(storageKey1) || '')).toBe('namespace-a');
        expect(JSON.parse(localStorage.getItem(storageKey2) || '')).toBe('namespace-c');
      });
    });
  });
});
