import { redisClient } from "../server";


export const cacheMiddleware = async (req, res, next) => {
    const key = req.originalUrl;
  
    try {
      const cachedData = await redisClient.get(key);
  
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
  
      res.sendResponse = res.json;
      res.json = (body) => {
        // Cache response for 1 hour
        redisClient.set(key, JSON.stringify(body), "EX", 3600);
        res.sendResponse(body);
      };
  
      next();
    } catch (error) {
      console.error("redisClient error:", error);
      next();
    }
  };
  