import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { requireAdmin } from '../../../lib/auth';

export const prerender = false;

const DOCS_BASE = resolve(process.cwd(), '../../docs');

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    await requireAdmin(cookies, request);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { slug, content } = body;

  if (!slug || typeof content !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing slug or content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prevent path traversal
  const normalized = slug.replace(/\.\./g, '').replace(/^\/+/, '');
  const filePath = resolve(DOCS_BASE, `${normalized}.md`);
  if (!filePath.startsWith(DOCS_BASE)) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf-8');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
