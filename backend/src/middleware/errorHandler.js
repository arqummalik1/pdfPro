/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

const logger = require('../utils/logger');

/**
 * Multer error handler
 */
const handleMulterError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 100MB.',
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'TOO_MANY_FILES',
      message: 'Too many files. Maximum is 30 files.',
    });
  }
  
  if (err.message === 'Only PDF files allowed') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Only PDF files are allowed.',
    });
  }
  
  next(err);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  void next;

  // Log the error
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Multer errors handled above
  if (err.message?.includes('PDF')) {
    return res.status(400).json({
      success: false,
      error: 'PDF_ERROR',
      message: err.message,
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code || 'APPLICATION_ERROR',
      message: err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred. Please try again.' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  handleMulterError,
  errorHandler,
  asyncHandler,
};
