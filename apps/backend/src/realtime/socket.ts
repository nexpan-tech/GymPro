import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { verifySocketToken, SocketUser } from "./socket-auth";
import { SOCKET_EVENTS } from "./socket-events";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisConnection } from "../config/redis";
import { instrumentSocketWithMetrics } from "../utils/socket-metrics";

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        const isDev = process.env.NODE_ENV !== 'production'
        const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin)
        if (allowedOrigins.includes(origin) || (isDev && isLocalhost)) return callback(null, true)
        callback(new Error('CORS: origin not allowed'))
      },
      credentials: true,
    },
  });

  const pubClient = createRedisConnection();
  const subClient = createRedisConnection();

    io.adapter(createAdapter(pubClient, subClient));

    console.log("✅ Socket.IO Redis adapter enabled");

  // Instrument socket with metrics
  instrumentSocketWithMetrics(io);

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization;

    const user = verifySocketToken(token);

    if (!user) {
      return next(new Error("Unauthorized socket connection"));
    }

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser;

    socket.join(`user:${user.id}`);

    if (user.gymId) {
      socket.join(`gym:${user.gymId}`);
    }

    socket.emit(SOCKET_EVENTS.CONNECTED, {
      success: true,
      message: "Socket connected",
      userId: user.id,
      gymId: user.gymId,
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${user.id}`);
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitToUser(userId: string, event: string, payload: any) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToGym(gymId: string, event: string, payload: any) {
  io?.to(`gym:${gymId}`).emit(event, payload);
}

export function emitNotificationToUser(userId: string, payload: any) {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, payload);
}

export function emitDashboardUpdate(gymId: string, payload: any) {
  emitToGym(gymId, SOCKET_EVENTS.DASHBOARD_UPDATE, payload);
}