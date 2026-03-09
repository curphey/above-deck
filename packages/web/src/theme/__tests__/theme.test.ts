import { describe, it, expect } from 'vitest';
import { theme } from '../theme';
import { COLORS } from '../colors';

describe('theme', () => {
  it('has dark mode as default color scheme', () => {
    expect(theme.other?.defaultColorScheme).toBe('dark');
  });

  it('defines brand color palette', () => {
    expect(COLORS.background.dark).toBe('#1a1a2e');
    expect(COLORS.surface.dark).toBe('#16213e');
    expect(COLORS.accent.positive).toBe('#4ade80');
    expect(COLORS.accent.warning).toBe('#f87171');
    expect(COLORS.accent.neutral).toBe('#60a5fa');
  });

  it('uses Space Mono for headings', () => {
    expect(theme.headings?.fontFamily).toContain('Space Mono');
  });

  it('uses Inter for body text', () => {
    expect(theme.fontFamily).toContain('Inter');
  });
});
