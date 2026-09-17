import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';

// Generates a JWT access token with the given payload and expiration time
export const generateAccessToken = (payload: { id: string }) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

// Generates a secure random refresh token
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('base64url');
};

// Hashes the provided refresh token using SHA-256
export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verifies the provided JWT access token and returns the decoded payload
export const verifyAccessToken = (token: string): { id: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    return decoded;
    
  } catch (err) {   
    throw new AppError('Invalid or expired access token', 401 );
  }
}
