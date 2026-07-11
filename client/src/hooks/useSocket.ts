import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected");
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef;
}
