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
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

events.EventEmitter.defaultMaxListeners = 1000;

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerJSDoc = YAML.load(path.join(__dirname, "./api.yml"));
const app = express();

const httpServer = createServer(app);
const port = process.env.PORT || 5000;

const apiHost = process.env.API_HOST || `localhost:${port}`;

swaggerJSDoc.host = apiHost;

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

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://16.170.162.77",
    ];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // In production, only allow specific origins
  if (process.env.NODE_ENV === "production") {
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      // Block unauthorized origins in production
      return res.status(403).json({ error: "Origin not allowed" });
    }
  } else {
    // Development: allow all origins but handle credentials properly
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Note: When Allow-Origin is *, credentials cannot be true
    res.setHeader("Access-Control-Allow-Credentials", "false");
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, ClientId"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Cache-Control", "no-cache");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

app.use(cookieParser());
app.get("/api/health", (req, res) => {
  res.send("Status Ok ----------------- !");
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
