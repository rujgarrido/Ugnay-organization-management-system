import type {Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Reusable request-validation middleware factory.
 * Usage in a feature route file (once features exist):
 *
 *   router.post('/', validate(createTaskSchema), createTaskController);
 *
 * Invalid input is thrown as a ZodError, which the central errorHandler
 * converts into a consistent 400 response — no per-route error handling needed.
 */

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
   
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data; // Replace req.body with the validated data
    next();
  };
}
