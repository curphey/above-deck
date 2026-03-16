import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
  const articles = await getCollection('knowledge', ({ data }) => !data.draft);

  const articleSummaries = articles
    .sort((a, b) => a.data.sortOrder - b.data.sortOrder)
    .map(
      (a) =>
        `### ${a.data.title}
- Category: ${a.data.category}
- Difficulty: ${a.data.difficulty}
- Summary: ${a.data.summary}
- URL: /knowledge/${a.id}`,
    )
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
