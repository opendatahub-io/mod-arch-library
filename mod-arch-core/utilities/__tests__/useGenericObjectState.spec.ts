import { act } from '@testing-library/react';
import useGenericObjectState from '~/utilities/useGenericObjectState';
import { testHook } from '~/__tests__/unit/testUtils/hooks';

describe('useGenericObjectState', () => {
  it('should preserve object identity when setting a property to its current value', () => {
    const renderResult = testHook(useGenericObjectState)({ name: 'test', count: 0 });

    const [dataBefore] = renderResult.result.current;

    act(() => {
      const [, setData] = renderResult.result.current;
      setData('name', 'test');
    });

    const [dataAfter] = renderResult.result.current;
    expect(dataAfter).toBe(dataBefore);
  });

  it('should create a new object reference when the value actually changes', () => {
    const renderResult = testHook(useGenericObjectState)({ name: 'test', count: 0 });

    const [dataBefore] = renderResult.result.current;

    act(() => {
      const [, setData] = renderResult.result.current;
      setData('name', 'changed');
    });

    const [dataAfter] = renderResult.result.current;
    expect(dataAfter).not.toBe(dataBefore);
    expect(dataAfter).toEqual({ name: 'changed', count: 0 });
  });
});
