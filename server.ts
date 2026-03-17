import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "./src/types/game";
import {
  createRoom,
  joinRoom,
  rejoinRoom,
  startGame,
  submitRound,
  markReady,
  handleDisconnect,
} from "./src/lib/room-manager";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on("room:create", (playerName, callback) => {
      const code = createRoom(socket.id, playerName, io);
      callback(code);
    });

    socket.on("room:join", (code, playerName, callback) => {
      const result = joinRoom(code, socket.id, playerName, io);
      callback(result.success, result.error);
    });

    socket.on("room:rejoin", (code, playerName, callback) => {
      const success = rejoinRoom(code, socket.id, playerName, io);
      callback(success);
    });

    socket.on("game:start", () => {
      const error = startGame(socket.id, io);
      if (error) socket.emit("room:error", error);
    });

    socket.on("round:submit", (bid, actual, bonus) => {
      const error = submitRound(socket.id, bid, actual, bonus, io);
      if (error) socket.emit("room:error", error);
    });

    socket.on("round:ready", () => {
      const error = markReady(socket.id, io);
      if (error) socket.emit("room:error", error);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      handleDisconnect(socket.id, io);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
