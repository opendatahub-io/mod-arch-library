import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ManageColumnsModal } from '~/components/table/manageColumns/ManageColumnsModal';
import type { UseManageColumnsResult, ManagedColumn } from '~/components/table/useManageColumns';

jest.mock('@patternfly/react-drag-drop', () => ({
  DragDropSort: (props: { items: { id: string; content: React.ReactNode }[] }) => (
    <div data-testid="mock-drag-drop-sort">
      {props.items.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
    </div>
  ),
}));

const createManagedColumns = (names: string[], visibleIds: string[] = []): ManagedColumn[] =>
  names.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    label: name,
    isVisible: visibleIds.includes(name.toLowerCase().replace(/\s+/g, '_')),
  }));

const defaultColumns = createManagedColumns(
  ['Name', 'Status', 'Date', 'Owner', 'Priority'],
  ['name', 'status', 'date'],
);

const defaultDefaults = ['name', 'status', 'date'];

type ManageColumnsResultSubset = Pick<
  UseManageColumnsResult<unknown>,
  | 'managedColumns'
  | 'setVisibleColumnIds'
  | 'defaultVisibleColumnIds'
  | 'isModalOpen'
  | 'closeModal'
>;

const renderModal = (overrides: Partial<ManageColumnsResultSubset> = {}) => {
  const setVisibleColumnIds = jest.fn();
  const closeModal = jest.fn();

  const manageColumnsResult: ManageColumnsResultSubset = {
    managedColumns: defaultColumns,
    setVisibleColumnIds,
    defaultVisibleColumnIds: defaultDefaults,
    isModalOpen: true,
    closeModal,
    ...overrides,
  };

  const rendered = render(
    <ManageColumnsModal
      manageColumnsResult={manageColumnsResult}
      dataTestId="test-manage-columns"
    />,
  );

  return { ...rendered, setVisibleColumnIds, closeModal };
};

describe('ManageColumnsModal', () => {
  describe('Opening the Modal', () => {
    it('should render modal with search, Update, Cancel, and Restore defaults', () => {
      renderModal();

      const modal = screen.getByTestId('test-manage-columns');
      expect(modal).toBeInTheDocument();

      expect(screen.getByTestId('test-manage-columns-search')).toBeInTheDocument();
      expect(screen.getByTestId('test-manage-columns-update-button')).toBeInTheDocument();
      expect(screen.getByTestId('test-manage-columns-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('test-manage-columns-restore-defaults')).toBeInTheDocument();
    });

    it('should not render when isModalOpen is false', () => {
      renderModal({ isModalOpen: false });

      expect(screen.queryByTestId('test-manage-columns')).not.toBeInTheDocument();
    });
  });

  describe('Toggling Columns Off/On', () => {
    it('should call setVisibleColumnIds without unchecked column when Update is clicked', () => {
      const { setVisibleColumnIds } = renderModal();

      const nameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
      expect(nameCheckbox).toBeChecked();

      fireEvent.click(nameCheckbox);
      expect(nameCheckbox).not.toBeChecked();

      fireEvent.click(screen.getByTestId('test-manage-columns-update-button'));

      expect(setVisibleColumnIds).toHaveBeenCalledWith(expect.not.arrayContaining(['name']));
    });

    it('should call setVisibleColumnIds with re-checked column when Update is clicked', () => {
      const { setVisibleColumnIds } = renderModal();

      const ownerCheckbox = screen.getByRole('checkbox', { name: 'Owner' });
      expect(ownerCheckbox).not.toBeChecked();

      fireEvent.click(ownerCheckbox);
      expect(ownerCheckbox).toBeChecked();

      fireEvent.click(screen.getByTestId('test-manage-columns-update-button'));

      expect(setVisibleColumnIds).toHaveBeenCalledWith(expect.arrayContaining(['owner']));
    });

    it('should not apply changes when Cancel is clicked', () => {
      const { setVisibleColumnIds, closeModal } = renderModal();

      const nameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
      fireEvent.click(nameCheckbox);

      fireEvent.click(screen.getByTestId('test-manage-columns-cancel-button'));

      expect(setVisibleColumnIds).not.toHaveBeenCalled();
      expect(closeModal).toHaveBeenCalled();
    });

    it('should toggle multiple columns at once', () => {
      const { setVisibleColumnIds } = renderModal();

      const nameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
      const statusCheckbox = screen.getByRole('checkbox', { name: 'Status' });

      fireEvent.click(nameCheckbox);
      fireEvent.click(statusCheckbox);

      fireEvent.click(screen.getByTestId('test-manage-columns-update-button'));

      expect(setVisibleColumnIds).toHaveBeenCalledTimes(1);
      const calledWith = setVisibleColumnIds.mock.calls[0][0] as string[];
      expect(calledWith).not.toContain('name');
      expect(calledWith).not.toContain('status');
      expect(calledWith).toContain('date');
    });
  });

  describe('Restore Defaults', () => {
    it('should restore default column visibility when Restore default columns is clicked', () => {
      renderModal();

      const nameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
      const statusCheckbox = screen.getByRole('checkbox', { name: 'Status' });
      fireEvent.click(nameCheckbox);
      fireEvent.click(statusCheckbox);

      expect(nameCheckbox).not.toBeChecked();
      expect(statusCheckbox).not.toBeChecked();

      fireEvent.click(screen.getByTestId('test-manage-columns-restore-defaults'));

      const restoredNameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
      const restoredStatusCheckbox = screen.getByRole('checkbox', { name: 'Status' });
      expect(restoredNameCheckbox).toBeChecked();
      expect(restoredStatusCheckbox).toBeChecked();
    });
  });

  describe('Search', () => {
    it('should filter columns when typing in the search input', () => {
      renderModal();

      const searchInput = screen.getByTestId('test-manage-columns-search');
      const input = within(searchInput).getByRole('textbox', { name: 'Search input' });
      fireEvent.change(input, { target: { value: 'Name' } });

      expect(screen.getByRole('checkbox', { name: 'Name' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Status' })).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Date' })).not.toBeInTheDocument();
    });

    it('should show empty state when no columns match search', () => {
      renderModal();

      const searchInput = screen.getByTestId('test-manage-columns-search');
      const input = within(searchInput).getByRole('textbox', { name: 'Search input' });
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  describe('Selection Count', () => {
    it('should display correct selection count', () => {
      renderModal();

      expect(screen.getByText('3 / total 5 selected')).toBeInTheDocument();
    });
  });
});
