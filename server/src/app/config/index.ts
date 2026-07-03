import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.MONGODB_URI || "mongodb://localhost:27017/vocabo",
  node_env: process.env.NODE_ENV || "development",
  r2: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || "vocabo-storage",
    publicUrl: process.env.R2_PUBLIC_URL || "",
    s3Api: process.env.CLOUDFLARE_S3_API || "",
  },
};
