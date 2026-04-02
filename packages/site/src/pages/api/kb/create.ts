import type { APIRoute } from 'astro';
import { writeFile, mkdir, access } from 'node:fs/promises';
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
  const { slug, title, content } = body;

  if (!slug || !title) {
    return new Response(JSON.stringify({ error: 'Missing slug or title' }), {
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

  // Check file doesn't already exist
  try {
    await access(filePath);
    return new Response(JSON.stringify({ error: 'Article already exists at this path' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // File doesn't exist — good
  }

  const frontmatter = `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n`;
  const fullContent = frontmatter + (content || '');

  try {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, fullContent, 'utf-8');
    return new Response(JSON.stringify({ ok: true, slug: normalized }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to create article' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
