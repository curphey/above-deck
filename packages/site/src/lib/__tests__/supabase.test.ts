import { describe, it, expect } from 'vitest';

describe('supabase client', () => {
  it('exports createSupabaseClient function', async () => {
    const { createSupabaseClient } = await import('../supabase');
    expect(typeof createSupabaseClient).toBe('function');
  });
});
