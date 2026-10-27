import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    kind: z.enum(['overview', 'runtime', 'api', 'guide', 'cli', 'policy']).optional(),
    entrypoint: z.string().optional(),
    backend: z.string().optional(),
    install: z.string().optional(),
  }),
})

export const collections = { docs }
