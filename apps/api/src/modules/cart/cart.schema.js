const { z } = require('zod');
// Sanity ceiling well above any realistic stock/MOQ scale (seed data tops out around
// 500 units per product) so legitimate bulk orders are never blocked, while still
// rejecting absurd inputs like 999999+.
const MAX_QUANTITY = 2000000;
const addItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
}).strict();
const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(MAX_QUANTITY),
}).strict();
// Matches the shape the web cartStore actually sends: { items: [{ productId, quantity }] }
const replaceCartSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.number().int().min(0).max(MAX_QUANTITY),
  })),
}).strict();
module.exports = { addItemSchema, updateItemSchema, replaceCartSchema };
