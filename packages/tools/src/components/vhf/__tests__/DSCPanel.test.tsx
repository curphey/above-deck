import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DSCPanel } from '../DSCPanel';

describe('DSCPanel', () => {
  it('renders alert type options', () => {
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={vi.fn()} mmsi="235099000" />);
    expect(screen.getByText('Distress')).toBeDefined();
    expect(screen.getByText('Urgency')).toBeDefined();
    expect(screen.getByText('Safety')).toBeDefined();
    expect(screen.getByText('Routine')).toBeDefined();
  });

  it('shows nature of distress selector for distress alerts', () => {
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={vi.fn()} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Distress'));
    expect(screen.getByText('Flooding')).toBeDefined();
    expect(screen.getByText('Fire/Explosion')).toBeDefined();
  });

  it('calls onSendAlert with correct data', () => {
    const onSend = vi.fn();
    render(<DSCPanel onSendAlert={onSend} onCancel={vi.fn()} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Distress'));
    fireEvent.click(screen.getByText('Flooding'));
    fireEvent.click(screen.getByText('Send'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'distress', nature: 'flooding', mmsi: '235099000' })
    );
  });

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    render(<DSCPanel onSendAlert={vi.fn()} onCancel={onCancel} mmsi="235099000" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
