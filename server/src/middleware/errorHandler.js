import { logEvent } from '../services/cloudwatchService.js';

/**
 * Central Error Handler Middleware
 * Never exposes raw SQL queries, stack traces, or internal server paths in production.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Structured logging (sanitized)
  logEvent('ERROR', err.message || 'Internal Server Error', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode,
    ...(isDev ? { stack: err.stack } : {})
  });

  res.status(statusCode).json({
    success: false,
    error: isDev || statusCode < 500
      ? (err.message || 'An unexpected error occurred.')
      : 'An internal server error occurred. Please contact campus IT support.',
    ...(isDev && err.stack ? { debugStack: err.stack } : {})
  });
}
