const { ZodError } = require('zod');

/**
 * Validate request body/params/query against a Zod schema.
 * Uses strict() to reject unknown keys.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.strict().parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.strict().parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.strict().parse(req.query);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: err.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
