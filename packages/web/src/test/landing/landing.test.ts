import { describe, it, expect } from 'vitest';

describe('Landing page components', () => {
  it('NavBar exports a default function component', async () => {
    const mod = await import('@/components/landing/NavBar');
    expect(typeof mod.NavBar).toBe('function');
  });
});
