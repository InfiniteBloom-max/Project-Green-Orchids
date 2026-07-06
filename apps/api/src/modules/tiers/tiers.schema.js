const { z } = require('zod');
const createSchema = z.object({
  name: z.string().trim().min(2).max(50),
  discount: z.coerce.number().min(0).max(100),
  creditLimit: z.coerce.number().min(0),
  paymentTerms: z.string().trim().min(2).max(50),
  minOrders: z.coerce.number().int().min(0),
}).strict();
const updateSchema = createSchema.partial();
module.exports = { createSchema, updateSchema };
