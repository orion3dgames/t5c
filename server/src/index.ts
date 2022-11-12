// Colyseus + Express

import { createServer } from "http";
import express from "express";
import cors from "cors";

import { Server } from "colyseus";
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from "./rooms/GameRoom";
import { LobbyRoom } from "@colyseus/core";

const port = Number(process.env.port) || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const gameServer = new Server({
  transport: new WebSocketTransport({ 
    server: createServer(app)
  }),
});


// LOBBY ROOM
gameServer.define('lobby', LobbyRoom);

// GAME ROOM
gameServer.define("game_room", GameRoom).enableRealtimeListing();

// Make sure to never call the `simulateLatency()` method in production.
if (process.env.NODE_ENV !== "production") {
    gameServer.simulateLatency(200);
}

// LISTEN
gameServer.listen(port);
console.log("listening on http://localhost:" + port);
