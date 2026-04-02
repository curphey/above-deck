import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum([
      'electrical',
      'protocols',
      'navigation',
      'weather',
      'passage',
      'hardware',
      'market',
      'engineering',
    ]),
    subcategory: z.string().optional(),
    keyTopics: z.array(z.string()).default([]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    sortOrder: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../docs' }),
  schema: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
    })
    .passthrough(),
});

export const collections = { docs, knowledge };
