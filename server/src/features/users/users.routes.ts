import { Router } from 'express';
import { prisma } from '../../config/database';
import { catchAsync } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { apiRateLimiter } from '../../middleware/rateLimiter';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { csrfProtection } from '../../middleware/csrf';
import { AppError } from '../../middleware/errorHandler';
import { updateProfileSchema } from './users.schema';

/**
 * US-1.7 — PATCH /users/me. Email changes must stay unique; the scalar
 * profile update leaves memberships untouched (they resolve from
 * OrganizationMember, not from the User row).
 */
export const usersRoutes = (): Router => {
  const router = Router();

  router.patch(
    '/me',
    authenticate,
    csrfProtection,
    apiRateLimiter,
    validate(updateProfileSchema),
    catchAsync(async (req: AuthenticatedRequest, res) => {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const { firstName, lastName, email } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        throw new AppError('This email is already in use.', 409);
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, email },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      return res.status(200).json({
        status: 200,
        message: 'Profile updated successfully',
        data: { user },
      });
    }),
  );

  return router;
};
