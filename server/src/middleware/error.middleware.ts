import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiErrorResponse } from '../types/index.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or parameters.',
        details: issues,
      },
    });
    return;
  }

  // 2. Syntax Errors (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // 3. Known Operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`AppError [${err.code}]:`, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: isProd && err.statusCode >= 500 ? 'Internal Server Error' : err.message,
        details: !isProd ? err.details : undefined,
      },
    });
    return;
  }

  // 4. Unknown Unhandled Errors
  const status = Number(err.status || err.statusCode) || 500;
  logger.error('Unhandled server error:', err.message || String(err));

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: isProd && status >= 500 ? 'Internal Server Error' : err.message || 'An unexpected error occurred.',
      details: !isProd ? err.details || err.stack : undefined,
    },
  });
}
