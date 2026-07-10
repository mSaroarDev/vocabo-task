import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import { startBot } from "./app/modules/auth/telegram.bot";

async function main() {
  try {
    await mongoose.connect(config.database_url);
    console.log("Connected to MongoDB");
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    startBot();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
