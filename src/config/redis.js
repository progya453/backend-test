
/**
 * Redis configuration (Upstash compatible)
 * Works on Windows / Linux / Mac
 * Safe for Socket.IO + caching
 */

const Redis = require("ioredis");
const logger = require("./logger");

if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL is not defined in environment variables");
}

/**
 * Common options for all clients
 * - family: 4 -> Forces IPv4 (Fixes the connect/disconnect loop)
 * - tls: {} -> Ensures secure connection settings are applied
 */
const commonOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // Set to false for Upstash/Serverless to prevent hanging
  family: 4,               // <--- CRITICAL FIX: Forces IPv4
  connectTimeout: 10000,
  tls: {                   // <--- CRITICAL FIX: Ensures SSL works correctly
    rejectUnauthorized: true 
  },
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  }
};

/**
 * Create Redis clients
 */
const redisClient = new Redis(process.env.REDIS_URL, commonOptions);

const pubClient = new Redis(process.env.REDIS_URL, commonOptions);

const subClient = new Redis(process.env.REDIS_URL, commonOptions);

/**
 * Attach safe event handlers
 */
const attachHandlers = (client, name) => {
  client.on("connect", () => {
    logger.info(`✅ ${name} connected`);
  });

  client.on("ready", () => {
    logger.info(`🚀 ${name} ready`);
  });

  client.on("reconnecting", () => {
    logger.warn(`♻️ ${name} reconnecting...`);
  });

  client.on("error", (err) => {
    // Ignore minor network errors during reconnects to keep logs clean
    if (err.message.includes("ECONNRESET")) return; 
    logger.error(`❌ ${name} error`, err);
  });

  client.on("end", () => {
    logger.warn(`🛑 ${name} connection closed`);
  });
};

attachHandlers(redisClient, "Redis");
attachHandlers(pubClient, "Redis Pub");
attachHandlers(subClient, "Redis Sub");

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  logger.warn("🧹 Closing Redis connections...");
  await Promise.all([
    redisClient.quit(),
    pubClient.quit(),
    subClient.quit()
  ]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = {
  redisClient,
  pubClient,
  subClient,
};
// =======
// const Redis = require('ioredis');
// const logger = require('./logger'); // Simple console wrapper

// const redisConfig = {
//   host: process.env.REDIS_HOST || '127.0.0.1',
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
// };

// // 1. General Cache Client
// const redisClient = new Redis(redisConfig);

// // 2. Pub/Sub Clients (Required for Socket.IO Adapter)
// const pubClient = new Redis(redisConfig);
// const subClient = new Redis(redisConfig);

// redisClient.on('connect', () => logger.info('✅ Redis Connected'));
// redisClient.on('error', (err) => logger.error('❌ Redis Error:', err));

// module.exports = { redisClient, pubClient, subClient };
// >>>>>>> rahulpro2/main
