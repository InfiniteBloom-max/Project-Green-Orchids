const { z } = require('zod');
const createSchema = z.object({
  key: z.string().min(2).max(100).regex(/^[a-z0-9_]+$/),
  title: z.string().min(2).max(200),
  content: z.string().max(10000).optional(),
  block_type: z.enum(['BANNER', 'PROMO', 'INFO', 'CUSTOM']).default('CUSTOM'),
  image_url: z.string().url().optional(),
  link_url: z.string().url().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_published: z.boolean().default(false),
  meta: z.record(z.any()).optional(),
}).strict();
const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().max(10000).optional(),
  block_type: z.enum(['BANNER', 'PROMO', 'INFO', 'CUSTOM']).optional(),
  image_url: z.string().url().optional().nullable(),
  link_url: z.string().url().optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  is_published: z.boolean().optional(),
  meta: z.record(z.any()).optional(),
}).strict();
module.exports = { createSchema, updateSchema };
