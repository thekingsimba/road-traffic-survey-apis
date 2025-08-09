import mongoose from "mongoose";
import key from "./key.js";
import Logger from "../utils/logger.js";

export const db = async () => {
  mongoose.Promise = global.Promise;

  try {
    await mongoose.connect(
      `mongodb+srv://${key.DB_USER}:${key.DB_PASSWORD}@${key.DB_HOST}/${key.DB_PARAMS}`
    );
    Logger.info("Successfully Connected to MongoDB");
  } catch (err) {
    Logger.error(err.message);
    process.exit(1); // Optional: exit process on DB connection failure
  }
};
