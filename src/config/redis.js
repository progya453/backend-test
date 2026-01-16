const Redis = require('ioredis');
const logger = require('./logger'); // Simple console wrapper

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ...(process.env.REDIS_TLS === 'true' && { 
    tls: {
      rejectUnauthorized: false 
    } 
  }),
  retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
};

// 1. General Cache Client
const redisClient = new Redis(redisConfig);

// 2. Pub/Sub Clients (Required for Socket.IO Adapter)
const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('✅ Redis Connected'));
redisClient.on('error', (err) => logger.error('❌ Redis Error:', err));

module.exports = { redisClient, pubClient, subClient };