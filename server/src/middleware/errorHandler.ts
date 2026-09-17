import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

/**
 * A small, explicit application error class. Feature services should throw
 * this (or a subclass) instead of generic Error so the handler below can map
 * it to the right HTTP status consistently across every feature module.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly data?: unknown;

  constructor(message: string, statusCode = 500, data?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/** Maps an unknown thrown value to the HTTP status the client should receive. */
function resolveStatus(err: unknown): number {
  if (err instanceof ZodError) {
    return 400;
  }
  if (err instanceof AppError) {
    return err.statusCode;
  }
  return 500;
}

/** Thrown values are not always Error instances, but pino-http expects one. */
function toError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(typeof err === 'string' ? err : 'Non-error value thrown');
}

/**
 * Central error-handling middleware. Must be registered LAST in app.ts.
 * Produces a consistent JSON error shape and never leaks stack traces
 * to the client in production. Server errors are logged by pino-http's
 * auto-logging through `res.err` (see below), so this handler only logs
 * directly when pino-http never ran for the request.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
 
  const status = resolveStatus(err);

  // 5xx responses are logged by pino-http's auto-logging, which only sees the
  // status code and would otherwise emit a synthetic
  // "failed with status code 500" error whose stack points at pino-http itself
  // (pinojs/pino-http#348). Handing it the original error here is what makes
  // the request log actionable.
  if (status >= 500) {
    const error = toError(err);
    res.err = error;

    // Requests rejected before pino-http runs (helmet/cors/json parsing) never
    // get a response logger, so they would otherwise be logged nowhere.
    if (!res.log) {
      logger.error({ err: error, method: req.method, url: req.url }, 'Unhandled request error');
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      message: 'Validation error',
      data: err.flatten(),
    });
    return;
  }
  // Handle custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      data: err.data ?? {},
    });
    return;
  }

  // Handle generic errors
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    status: 500,
    message: isProd ? 'Internal server error' : (err as Error)?.message || 'Unknown error',
    data: {},
  });
}
