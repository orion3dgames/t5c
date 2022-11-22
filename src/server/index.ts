// Colyseus + Express

import { createServer } from "http";
import express from "express";
import cors from "cors";
import path from "path";

import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from "./rooms/GameRoom";
import { ChatRoom } from "./rooms/ChatRoom";
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
gameServer.define("game_room", GameRoom);
gameServer.define("chat_room", ChatRoom);

// Make sure to never call the `simulateLatency()` method in production.
if (process.env.NODE_ENV !== "production") {
  gameServer.simulateLatency(250);
}

// LISTEN
gameServer.listen(port).then(()=>{
  
  // server is now running
  console.log("listening on http://localhost:" + port);
  
  // create town
  matchMaker.createRoom("game_room", { location: "town" });

  //create island
  matchMaker.createRoom("game_room", { location: "island" });

});


//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
require('dotenv').config();

let indexPath = "dist/client/";
let clientFile = "index.html";
const clientApp = express();
app.use(express.static(indexPath));
let indexFile = path.resolve(indexPath + clientFile);
clientApp.get('/', function (req, res) {
  console.log('TEST');
  res.sendFile(indexFile);
});