import { describe, it, expect } from 'vitest';

describe('Landing page components', () => {
  it('NavBar exports a default function component', async () => {
    const mod = await import('@/components/landing/NavBar');
    expect(typeof mod.NavBar).toBe('function');
  });
});

describe('Landing page structure', () => {
  it('index.astro imports landing.css', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('src/pages/index.astro', 'utf-8');
    expect(content).toContain('landing.css');
  });

  it('index.astro imports LandingLayout (not BaseLayout)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('src/pages/index.astro', 'utf-8');
    expect(content).toContain('LandingLayout');
    expect(content).not.toContain('BaseLayout');
  });
});
