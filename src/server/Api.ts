import express from "express";
import path from "path";
import Logger from "./utils/Logger";
import { generateRandomPlayerName } from "../shared/Utils";
import { GameData } from "./GameData";
import { Database } from "./Database";
import { generateId } from "colyseus";

class Api {
    constructor(app, database: Database) {
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
        app.post("/login", (req, res) => {
            const username: string = (req.query.username as string) ?? "";
            const password: string = (req.query.password as string) ?? "";
            if (username && password) {
                Logger.info("[api][/login] checking password.");
                database
                    .getUser(username, password)
                    .then((user) => {
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

        app.get("/loginWithToken", (req, res) => {
            const token: string = (req.query.token as string) ?? "";
            if (token) {
                Logger.info("[api][/login] checking password.");
                database
                    .getUserWithToken(token)
                    .then((user) => {
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

        app.post("/check", (req, res) => {
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

        app.post("/create_character", (req, res) => {
            const token: string = (req.query.token as string) ?? "";
            const name: string = (req.query.name as string) ?? "";
            const race: string = (req.query.race as string) ?? "";
            const material: number = (req.query.material as number) ?? 0;
            const head: number = (req.query.head as number) ?? 0;
            if (token !== "") {
                database.createCharacter(token, name, race, material, head).then((character) => {
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

        app.get("/get_character", (req, res) => {
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

        app.get("/register", (req, res) => {});

        app.post("/returnRandomUser", (req, res) => {
            let username;
            let password = generateId();
            const doSomething = async (username) =>
                new Promise((resolve) => {
                    database.doesUserNameExists(username).then((doesExists) => {
                        if (doesExists.count > 0) {
                            resolve("no");
                        } else {
                            resolve("ok");
                        }
                    });
                });

            const loop = async (value) => {
                let result = null;
                while (result != "ok") {
                    if (result > 20) {
                        result = "ok";
                    }
                    username = generateRandomPlayerName();
                    result = await doSomething(username);
                    value = value + 1;
                }
            };

            loop(1).then(() => {
                database.saveUser(username, password).then((user) => {
                    let race = GameData.get("race", "humanoid");
                    let material = race.materials[Math.floor(Math.random() * race.materials.length)];
                    let materialIndex = race.materials.indexOf(material);
                    database.createCharacter(user.token, generateRandomPlayerName(), race.key, materialIndex, "Head_Paladin").then((character) => {
                        character.user_id = user.id;
                        character.token = user.token;
                        character.password = user.password;
                        console.log("/returnRandomUser", character.name);
                        return res.send({
                            message: "Successful",
                            user: character,
                        });
                    });
                });
            });
        });

        app.get("/getHelpPage", function (req, res) {
            let page = req.query.page;
            let src = path.join(__dirname + "/../shared/Help/");
            res.sendFile(src + "/" + page + ".html");
        });

        app.get("/load_game_data", (req, res) => {
            return res.send({
                message: "Loaded successfully.",
                data: {
                    items: GameData.load("items"),
                    abilities: GameData.load("abilities"),
                    locations: GameData.load("locations"),
                    races: GameData.load("races"),
                    quests: GameData.load("quests"),
                    help: GameData.load("help"),
                },
            });
        });
    }
}

export { Api };
