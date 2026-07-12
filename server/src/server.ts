import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import { initSocket } from "./app/socket";
import { startBot } from "./app/modules/auth/telegram.bot";

async function main() {
  try {
    await mongoose.connect(config.database_url);
    console.log("Connected to MongoDB");

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: { origin: config.frontendUrl, credentials: true },
    });
    initSocket(io);

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    startBot();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
