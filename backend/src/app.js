const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Load environment variables for local/testing
require('dotenv').config();

const correlation = require('./middleware/correlation');
const requestLogger = require('./middleware/requestLogger');
const limiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const signalRoutes = require('./routes/signalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const marketRoutes = require('./routes/marketRoutes');

const prisma = require('./config/prisma');
const cache = require('./config/redis');
const AppError = require('./utils/AppError');
const swaggerDocument = require('./docs/swagger.json');

const app = express();

// 1. Core Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID'],
  credentials: true,
}));

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Infrastructure Middlewares
app.use(correlation);
app.use(requestLogger);

// 4. Rate Limiter (applied globally to all API routes)
app.use('/api', limiter);

// 5. Swagger UI Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 6. API Routing
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/signals', signalRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/market', marketRoutes);

// 7. Health Check API Endpoint (with DB & Redis metrics)
app.get('/health', async (req, res, next) => {
  try {
    // Check DB
    let dbStatus = 'CONNECTED';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'DISCONNECTED';
    }

    // Check Redis
    let redisStatus = 'CONNECTED';
    try {
      await cache.set('health_check', 'ok', 2);
      const val = await cache.get('health_check');
      if (val !== 'ok') redisStatus = 'DEGRADED';
    } catch (err) {
      redisStatus = 'DISCONNECTED';
    }

    const health = {
      success: true,
      message: 'System is healthy.',
      data: {
        status: dbStatus === 'CONNECTED' && redisStatus === 'CONNECTED' ? 'UP' : 'DEGRADED',
        database: dbStatus,
        cache: redisStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date().toISOString(),
      }
    };

    const statusCode = health.data.status === 'UP' ? 200 : 500;
    return res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});

// 8. Catch-all for Unhandled Routes
app.use('*', (req, res, next) => {
  next(new AppError(`Endpoint '${req.originalUrl}' not found on this server.`, 404));
});

// 9. Global Error Boundary Middleware
app.use(errorHandler);

module.exports = app;
