const { z } = require('zod');
const approveSchema = z.object({ note: z.string().max(500).optional() }).strict();
const rejectSchema = z.object({ note: z.string().min(5).max(500) }).strict();
module.exports = { approveSchema, rejectSchema };
