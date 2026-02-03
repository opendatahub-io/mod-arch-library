import * as React from 'react';
import { TbodyProps } from '@patternfly/react-table';
import { EitherNotBoth } from '~/types/typeHelpers';
import TableBase, { MIN_PAGE_SIZE } from './TableBase';
import useTableColumnSort, { ControlledSortProps } from './useTableColumnSort';

type ControlledPaginationProps = {
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number, page: number) => void;
};

type TableProps<DataType> = Omit<
  React.ComponentProps<typeof TableBase<DataType>>,
  'itemCount' | 'onPerPageSelect' | 'onSetPage' | 'page' | 'perPage'
> &
  EitherNotBoth<
    { disableRowRenderSupport?: boolean },
    { tbodyProps?: TbodyProps & { ref?: React.Ref<HTMLTableSectionElement> } }
  > &
  Partial<ControlledSortProps> &
  Partial<ControlledPaginationProps>;

const Table = <T,>({
  data: allData,
  columns,
  subColumns,
  enablePagination,
  defaultSortColumn = 0,
  truncateRenderingAt = 0,
  sortIndex: controlledSortIndex,
  sortDirection: controlledSortDirection,
  onSortIndexChange,
  onSortDirectionChange,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  ...props
}: TableProps<T>): React.ReactElement => {
  // Internal state (used when not controlled)
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalPageSize, setInternalPageSize] = React.useState(MIN_PAGE_SIZE);

  // Store callback in ref
  const onPageChangeRef = React.useRef(onPageChange);
  React.useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // Use controlled props if provided, otherwise use internal state
  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const controlledSortProps =
    controlledSortIndex !== undefined ||
    controlledSortDirection !== undefined ||
    onSortIndexChange ||
    onSortDirectionChange
      ? {
          sortIndex: controlledSortIndex,
          sortDirection: controlledSortDirection,
          onSortIndexChange,
          onSortDirectionChange,
        }
      : undefined;

  const sort = useTableColumnSort<T>(
    columns,
    subColumns || [],
    defaultSortColumn,
    controlledSortProps,
  );
  const sortedData = sort.transformData(allData);

  let data: T[];
  if (truncateRenderingAt) {
    data = sortedData.slice(0, truncateRenderingAt);
  } else if (enablePagination) {
    data = sortedData.slice(pageSize * (page - 1), pageSize * page);
  } else {
    data = sortedData;
  }

  // update page to 1 if data changes (common when filter is applied)
  React.useEffect(() => {
    const isPageControlled = controlledPage !== undefined;
    if (data.length === 0) {
      onPageChangeRef.current?.(1);
      if (!isPageControlled) {
        setInternalPage(1);
      }
    }
  }, [data.length, controlledPage]);

  const handlePageChange = (_e: unknown, newPage: number): void => {
    const isPageControlled = controlledPage !== undefined;
    onPageChange?.(newPage);
    if (!isPageControlled) {
      setInternalPage(newPage);
    }
  };

  const handlePageSizeChange = (_e: unknown, newSize: number, newPage: number): void => {
    const isPageControlled = controlledPage !== undefined;
    const isPageSizeControlled = controlledPageSize !== undefined;
    onPageSizeChange?.(newSize, newPage);
    if (!isPageSizeControlled) {
      setInternalPageSize(newSize);
    }
    if (!isPageControlled) {
      setInternalPage(newPage);
    }
  };

  return (
    <TableBase
      data={data}
      columns={columns}
      subColumns={subColumns}
      enablePagination={enablePagination}
      itemCount={allData.length}
      perPage={pageSize}
      page={page}
      onSetPage={handlePageChange}
      onPerPageSelect={handlePageSizeChange}
      getColumnSort={sort.getColumnSort}
      {...props}
    />
  );
};

export default Table;
