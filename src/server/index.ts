// Colyseus + Express
import { createServer } from "http";
import express from "express";
import cors from "cors";

import { Server, matchMaker } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom";
import { ChatRoom } from "./rooms/ChatRoom";

import { Api } from "./Api";
import { Database } from "./Database";

import Logger from "./utils/Logger";
import { Config } from "../shared/Config";

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////

/*
if (fs.existsSync(Config.databaseLocation)) {
    fs.unlink(Config.databaseLocation, (err) => {
        if (err) {
            Logger.error("Could not delete the file: " + Config.databaseLocation, err);
        }
        Logger.info("File is deleted: " + Config.databaseLocation);
    });
}*/

class GameServer {
    public api;
    public database;
    public config: Config;

    constructor() {
        this.config = new Config();
        this.init();
    }

    async init() {
        // start db
        this.database = new Database(this.config);
        await this.database.initDatabase();
        await this.database.createDatabase();

        //////////////////////////////////////////////////
        ///////////// COLYSEUS GAME SERVER ///////////////
        //////////////////////////////////////////////////

        const port = this.config.port;
        const app = express();
        app.use(cors());
        //app.use(express.json());

        // create colyseus server
        const gameServer = new Server({
            transport: new WebSocketTransport({
                server: createServer(app),
            }),
        });

        // define all rooms
        gameServer.define("game_room", GameRoom);
        gameServer.define("chat_room", ChatRoom);

        // on localhost, simulate bad latency
        if (process.env.NODE_ENV !== "production") {
            Logger.info("[gameserver] Simulating 500ms of latency.");
            gameServer.simulateLatency(200);
        }

        // listen
        gameServer.listen(port).then(() => {
            // server is now running
            Logger.info("[gameserver] listening on http://localhost:" + port);

            // create town room
            matchMaker.createRoom("game_room", { location: "lh_town" });

            // create island room
            matchMaker.createRoom("game_room", { location: "lh_dungeon_01" });
        });

        // start dev routes
        if (process.env.NODE_ENV !== "production") {
            // start monitor
            app.use("/colyseus", monitor());
            // bind it as an express middleware
            //app.use("/playground", playground);
        }

        //////////////////////////////////////////////////
        //// SERVING CLIENT DIST FOLDER TO EXPRESS ///////
        /////////////////////////////////////////////////

        this.api = new Api(app, this.database);
    }
}

new GameServer();
