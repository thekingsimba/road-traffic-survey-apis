import { redisClient } from "../server";


export const clearDynamicCacheMiddleware = (keyResolver) => async (req, res, next) => {

    // using the unique url with id like caching key 
    const cacheKey = typeof keyResolver === "function" ? await keyResolver(req) : keyResolver;
  
    if (!cacheKey) {
        return res.status(400).json({ error: "Cache key is required" });
    }
  
    try {
        await redisClient.del(cacheKey);
        next();
    } catch (error) {
        console.error("Error clearing cache:", error);
        res.status(500).json({ error: "Internal server error" });
    }
  };
  