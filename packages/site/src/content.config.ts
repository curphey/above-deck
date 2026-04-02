import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

export const collections = { docs };
