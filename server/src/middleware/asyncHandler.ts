import { Request, Response, NextFunction } from 'express';

// Handlers may use next() (e.g. resolveOrgContext) and may resolve to void —
// anything the promise resolves to is discarded; errors flow to next().
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function catchAsync (handler: AsyncRouteHandler) {
    return (req: Request, res: Response, next: NextFunction): void => {
        handler(req, res, next)
    .catch((error) => {
        next(error);

    });
    }
}