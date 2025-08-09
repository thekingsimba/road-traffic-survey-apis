import { createServer } from "http";
import express from "express";
import basicAuth from "express-basic-auth";
import { morganMiddleware } from "./config/morganMiddleware.js";
import Logger from "./utils/logger.js";
import { db } from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import router from "./controllers/index.js";
import "passport";
import YAML from "yamljs";
import { scheduler } from "./utils/scheduler.js";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import events from "events";

events.EventEmitter.defaultMaxListeners = 1000;

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerJSDoc = YAML.load(path.join(__dirname, "./api.yml"));
const app = express();

const httpServer = createServer(app);
const port = process.env.PORT || 5000;

const limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // Max requests per window
};

function job_runner() {
  try {
    db();
    scheduler();
  } catch (err) {
    Logger.error(err.message);
  }
}

app.use(morganMiddleware);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Cache-Control", "no-cache");
  next();
});
app.use(cookieParser());
app.get("/health", (req, res) => {
  res.send("Status Ok!!!!!!");
});
app.use(
  "/api_docs",
  basicAuth({ users: { police_dog: "big_padlockee" }, challenge: true }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerJSDoc)
);

router(app);

httpServer.listen(port, () => {
  job_runner();
  Logger.log("info", `Server is up and running at port ${port}`);
});

export default app;
