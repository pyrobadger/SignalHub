const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for JSON file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for readable console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logStr = `[${timestamp}] ${level}: ${message}`;
    
    // Add extra details if present
    if (meta.correlationId) {
      logStr += ` | CID: ${meta.correlationId}`;
    }
    if (meta.userId) {
      logStr += ` | UID: ${meta.userId}`;
    }
    if (meta.endpoint) {
      logStr += ` | Route: ${meta.endpoint}`;
    }
    
    // If there is an error stack trace, display it
    if (stack) {
      logStr += `\nStack: ${stack}`;
    }
    
    // Print other metadata if not empty and not matching routes
    const keys = Object.keys(meta).filter(k => !['correlationId', 'userId', 'endpoint'].includes(k));
    if (keys.length > 0) {
      logStr += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return logStr;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

module.exports = logger;
