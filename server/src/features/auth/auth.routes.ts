import {Router} from 'express';
import {AuthController }from './auth.controller';
import { catchAsync } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { loginRateLimiter, apiRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema } from "./auth.schema";
import { authenticate } from '../../middleware/auth.middleware';
import { csrfProtection } from '../../middleware/csrf';

export const authRoutes = (authController: AuthController): Router => {
    const router = Router();
    // apply middlewares to authentication routes
    router.post('/register', apiRateLimiter, validate(registerSchema), catchAsync(authController.register));
    router.post('/login', loginRateLimiter, validate(loginSchema), catchAsync(authController.login));
    router.post('/logout',csrfProtection, apiRateLimiter, catchAsync(authController.logout));
    router.post('/refresh',csrfProtection, apiRateLimiter, catchAsync(authController.refresh));
    router.get('/me', apiRateLimiter, authenticate, catchAsync(authController.getCurrentUser));
    return router;
};
