import jwt from "jsonwebtoken";
import key from "../config/key.js";
import { error } from "../config/response.js";
import { Role } from "../controllers/role/role.schema.js";
import Logger from "../utils/logger.js";

export const verifyUser = async (req, res, next) => {
  try {
    let token = req.header("authorization");
    if (!token) return res.status(403).json(error("Access denied. No token provided", res.statusCode));
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, key.SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(error("Invalid login token", res.statusCode));
  }
}

export const grantAccess = (resource) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        if ("role" in req.user) {
          const role = await Role.findById(req.user["role"]).populate("permissions");
          const permissions = role && role.permissions;
          for (let permission of permissions) {
            const perm = permission && permission.name;
            const split_name = perm.split(" ")[0]
            if (split_name.toLowerCase() === "allow" && perm.includes(resource)) { 
              return next();
            }
          }
          return res.status(403).json(error("You don't have permission for this request", res.statusCode));
        } else {
          return res.status(403).json(error("You don't have permission for this request", res.statusCode));
        }
      }
    } catch (err) {
      next(error);
      Logger.error(JSON.stringify(err));
    }
  }
}

// ibuprophine