import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.MONGODB_URI || "mongodb://localhost:27017/vocabo",
  node_env: process.env.NODE_ENV || "development",
};
