// Colyseus + Express
import { createServer } from "http";
import express, { Request } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

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
  Logger.info("gameserver listening on http://localhost:"+ port)
  
  // create town room
  matchMaker.createRoom("game_room", { location: "town" });

  // create island room
  matchMaker.createRoom("game_room", { location: "island" });

});


//////////////////////////////////////////////////
//// SERVING CLIENT DIST FOLDER TO EXPRESS ///////
//////////////////////////////////////////////////

// initialize database
import databaseInstance from "../shared/Database";
import { PlayerUser } from "../shared/types";

// start db
let database = new databaseInstance();

// default to built client index.html
let indexPath = "dist/client/";
let clientFile = "index.html";

// serve client
app.use(express.static(indexPath));
let indexFile = path.resolve(indexPath + clientFile);
app.get('/', function (req, res) {
  res.sendFile(indexFile);
});

app.get('/login', function (req, res) {
  const username:string = req.query.username as string ?? '';
  const password:string = req.query.password as string ?? '';
  if(username && password){
    database.getUser(username, password).then((user:PlayerUser)=>{
      if(!user) {
        return database.saveUser(username, password);
      }
      return database.refreshToken(user.id);
    }).then((user)=>{
      return res.send({
        message: "Login Successful",
        user: user
      });
    })
  }else{
    return res.status(400).send({
      message: "Wrong Parameters"
    });
  }
});

app.post('/check', function (req, res) {
  const token:string = req.query.token as string ?? '';
  if(token !== ""){
    database.checkToken(token).then((user)=>{
      if(!user) {
        return res.status(400).send({
          message: "Check Failed"
        });
      }else{
        return res.send({
          message: "Check Successful",
          user: user
        });
      }
    })
  }else{
    return res.status(400).send({
      message: "Check Failed"
    });
  }
});

app.post('/create_character', function (req, res) {
  const token:string = req.query.token as string ?? '';
  const name:string = req.query.name as string ?? '';
  if(token !== ""){
    database.createCharacter(token, name).then((character)=>{
      if(!character) {
        return res.status(400).send({
          message: "Create Failed"
        });
      }else{
        return res.send({
          message: "Create Successful",
          character: character
        });
      }
    })
  }else{
    return res.status(400).send({
      message: "Create Failed"
    });
  }
});

app.get('/register', function (req, res) {
  
});



