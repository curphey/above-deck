import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AISTargetList } from '../AISTargetList';

const targets = [
  { mmsi: '235001234', name: 'BLUE HORIZON', distance: 0.8, bearing: 45, cpa: 0.3, sog: 5.2, cog: 225, vesselType: 'sailing' as const },
  { mmsi: '235009876', name: 'SOLENT TRADER', distance: 1.2, bearing: 180, cpa: 0.5, sog: 8.1, cog: 90, vesselType: 'cargo' as const },
];

describe('AISTargetList', () => {
  it('renders vessel names', () => {
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    expect(screen.getByText('BLUE HORIZON')).toBeInTheDocument();
    expect(screen.getByText('SOLENT TRADER')).toBeInTheDocument();
  });

  it('shows distance and bearing', () => {
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    expect(screen.getByText('0.8nm')).toBeInTheDocument();
    expect(screen.getByText('045°')).toBeInTheDocument();
  });

  it('highlights CPA below 0.5nm as warning', () => {
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    const cpaCell = screen.getByText('0.3nm');
    // jsdom normalises hex colours to rgb() notation
    expect(cpaCell.style.color).toBe('rgb(255, 102, 0)');
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('BLUE HORIZON'));
    expect(onSelect).toHaveBeenCalledWith('235001234');
  });
});
