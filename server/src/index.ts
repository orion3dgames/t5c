// Colyseus + Express
import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";

import { MyRoom } from "./rooms/MyRoom";
import { LobbyRoom } from "@colyseus/core";

const port = Number(process.env.port) || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const gameServer = new Server({
  server: createServer(app),
});

gameServer.listen(port);

/**
 * Define your room handlers:
 */
 gameServer.define('lobby', LobbyRoom);

 // Expose your game room with realtime listing enabled.
 gameServer.define("my_room", MyRoom).enableRealtimeListing();

 // Make sure to never call the `simulateLatency()` method in production.
 if (process.env.NODE_ENV !== "production") {
     gameServer.simulateLatency(200);
 }