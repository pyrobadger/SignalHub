const logger = require('../config/winston');
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // 1. Zod Validation Error Handler
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  // 2. Prisma Known Request Error Handlers
  if (err.code === 'P2002') {
    statusCode = 409;
    const targetFields = err.meta ? err.meta.target : [];
    message = `A record with this ${targetFields.join(', ')} already exists.`;
    errors = [{
      field: targetFields.join(', '),
      message: `${targetFields.join(', ')} must be unique.`,
    }];
  }

  // Log the error using winston
  logger.error(message, {
    correlationId: req.correlationId,
    endpoint: req.originalUrl,
    userId: req.user ? req.user.id : undefined,
    stack: err.stack,
    statusCode,
  });

  // Keep response format clean
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  });
};

module.exports = errorHandler;
