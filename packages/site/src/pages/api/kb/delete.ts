import type { APIRoute } from 'astro';
import { rename, mkdir, access } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { requireAdmin } from '../../../lib/auth';

export const prerender = false;

const DOCS_BASE = resolve(process.cwd(), '../../docs');
const TRASH_DIR = resolve(DOCS_BASE, '.trash');

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
  const { slug } = body;

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
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

  // Check file exists
  try {
    await access(filePath);
  } catch {
    return new Response(JSON.stringify({ error: 'Article not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Move to .trash/ preserving directory structure
  const relativePath = filePath.slice(DOCS_BASE.length);
  const trashPath = resolve(TRASH_DIR, `.${relativePath}`);

  try {
    await mkdir(dirname(trashPath), { recursive: true });
    await rename(filePath, trashPath);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to delete' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
