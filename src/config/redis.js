// src/config/redis.js
const Redis = require("ioredis");
const logger = require("./logger");

// Use REDIS_URL (recommended)
const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    if (times > 5) return null; // stop retrying
    return Math.min(times * 200, 1000);
  },
});

// Separate clients for pub/sub
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => logger.info("✅ Redis Connected"));
[redisClient, pubClient, subClient].forEach((client, idx) => {
  client.on("connect", () =>
    logger.info(`✅ Redis client ${idx} connected`)
  );

  client.on("error", (err) =>
    logger.error(`❌ Redis client ${idx} error:`, err.message)
  );
});


module.exports = { redisClient, pubClient, subClient };
