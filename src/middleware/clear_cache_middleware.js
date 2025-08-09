import { redisClient } from "../server";

export const clearCacheMiddleware = (cacheKey) => async (req, res, next) => {
    try {
      await redisClient.del(cacheKey);
      next();
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  