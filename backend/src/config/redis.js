const redis = require('redis');
const logger = require('./winston');

let redisClient = null;
let isRedisAvailable = false;

// Custom in-memory fallback cache
const memoryCache = {
  store: new Map(),
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  },
  async set(key, value, ttlSeconds) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }
};

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured. Using in-memory fallback cache.');
    return;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.error('Redis reconnection aborted. Falling back to memory cache.');
            isRedisAvailable = false;
            return false; // Stop reconnecting
          }
          return Math.min(retries * 500, 2000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection error: ${err.message}. Caching falls back to In-Memory.`);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server successfully.');
      isRedisAvailable = true;
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn(`Redis failed to initialize: ${error.message}. Caching falls back to In-Memory.`);
    isRedisAvailable = false;
  }
};

// Auto initialize connection
initRedis();

const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.error(`Error reading from Redis key ${key}: ${err.message}`);
        return memoryCache.get(key);
      }
    } else {
      return memoryCache.get(key);
    }
  },

  async set(key, value, ttlSeconds = 60) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
        });
        return true;
      } catch (err) {
        logger.error(`Error writing to Redis key ${key}: ${err.message}`);
        return memoryCache.set(key, value, ttlSeconds);
      }
    } else {
      return memoryCache.set(key, value, ttlSeconds);
    }
  }
};

module.exports = cache;
