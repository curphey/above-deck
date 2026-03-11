import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { createSupabaseServerClient } from '../lib/supabase-server';

export const prerender = false;

export async function GET(context: APIContext) {
  const supabase = createSupabaseServerClient(context.cookies);
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, description, category, tags, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  return rss({
    title: 'Above Deck',
    description: 'Practical guides and stories from the cruising community.',
    site: context.site!,
    items: (posts ?? []).map((post) => ({
      title: post.title,
      pubDate: new Date(post.published_at),
      description: post.description,
      link: `/blog/${post.slug}`,
      categories: [post.category, ...(post.tags ?? [])],
    })),
  });
}
