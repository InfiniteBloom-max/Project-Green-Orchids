const { z } = require('zod');
// Sanity ceiling well above any realistic stock/MOQ scale so legitimate bulk
// returns are never blocked, while still rejecting absurd inputs like 999999+.
const MAX_QUANTITY = 2000000;
const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  order_item_id: z.coerce.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  reason: z.string().trim().min(20).max(1000),
  return_type: z.enum(['DAMAGED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'SHORT_SHIPPED', 'LATE_DELIVERY', 'BUYER_REMORSE', 'OTHER']).default('OTHER'),
}).strict();
const rejectSchema = z.object({ reason: z.string().trim().min(10).max(500) }).strict();
const receiveSchema = z.object({
  disposition: z.enum(['RESTOCK', 'WRITE_OFF']).default('RESTOCK'),
  notes: z.string().max(500).optional(),
}).strict();
const resolveSchema = z.object({
  resolution: z.enum(['REFUND', 'CREDIT_NOTE', 'REPLACEMENT', 'OTHER']),
  adjustment_amount: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
}).strict();
module.exports = { createSchema, rejectSchema, receiveSchema, resolveSchema };
