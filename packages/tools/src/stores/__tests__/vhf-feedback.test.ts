import { describe, it, expect, beforeEach } from 'vitest';
import { useVHFStore } from '@/stores/vhf';

describe('feedbackHistory', () => {
  beforeEach(() => useVHFStore.setState({ feedbackHistory: [] }));

  it('initializes empty', () => {
    expect(useVHFStore.getState().feedbackHistory).toEqual([]);
  });

  it('accumulates feedback items', () => {
    const { addFeedbackItems } = useVHFStore.getState();
    addFeedbackItems([{ type: 'correct', label: 'Correct', message: 'Good format' }]);
    addFeedbackItems([{ type: 'suggestion', label: 'Correction', message: 'Say vessel name 3x' }]);
    expect(useVHFStore.getState().feedbackHistory).toHaveLength(2);
  });

  it('clears feedback history', () => {
    const { addFeedbackItems, clearFeedbackHistory } = useVHFStore.getState();
    addFeedbackItems([{ type: 'correct', label: 'Correct', message: 'Good' }]);
    clearFeedbackHistory();
    expect(useVHFStore.getState().feedbackHistory).toEqual([]);
  });
});
