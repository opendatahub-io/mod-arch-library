import * as React from 'react';
import { EitherOrNone } from '~/types/typeHelpers';
import { GetColumnSort, SortableData } from './types';

type TableColumnSortProps<DataType> = {
  columns: SortableData<DataType>[];
  subColumns?: SortableData<DataType>[];
  sortDirection?: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;
};

type ControlledSortByIndexProps = {
  sortIndex?: number;
  onSortIndexChange?: (index: number) => void;
};

type ControlledSortByFieldProps = {
  sortField?: string;
  onSortFieldChange?: (field: string) => void;
};

export type ControlledSortProps = EitherOrNone<
  ControlledSortByIndexProps,
  ControlledSortByFieldProps
> & {
  sortDirection?: 'asc' | 'desc';
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
};

type TableColumnSortByFieldProps<DataType> = TableColumnSortProps<DataType> & {
  sortField?: string;
  setSortField: (field: string) => void;
};

type TableColumnSortByIndexProps<DataType> = TableColumnSortProps<DataType> & {
  sortIndex?: number;
  setSortIndex: (index: number) => void;
};

export const getTableColumnSort = <T>({
  columns,
  subColumns = [],
  sortField,
  setSortField,
  ...sortProps
}: TableColumnSortByFieldProps<T>): GetColumnSort => {
  const allColumns = [...columns, ...subColumns];
  const resolvedSortIndex =
    sortField === undefined ? undefined : allColumns.findIndex((c) => c.field === sortField);
  return getTableColumnSortByIndex<T>({
    columns,
    subColumns,
    sortIndex:
      resolvedSortIndex !== undefined && resolvedSortIndex >= 0 ? resolvedSortIndex : undefined,
    setSortIndex: (index: number) => {
      const column = allColumns[index];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive coding
      if (!column || column.field == null) {
        return;
      }
      setSortField(column.field);
    },
    ...sortProps,
  });
};

const getTableColumnSortByIndex =
  <T>({
    columns,
    subColumns,
    sortIndex,
    sortDirection,
    setSortIndex,
    setSortDirection,
  }: TableColumnSortByIndexProps<T>): GetColumnSort =>
  (columnIndex: number) =>
    (columnIndex < columns.length
      ? columns[columnIndex]
      : subColumns?.[columnIndex - columns.length]
    )?.sortable
      ? {
          sortBy: {
            index: sortIndex,
            direction: sortDirection,
            defaultDirection: 'asc',
          },
          onSort: (_event, index, direction) => {
            setSortIndex(index);
            setSortDirection(direction);
          },
          columnIndex,
        }
      : undefined;
/**
 * Using PF Composable Tables, this utility will help with handling sort logic.
 *
 * Use `transformData` on your data before you render rows.
 * Use `getColumnSort` on your Th.sort as you render it (using the index of your column)
 *
 * @see https://www.patternfly.org/v4/components/table
 */
const useTableColumnSort = <T>(
  columns: SortableData<T>[],
  subColumns: SortableData<T>[],
  defaultSortColIndex?: number,
  controlledSortProps?: ControlledSortProps,
): {
  transformData: (data: T[]) => T[];
  getColumnSort: GetColumnSort;
} => {
  const [internalSortIndex, setInternalSortIndex] = React.useState<number | undefined>(
    defaultSortColIndex,
  );
  const [internalSortDirection, setInternalSortDirection] = React.useState<
    'desc' | 'asc' | undefined
  >('asc');

  const allColumns = React.useMemo(() => [...columns, ...subColumns], [columns, subColumns]);

  // Resolve sort index: from sortIndex, or from sortField via columns
  const resolvedSortIndex = React.useMemo(() => {
    const normalizeSortIndex = (index: number | undefined): number | undefined =>
      typeof index === 'number' &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < allColumns.length
        ? index
        : undefined;

    if (controlledSortProps?.sortIndex !== undefined) {
      return normalizeSortIndex(controlledSortProps.sortIndex);
    }
    if (controlledSortProps?.sortField !== undefined) {
      const idx = allColumns.findIndex((c) => c.field === controlledSortProps.sortField);
      return idx >= 0 ? idx : undefined;
    }
    return normalizeSortIndex(internalSortIndex);
  }, [
    controlledSortProps?.sortIndex,
    controlledSortProps?.sortField,
    allColumns,
    internalSortIndex,
  ]);

  const activeSortIndex = resolvedSortIndex;
  const activeSortDirection =
    controlledSortProps?.sortDirection !== undefined
      ? controlledSortProps.sortDirection
      : internalSortDirection;
  const isSortIndexControlled =
    controlledSortProps?.sortIndex !== undefined || controlledSortProps?.sortField !== undefined;
  const isSortDirectionControlled = controlledSortProps?.sortDirection !== undefined;

  const handleSortIndexChange = (index: number): void => {
    const onFieldChange =
      controlledSortProps && 'onSortFieldChange' in controlledSortProps
        ? controlledSortProps.onSortFieldChange
        : undefined;
    if (onFieldChange) {
      const column = allColumns[index];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive coding
      if (!column || column.field == null) {
        return;
      }
      onFieldChange(column.field);
    } else {
      const onIndexChange =
        controlledSortProps && 'onSortIndexChange' in controlledSortProps
          ? controlledSortProps.onSortIndexChange
          : undefined;
      onIndexChange?.(index);
    }
    if (!isSortIndexControlled) {
      setInternalSortIndex(index);
    }
  };

  const handleSortDirectionChange = (direction: 'asc' | 'desc'): void => {
    controlledSortProps?.onSortDirectionChange?.(direction);
    if (!isSortDirectionControlled) {
      setInternalSortDirection(direction);
    }
  };

  return {
    transformData: (data: T[]): T[] => {
      if (activeSortIndex === undefined) {
        return data;
      }

      return data.toSorted((a, b) => {
        const columnField =
          activeSortIndex < columns.length
            ? columns[activeSortIndex]
            : subColumns[activeSortIndex - columns.length];

        const compute = () => {
          if (typeof columnField.sortable === 'function') {
            return columnField.sortable(a, b, columnField.field);
          }

          if (!columnField.field) {
            // If you lack the field, no auto sorting can be done
            return 0;
          }

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const dataValueA = a[columnField.field as keyof T];
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const dataValueB = b[columnField.field as keyof T];
          if (typeof dataValueA === 'string' && typeof dataValueB === 'string') {
            return dataValueA.localeCompare(dataValueB);
          }
          if (typeof dataValueA === 'number' && typeof dataValueB === 'number') {
            return dataValueA - dataValueB;
          }
          return 0;
        };

        return compute() * (activeSortDirection === 'desc' ? -1 : 1);
      });
    },
    getColumnSort: getTableColumnSortByIndex<T>({
      columns,
      subColumns,
      sortDirection: activeSortDirection,
      setSortDirection: handleSortDirectionChange,
      sortIndex: activeSortIndex,
      setSortIndex: handleSortIndexChange,
    }),
  };
};

export default useTableColumnSort;
