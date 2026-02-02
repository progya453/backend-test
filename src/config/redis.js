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