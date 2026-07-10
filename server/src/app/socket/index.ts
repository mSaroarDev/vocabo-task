import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import TeamModel from "../modules/team/team.model";
import { setSocketIO } from "../modules/notification/notification.services";

let io: SocketIOServer | null = null;

const initializeSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      ) as { id: string; email: string };
      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId;

    try {
      const teams = await TeamModel.find({ "members.user": userId }).select("_id").lean();

      for (const team of teams) {
        socket.join(`team:${team._id}`);
      }

      socket.join(`user:${userId}`);
    } catch {
      // fail silently
    }

    socket.on("disconnect", () => {
      // cleanup is automatic
    });
  });

  setSocketIO(io);

  return io;
};

const getIO = () => io;

export { initializeSocket, getIO };
