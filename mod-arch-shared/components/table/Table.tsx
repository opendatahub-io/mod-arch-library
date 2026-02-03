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
  onSortChange,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  ...props
}: TableProps<T>): React.ReactElement => {
  // Internal state (used when not controlled)
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalPageSize, setInternalPageSize] = React.useState(MIN_PAGE_SIZE);

  // Store callback in ref to avoid re-running effect when callback reference changes
  const onPageChangeRef = React.useRef(onPageChange);
  React.useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // Use controlled props if provided, otherwise use internal state
  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const controlledSortProps =
    controlledSortIndex !== undefined || controlledSortDirection !== undefined || onSortChange
      ? { sortIndex: controlledSortIndex, sortDirection: controlledSortDirection, onSortChange }
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
    if (data.length === 0) {
      if (onPageChangeRef.current) {
        onPageChangeRef.current(1);
      } else {
        setInternalPage(1);
      }
    }
  }, [data.length]);

  const handlePageChange = (_e: unknown, newPage: number): void => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handlePageSizeChange = (_e: unknown, newSize: number, newPage: number): void => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize, newPage);
    } else {
      setInternalPageSize(newSize);
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
