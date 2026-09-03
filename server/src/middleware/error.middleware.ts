import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiErrorResponse } from '../types/index.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  const status = Number(err.status || err.statusCode) || 500;
  const isProd = env.NODE_ENV === 'production';

  logger.error('Unhandled request error:', err.message || String(err));

  res.status(status).json({
    error: {
      message: isProd && status === 500 ? 'Internal Server Error' : err.message || 'An unexpected error occurred.',
      code: err.code || 'INTERNAL_ERROR',
      details: !isProd ? err.details : undefined,
    },
  });
}
