import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';

/**
 * Tests for the path validation logic used in KB API routes.
 * Extracted here to unit test the security-critical path traversal prevention.
 */

const DOCS_BASE = '/fake/docs';

function validateSlug(slug: string): { valid: boolean; filePath: string } {
  const normalized = slug.replace(/\.\./g, '').replace(/^\/+/, '');
  const filePath = resolve(DOCS_BASE, `${normalized}.md`);
  return {
    valid: filePath.startsWith(DOCS_BASE),
    filePath,
  };
}

describe('KB path validation', () => {
  it('allows simple slug', () => {
    const result = validateSlug('research/hardware/can-bus');
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe('/fake/docs/research/hardware/can-bus.md');
  });

  it('allows single-level slug', () => {
    const result = validateSlug('product/vision');
    expect(result.valid).toBe(true);
  });

  it('strips leading slash', () => {
    const result = validateSlug('/research/hardware/can-bus');
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe('/fake/docs/research/hardware/can-bus.md');
  });

  it('strips path traversal attempts', () => {
    const result = validateSlug('../../etc/passwd');
    expect(result.valid).toBe(true);
    // .. gets stripped, so it resolves within DOCS_BASE
    expect(result.filePath).toContain(DOCS_BASE);
  });

  it('strips nested traversal attempts', () => {
    const result = validateSlug('research/../../../etc/shadow');
    expect(result.valid).toBe(true);
    expect(result.filePath).toContain(DOCS_BASE);
  });

  it('handles empty slug safely', () => {
    const result = validateSlug('');
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe('/fake/docs/.md');
  });

  it('handles slug with only dots', () => {
    const result = validateSlug('...');
    expect(result.valid).toBe(true);
  });

  it('allows deeply nested paths', () => {
    const result = validateSlug('learning/electrical/batteries/lithium');
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe('/fake/docs/learning/electrical/batteries/lithium.md');
  });
});
