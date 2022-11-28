// Colyseus + Express

import { createServer } from "http";
import express from "express";
import cors from "cors";
import path from "path";

import { Server, matchMaker, LobbyRoom } from "@colyseus/core";
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameRoom } from "./rooms/GameRoom";
import { ChatRoom } from "./rooms/ChatRoom";

import Logger from "../shared/Logger";

//////////////////////////////////////////////////
///////////// COLYSEUS GAME SERVER ///////////////
//////////////////////////////////////////////////

const port = Number(process.env.port) || 3000;
const app = express();
app.use(cors());
app.use(express.json());

// create colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({ 
    server: createServer(app)
  }),
});

// define all rooms
gameServer.define('lobby', LobbyRoom);
gameServer.define("game_room", GameRoom);
gameServer.define("chat_room", ChatRoom);

// on localhost, simulate bad latency
if (process.env.NODE_ENV !== "production") {
  gameServer.simulateLatency(250);
}

// listen
gameServer.listen(port).then(()=>{
  
  // server is now running
  Logger.info("listening on http://localhost:"+ port)
  
  // create town room
  matchMaker.createRoom("game_room", { location: "town" });

  // create island room
  matchMaker.createRoom("game_room", { location: "island" });

});


//////////////////////////////////////////////////
//// SERVING CLIENT DIST FOLDER TO EXPRESS ///////
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