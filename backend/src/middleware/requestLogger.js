const logger = require('../config/winston');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    correlationId: req.correlationId,
    endpoint: req.originalUrl,
    method: req.method,
    userId: req.user ? req.user.id : undefined,
  });

  // Intercept response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Response completed: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`, {
      correlationId: req.correlationId,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.user ? req.user.id : undefined,
    });
  });

  next();
};

module.exports = requestLogger;
