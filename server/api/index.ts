import mongoose from "mongoose";
import config from "../src/app/config";
import app from "../src/app";

const MONGO_URI = config.database_url;

declare global {
  // eslint-disable-next-line no-var
  var _mongoConnection: Promise<typeof mongoose> | null | undefined;
}

function connectToDatabase(): Promise<typeof mongoose> {
  if (!global._mongoConnection) {
    global._mongoConnection = mongoose
      .connect(MONGO_URI)
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((err) => {
        global._mongoConnection = null;
        throw err;
      });
  }
  return global._mongoConnection;
}

export default async function handler(req: any, res: any) {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    console.error("Handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Internal Server Error" }));
  }
}
