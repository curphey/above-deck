import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi } from 'vitest';
import { AddEquipmentModal } from '../AddEquipmentModal';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('AddEquipmentModal', () => {
  it('has data-testid="add-equipment-modal"', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="drain"
      />,
    );
    expect(screen.getByTestId('add-equipment-modal')).toBeDefined();
  });

  it('renders drain category tabs', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="drain"
      />,
    );
    expect(screen.getByText('Navigation')).toBeDefined();
    expect(screen.getByText('Refrigeration')).toBeDefined();
    expect(screen.getByText('Lighting')).toBeDefined();
  });

  it('shows equipment items for drain type', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="drain"
      />,
    );
    // Default tab should show Navigation items
    expect(screen.getByText('Chartplotter')).toBeDefined();
  });

  it('renders charge source tabs', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="charge"
      />,
    );
    expect(screen.getByText('Solar')).toBeDefined();
    expect(screen.getByText('Alternator')).toBeDefined();
    expect(screen.getByText('Shore Power')).toBeDefined();
  });

  it('renders store type content', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="store"
      />,
    );
    expect(screen.getByText(/Battery Bank/i)).toBeDefined();
  });

  it('calls onAdd when Add button clicked', () => {
    const onAdd = vi.fn();
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={onAdd}
        filterType="drain"
      />,
    );
    // Click the first "Add" button
    const addButtons = screen.getAllByRole('button', { name: /Add$/i });
    fireEvent.click(addButtons[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
    const addedItem = onAdd.mock.calls[0][0];
    expect(addedItem.type).toBe('drain');
    expect(addedItem.origin).toBe('added');
    expect(addedItem.id).toBeTruthy();
  });

  it('has a search bar', () => {
    wrap(
      <AddEquipmentModal
        opened={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        filterType="drain"
      />,
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
  });
});
