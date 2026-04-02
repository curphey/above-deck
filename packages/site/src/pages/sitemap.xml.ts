import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { createSupabaseServerClient } from '../lib/supabase-server';

export const prerender = false;

export async function GET(context: APIContext) {
  const siteUrl = 'https://abovedeck.io';
  const supabase = createSupabaseServerClient(context.cookies, context.request);

  // Published blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  // Knowledge articles from docs content collection
  const knowledgeArticles = await getCollection('docs', ({ data }) => !data.draft);

  // Active discussions (non-hidden, updated in last 90 days, at least 1 reply)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: discussions } = await supabase
    .from('discussions')
    .select('id, updated_at')
    .eq('hidden', false)
    .gte('updated_at', ninetyDaysAgo.toISOString())
    .gte('reply_count', 1)
    .order('updated_at', { ascending: false });

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.8', changefreq: 'daily' },
    { loc: '/knowledge', priority: '0.8', changefreq: 'weekly' },
    { loc: '/community', priority: '0.7', changefreq: 'daily' },
    { loc: '/tools/solar', priority: '0.9', changefreq: 'monthly' },
  ];

  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    ),
    ...(blogPosts ?? []).map(
      (post) =>
        `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${(post.updated_at ?? post.published_at).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),
    ...knowledgeArticles.map(
      (article) =>
        `  <url>
    <loc>${siteUrl}/knowledge/${article.id.replace(/\.md$/, '')}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),
    ...(discussions ?? []).map(
      (d) =>
        `  <url>
    <loc>${siteUrl}/community/${d.id}</loc>
    <lastmod>${d.updated_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
