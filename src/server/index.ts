// Colyseus + Express
import { createServer } from "http";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import { Server, matchMaker } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom";
import { ChatRoom } from "./rooms/ChatRoom";

import databaseInstance from "../shared/Database";
import { PlayerUser } from "../shared/types";
import Logger from "../shared/Logger";
import Config from "../shared/Config";
import { generateRandomPlayerName } from "../shared/Utils";

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
    constructor() {
        this.init();
    }

    async init() {
        // start db
        let database = new databaseInstance();

        await database.initDatabase();
        await database.createDatabase();

        //////////////////////////////////////////////////
        ///////////// COLYSEUS GAME SERVER ///////////////
        //////////////////////////////////////////////////

        const port = Config.port;
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
        //////////////////////////////////////////////////

        // default to built client index.html
        let indexPath = "dist/client/";
        let clientFile = "index.html";

        // serve client
        app.use(express.static(indexPath));
        let indexFile = path.resolve(indexPath + clientFile);
        app.get("/", function (req, res) {
            res.sendFile(indexFile);
        });

        //////////////////////////////////////////////////
        ///////////// ESPRESS MINI API ///////////////////
        //////////////////////////////////////////////////
        app.get("/login", function (req, res) {
            const username: string = (req.query.username as string) ?? "";
            const password: string = (req.query.password as string) ?? "";
            if (username && password) {
                Logger.info("[api][/login] checking password.");
                database
                    .getUser(username, password)
                    .then((user: PlayerUser) => {
                        if (!user) {
                            Logger.info("[api][/login] user not found, creating new user.");
                            return database.saveUser(username, password);
                        }

                        Logger.info("[api][/login] user found, refreshing login token.");
                        return database.refreshToken(user.id);
                    })
                    .then((user) => {
                        Logger.info("[api][/login] login succesful.");
                        return res.send({
                            message: "Login Successful",
                            user: user,
                        });
                    });
            } else {
                Logger.error("[api][/login] login failed.");
                return res.status(400).send({
                    message: "Wrong Parameters",
                });
            }
        });

        app.get("/loginWithToken", function (req, res) {
            const token: string = (req.query.token as string) ?? "";
            if (token) {
                Logger.info("[api][/login] checking password.");
                database
                    .getUserWithToken(token)
                    .then((user: PlayerUser) => {
                        if (!user) {
                            Logger.info("[api][/login] invalid token.");
                        }

                        Logger.info("[api][/login] valid token, refreshing login token.");
                        return database.refreshToken(user.id);
                    })
                    .then((user) => {
                        Logger.info("[api][/login] login succesful.");
                        return res.send({
                            message: "Login Successful",
                            user: user,
                        });
                    });
            }
        });

        app.post("/check", function (req, res) {
            const token: string = (req.query.token as string) ?? "";
            if (token !== "") {
                database.checkToken(token).then((user) => {
                    if (!user) {
                        return res.status(400).send({
                            message: "Check Failed",
                        });
                    } else {
                        return res.send({
                            message: "Check Successful",
                            user: user,
                        });
                    }
                });
            } else {
                return res.status(400).send({
                    message: "Check Failed",
                });
            }
        });

        app.post("/create_character", function (req, res) {
            const token: string = (req.query.token as string) ?? "";
            const name: string = (req.query.name as string) ?? "";
            const race: string = (req.query.race as string) ?? "";
            const race_color: string = (req.query.color as string) ?? "";
            if (token !== "") {
                database.createCharacter(token, name, race, race_color).then((character) => {
                    if (!character) {
                        return res.status(400).send({
                            message: "Create Failed",
                        });
                    } else {
                        return res.send({
                            message: "Create Successful",
                            character: character,
                        });
                    }
                });
            } else {
                return res.status(400).send({
                    message: "Create Failed",
                });
            }
        });

        app.get("/get_character", function (req, res) {
            const character_id: string = (req.query.character_id as string) ?? "";
            database.getCharacter(parseInt(character_id)).then((character) => {
                if (!character) {
                    return res.status(400).send({
                        message: "Get Character Failed",
                    });
                } else {
                    return res.send({
                        message: "Get Character Successful",
                        character: character,
                    });
                }
            });
        });

        app.get("/register", function (req, res) {});

        app.get("/returnRandomUser", function (req, res) {
            database.saveUser(generateRandomPlayerName(), generateRandomPlayerName()).then((user) => {
                database.createCharacter(user.token, generateRandomPlayerName(), "male_knight", "knight_texture.png").then((character) => {
                    character.user_id = user.id;
                    character.token = user.token;
                    character.password = user.password;
                    return res.send({
                        message: "Successful",
                        user: character,
                    });
                });
            });
        });

        /*
        app.get("/returnRandomUser", function (req, res) {
            database.returnRandomUserAndChar().then((user) => {
                database.getUser(user.username, user.password).then((user) => {
                    return res.send({
                        message: "Successful",
                        user: user,
                    });
                });
            });
        });*/

        app.get("/getHelpPage", function (req, res) {
            let page = req.query.page;
            let src = path.join(__dirname + "/../shared/Help/");
            res.sendFile(src + "/" + page + ".html");
        });
    }
}

new GameServer();
