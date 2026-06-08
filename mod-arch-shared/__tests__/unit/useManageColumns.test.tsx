import '@testing-library/jest-dom';
import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useManageColumns, UseManageColumnsConfig } from '~/components/table/useManageColumns';
import { SortableData } from '~/components/table/types';

type TestItem = { id: string; name: string };

const STORAGE_KEY = 'test-manage-columns';

const testColumns: SortableData<TestItem>[] = [
  { field: 'name', label: 'Name', sortable: true },
  { field: 'status', label: 'Status', sortable: true },
  { field: 'date', label: 'Date', sortable: true },
  { field: 'owner', label: 'Owner', sortable: true },
  { field: 'priority', label: 'Priority', sortable: true },
];

let mockStorageData: Record<string, unknown> = {};

jest.mock('mod-arch-core', () => ({
  useBrowserStorage: <T,>(key: string, defaultValue: T): [T, (value: T) => boolean] => {
    const [value, setValue] = React.useState<T>(() => (mockStorageData[key] as T) ?? defaultValue);

    const setStoredValue = React.useCallback(
      (newValue: T) => {
        mockStorageData[key] = newValue;
        setValue(newValue);
        localStorage.setItem(key, JSON.stringify(newValue));
        return true;
      },
      [key],
    );

    return [value, setStoredValue];
  },
}));

const renderManageColumnsHook = (overrides: Partial<UseManageColumnsConfig<TestItem>> = {}) =>
  renderHook(() =>
    useManageColumns<TestItem>({
      allColumns: testColumns,
      storageKey: STORAGE_KEY,
      defaultVisibleColumnIds: ['name', 'status', 'date'],
      maxVisibleColumns: 5,
      ...overrides,
    }),
  );

describe('useManageColumns', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStorageData = {};
  });

  it('should return default visible columns when no localStorage value exists', () => {
    const { result } = renderManageColumnsHook();

    expect(result.current.visibleColumnIds).toEqual(['name', 'status', 'date']);
    expect(result.current.visibleColumns).toHaveLength(3);
  });

  it('should return all manageable columns with visibility state', () => {
    const { result } = renderManageColumnsHook();

    expect(result.current.managedColumns).toHaveLength(5);

    const visibleIds = result.current.managedColumns
      .filter((col) => col.isVisible)
      .map((col) => col.id);
    expect(visibleIds).toEqual(['name', 'status', 'date']);

    const hiddenIds = result.current.managedColumns
      .filter((col) => !col.isVisible)
      .map((col) => col.id);
    expect(hiddenIds).toEqual(['owner', 'priority']);
  });

  it('should update visible columns when setVisibleColumnIds is called', () => {
    const { result } = renderManageColumnsHook();

    act(() => {
      result.current.setVisibleColumnIds(['name', 'owner']);
    });

    expect(result.current.visibleColumnIds).toEqual(['name', 'owner']);
    expect(result.current.visibleColumns).toHaveLength(2);
  });

  it('should persist column visibility to localStorage', () => {
    const { result } = renderManageColumnsHook();

    act(() => {
      result.current.setVisibleColumnIds(['name', 'priority']);
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual(['name', 'priority']);
  });

  it('should restore column visibility from pre-set storage', () => {
    mockStorageData[STORAGE_KEY] = ['status', 'owner'];

    const { result } = renderManageColumnsHook();

    expect(result.current.visibleColumnIds).toEqual(['status', 'owner']);
    expect(result.current.visibleColumns).toHaveLength(2);
  });

  it('should manage modal open/close state', () => {
    const { result } = renderManageColumnsHook();

    expect(result.current.isModalOpen).toBe(false);

    act(() => {
      result.current.openModal();
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });

  it('should exclude non-manageable fields (checkbox, kebab, expand)', () => {
    const columnsWithChrome: SortableData<TestItem>[] = [
      { field: 'checkbox', label: '', sortable: false },
      ...testColumns,
      { field: 'kebab', label: '', sortable: false },
    ];

    const { result } = renderManageColumnsHook({
      allColumns: columnsWithChrome,
    });

    const managedIds = result.current.managedColumns.map((col) => col.id);
    expect(managedIds).not.toContain('checkbox');
    expect(managedIds).not.toContain('kebab');
    expect(managedIds).toEqual(['name', 'status', 'date', 'owner', 'priority']);
  });

  it('should return defaultVisibleColumnIds for convenience', () => {
    const defaults = ['name', 'status', 'date'];
    const { result } = renderManageColumnsHook({
      defaultVisibleColumnIds: defaults,
    });

    expect(result.current.defaultVisibleColumnIds).toEqual(defaults);
  });

  it('should respect maxVisibleColumns limit', () => {
    const { result } = renderManageColumnsHook({
      defaultVisibleColumnIds: ['name', 'status', 'date', 'owner', 'priority'],
      maxVisibleColumns: 3,
    });

    expect(result.current.visibleColumnIds).toHaveLength(3);
    expect(result.current.visibleColumnIds).toEqual(['name', 'status', 'date']);
  });
});
