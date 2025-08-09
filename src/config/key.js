import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default {
  PORT: process.env.PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PARAMS: process.env.DB_PARAMS,
  // S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  // S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  // S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  // SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
};
