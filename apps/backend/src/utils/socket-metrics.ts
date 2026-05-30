import { Server as SocketServer, Socket } from "socket.io";
import {
  socketConnectionsActive,
  socketConnectionsTotal,
  socketDisconnectionsTotal,
  socketEventsEmitted,
  socketEventsReceived,
  socketAuthFailures,
} from "../monitoring/socket.metrics";

/**
 * Instrument Socket.IO server with metrics tracking
 */
export function instrumentSocketWithMetrics(io: SocketServer) {
  io.on("connection", (socket: Socket) => {
    // Track connection
    socketConnectionsActive.inc({ namespace: socket.nsp.name || "/" });
    socketConnectionsTotal.inc({ namespace: socket.nsp.name || "/" });

    // Track socket auth failures (via middleware errors)
    socket.on("error", (error: any) => {
      if (error?.message?.includes("Unauthorized")) {
        socketAuthFailures.inc({ reason: "invalid_token" });
      } else if (error?.message?.includes("auth")) {
        socketAuthFailures.inc({ reason: "auth_error" });
      }
    });

    // Track disconnection
    socket.on("disconnect", (reason: string) => {
      socketConnectionsActive.dec({ namespace: socket.nsp.name || "/" });
      socketDisconnectionsTotal.inc({
        namespace: socket.nsp.name || "/",
        reason: reason || "unknown",
      });
    });

    // Instrument event emissions with a proxy
    const originalEmit = socket.emit.bind(socket);
    socket.emit = function (event: string, ...args: any[]) {
      socketEventsEmitted.inc({
        event_name: event,
        namespace: socket.nsp.name || "/",
      });
      return originalEmit(event, ...args);
    };

    // Instrument event listening
    const originalOn = socket.on.bind(socket);
    socket.on = function (event: string, callback: any) {
      if (event !== "error" && event !== "disconnect") {
        const wrappedCallback = function (this: any, ...args: any[]) {
          socketEventsReceived.inc({
            event_name: event,
            namespace: socket.nsp.name || "/",
          });
          return callback.apply(this, args);
        };
        return originalOn(event, wrappedCallback);
      }
      return originalOn(event, callback);
    };
  });
}
