// middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.util';
import { AppError } from '../middleware/errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.id,
    };

    next();
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
};