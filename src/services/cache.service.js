const { redisClient } = require('../config/redis');

class CacheService {
  /**
   * Smart Get: Returns parsed JSON or null
   */
  async get(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Smart Set: Automatically stringifies and sets TTL
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds - Default 1 hour
   */
  async set(key, value, ttlSeconds = 3600) {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Atomic Increment (Perfect for XP/Streaks)
   * This handles race conditions if 2 requests come in simultaneously.
   */
  async increment(key, amount = 1) {
    return await redisClient.incrby(key, amount);
  }

  /**
   * Leaderboard Logic (Sorted Sets)
   * Adds user to a live leaderboard with O(log(N)) complexity
   */
  async updateLeaderboard(leaderboardName, userId, score) {
    // ZADD: Update score, creates member if new
    await redisClient.zadd(`leaderboard:${leaderboardName}`, score, userId);
  }

  async delete(key) {
    await redisClient.del(key);
  }
}

module.exports = new CacheService();