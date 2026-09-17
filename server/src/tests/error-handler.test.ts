import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import request from 'supertest';
import { ZodError } from 'zod';
import { AppError, errorHandler } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

jest.mock('../lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const loggerMock = logger as unknown as { error: jest.Mock };

const req = { method: 'GET', url: '/api/v1/boom' } as unknown as Request;
const next = jest.fn() as unknown as NextFunction;

type FakeResponse = Response & { err?: unknown; log?: unknown };

/** `log` is only set by pino-http, so a missing `log` means pino-http never ran. */
function makeRes(options: { log?: unknown } = {}): FakeResponse {
  const res = {
    statusCode: 200,
    status: jest.fn(),
    json: jest.fn(),
    log: options.log,
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as FakeResponse;
}

describe('errorHandler - handing errors to pino-http', () => {
  it('attaches the original error to res.err for 5xx so the request log is actionable', () => {
    const res = makeRes({ log: {} });
    const error = new AppError('Database connection lost', 500);

    errorHandler(error, req, res, next);

    expect(res.err).toBe(error);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('does not attach res.err for client errors so 4xx stays an access log', () => {
    const res = makeRes({ log: {} });

    errorHandler(new AppError('Organization not found', 404), req, res, next);

    expect(res.err).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('does not attach res.err for validation errors', () => {
    const res = makeRes({ log: {} });

    errorHandler(new ZodError([]), req, res, next);

    expect(res.err).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('normalises non-Error throws into an Error for pino-http', () => {
    const res = makeRes({ log: {} });

    errorHandler('plain string failure', req, res, next);

    expect(res.err).toBeInstanceOf(Error);
    expect((res.err as Error).message).toBe('plain string failure');
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('logs directly when pino-http never ran for the request', () => {
    const res = makeRes();
    const error = new Error('boom');

    errorHandler(error, req, res, next);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, method: 'GET', url: '/api/v1/boom' }),
      'Unhandled request error',
    );
  });

  it('stays quiet when pino-http will log the error itself', () => {
    const res = makeRes({ log: { error: jest.fn() } });

    errorHandler(new Error('boom'), req, res, next);

    expect(loggerMock.error).not.toHaveBeenCalled();
  });
});

type LogEntry = {
  msg?: string;
  err?: { message?: string; stack?: string };
};

describe('errorHandler + pino-http integration', () => {
  function buildApp(logLines: string[]): express.Express {
    const app = express();
    const httpLogger = pino({ level: 'debug' }, { write: (line: string) => logLines.push(line) });

    app.use(pinoHttp({ logger: httpLogger }));
    app.get('/boom', () => {
      throw new Error('original failure');
    });
    app.use(errorHandler);

    return app;
  }

  it('logs the original message and stack instead of "failed with status code 500"', async () => {
    const logLines: string[] = [];
    const app = buildApp(logLines);

    await request(app).get('/boom').expect(500);
    await new Promise((resolve) => setImmediate(resolve));

    const entry = logLines
      .map((line) => JSON.parse(line) as LogEntry)
      .find((line) => line.msg === 'request errored');
    const errMessage = entry?.err?.message ?? '';
    const errStack = entry?.err?.stack ?? '';

    expect(entry).toBeDefined();
    expect(errMessage).toBe('original failure');
    expect(errStack).toContain('original failure');
    expect(errMessage).not.toContain('failed with status code');
  });
});