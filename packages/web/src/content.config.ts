import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(['builder', 'sailing', 'electrical', 'destinations']),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Above Deck'),
    estimatedReadTime: z.number().optional(),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const knowledge = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum([
      'electrical',
      'engine-mechanical',
      'plumbing-water',
      'safety-emergency',
      'provisioning-living',
      'destinations-cruising',
    ]),
    keyTopics: z.array(z.string()).default([]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    sortOrder: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, knowledge };
