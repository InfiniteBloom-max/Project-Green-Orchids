const { z } = require('zod');
const paySchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'ONLINE', 'CREDIT_NOTE']).default('ONLINE'),
  reference: z.string().max(200).optional(),
}).strict();
module.exports = { paySchema };
