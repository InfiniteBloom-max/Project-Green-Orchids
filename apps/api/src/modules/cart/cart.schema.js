const { z } = require('zod');
const addItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.number().int().min(1),
}).strict();
const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
}).strict();
// Matches the shape the web cartStore actually sends: { items: [{ productId, quantity }] }
const replaceCartSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.number().int().min(0),
  })),
}).strict();
module.exports = { addItemSchema, updateItemSchema, replaceCartSchema };
