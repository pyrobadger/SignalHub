const app = require('./app');
const logger = require('./config/winston');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`PrimeTrade SignalHub Backend Server successfully started on port ${PORT}`);
  logger.info(`Environment mode: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Interactive API Docs available at http://localhost:${PORT}/api-docs`);
});

// Graceful Shutdown Sequence
const handleGracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown sequence...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      logger.info('Database connections disconnected successfully.');
    } catch (err) {
      logger.error(`Error disconnecting database: ${err.message}`);
    }

    logger.info('Graceful shutdown completed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

// Global uncaught errors trackers
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception! Shutting down...', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Promise Rejection! Shutting down...', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
