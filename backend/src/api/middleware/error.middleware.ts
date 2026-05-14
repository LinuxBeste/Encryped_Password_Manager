import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Global error handler; hides internal details for non-operational errors
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    logger.error('Unexpected error', { error: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// Creates an operational error with a specific HTTP status code
export function createError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
