import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

/**
 * Standardized API success responder.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standardized API error responder.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
