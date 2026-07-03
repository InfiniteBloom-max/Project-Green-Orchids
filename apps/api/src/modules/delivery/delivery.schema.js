const { z } = require('zod');
const assignSchema = z.object({
  assignedTo: z.string().uuid(),
}).strict();
module.exports = { assignSchema };
