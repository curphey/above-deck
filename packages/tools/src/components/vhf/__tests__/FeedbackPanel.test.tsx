import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackPanel } from '../FeedbackPanel';

describe('FeedbackPanel', () => {
  it('renders scenario progress', () => {
    render(<FeedbackPanel scenarioLabel="Radio Check — Step 2/4" feedback={[]} />);
    expect(screen.getByText('Radio Check — Step 2/4')).toBeInTheDocument();
  });

  it('renders feedback items by type', () => {
    const feedback = [
      { type: 'correct' as const, label: 'Correct', message: 'Good calling format.' },
      { type: 'suggestion' as const, label: 'Suggestion', message: 'Include your position.' },
      { type: 'tip' as const, label: 'Next Step', message: 'Give your radio check request.' },
    ];
    render(<FeedbackPanel scenarioLabel="" feedback={feedback} />);
    expect(screen.getByText('Good calling format.')).toBeInTheDocument();
    expect(screen.getByText('Include your position.')).toBeInTheDocument();
    expect(screen.getByText('Give your radio check request.')).toBeInTheDocument();
  });

  it('renders empty state when no feedback', () => {
    render(<FeedbackPanel scenarioLabel="" feedback={[]} />);
    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
  });
});
