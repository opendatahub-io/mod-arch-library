import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import * as useFetchStateModule from '~/utilities/useFetchState';
import { DeploymentMode, PlatformMode } from '~/utilities';
import { ModularArchConfig } from '~/types';
import { useNamespacesWithConfig } from '../useNamespaces';

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
  platformMode: PlatformMode = PlatformMode.Default,
): ModularArchConfig => ({
  deploymentMode,
  platformMode,
  URL_PREFIX: 'test',
  BFF_API_VERSION: 'v1',
  ...(mandatoryNamespace && { mandatoryNamespace }),
});

describe('useNamespacesWithConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return mandatory namespace when configured', () => {
    const mandatoryNamespace = 'mandatory-namespace';
    const config = createMockConfig(mandatoryNamespace);

    // Mock useFetchState to simulate the mandatory namespace being returned
    mockUseFetchState.mockReturnValue([[{ name: mandatoryNamespace }], true, undefined, jest.fn()]);

    const { result } = renderHook(() => useNamespacesWithConfig(config));

    expect(result.current[0]).toEqual([{ name: mandatoryNamespace }]);
    expect(result.current[1]).toBe(true); // isLoaded
    expect(result.current[2]).toBeUndefined(); // error
  });

  it('should fetch namespaces normally when no mandatory namespace is set', () => {
    const config = createMockConfig();

    const mockNamespaces = [{ name: 'namespace-1' }, { name: 'namespace-2' }];

    mockUseFetchState.mockReturnValue([mockNamespaces, true, undefined, jest.fn()]);

    const { result } = renderHook(() => useNamespacesWithConfig(config));

    expect(result.current[0]).toEqual(mockNamespaces);
    expect(result.current[1]).toBe(true); // isLoaded
    expect(result.current[2]).toBeUndefined(); // error
  });

  it('should return empty array for kubeflow integrated mode when no mandatory namespace', () => {
    const config = createMockConfig(undefined, DeploymentMode.Integrated, PlatformMode.Kubeflow);

    mockUseFetchState.mockReturnValue([[], true, undefined, jest.fn()]);

    const { result } = renderHook(() => useNamespacesWithConfig(config));

    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true); // isLoaded
    expect(result.current[2]).toBeUndefined(); // error
  });

  it('should return mandatory namespace even in kubeflow integrated mode', () => {
    const mandatoryNamespace = 'mandatory-namespace';
    const config = createMockConfig(
      mandatoryNamespace,
      DeploymentMode.Integrated,
      PlatformMode.Kubeflow,
    );

    mockUseFetchState.mockReturnValue([[{ name: mandatoryNamespace }], true, undefined, jest.fn()]);

    const { result } = renderHook(() => useNamespacesWithConfig(config));

    expect(result.current[0]).toEqual([{ name: mandatoryNamespace }]);
    expect(result.current[1]).toBe(true); // isLoaded
    expect(result.current[2]).toBeUndefined(); // error
  });
});
