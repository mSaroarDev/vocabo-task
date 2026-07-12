import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

let io: Server | null = null;

export const initSocket = (socketServer: Server) => {
  io = socketServer;

  socketServer.on("connection", (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      ) as JwtPayload;

      const userId = decoded?.id as string | undefined;
      if (!userId) {
        socket.disconnect();
        return;
      }

      socket.join(userId);
      socket.data.userId = userId;
    } catch {
      socket.disconnect();
    }
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (io) {
    io.to(userId).emit(event, payload);
  }
};
