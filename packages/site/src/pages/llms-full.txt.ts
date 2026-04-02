import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
  const articles = await getCollection('docs', ({ data }) => !data.draft);

  const articleSummaries = articles
    .map((a) => {
      const slug = a.id.replace(/\.md$/, '');
      const parts = slug.split('/');
      const category = parts[0];
      const title = a.data.title || parts[parts.length - 1];
      const summary = a.data.summary || '';
      return `### ${title}
- Category: ${category}
- Summary: ${summary}
- URL: /knowledge/${slug}`;
    })
    .join('\n\n');

  const body = `# Above Deck
> The sailing platform for modern cruisers

## About
Above Deck helps sailors plan, build, and maintain their boats. Free tools for solar system sizing, energy planning, and cruising knowledge.

## Key URLs
- Solar Calculator: /tools/solar
- Knowledge Base: /knowledge
- Blog: /blog
- Community: /community

## Content Types
- Technical articles on marine electrical systems
- Solar and energy planning tools
- Community discussions

## Knowledge Base Articles

${articleSummaries}

## License
Content is provided for informational purposes. Not financial or engineering advice.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
