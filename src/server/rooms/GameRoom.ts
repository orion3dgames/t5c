import http from "http";
import { Room, Client, Delayed } from "@colyseus/core";
import { GameRoomState } from "./state/GameRoomState";
import databaseInstance from "../../shared/Database";
import Config from "../../shared/Config";
import Logger from "../../shared/Logger";
import loadNavMeshFromFile from "../../shared/Utils/loadNavMeshFromFile";
import { PlayerInputs } from "../../shared/types";
import { NavMesh } from "../../shared/yuka";
import { dataDB } from "../../shared/Data/dataDB";

import { Auth } from "./commands";
import { Entity, PlayerSchema } from "./schema";

export class GameRoom extends Room<GameRoomState> {
    public maxClients = 64;
    public autoDispose = false;
    public database: any;
    public delayedInterval!: Delayed;
    public navMesh: NavMesh;

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // on create room event
    async onCreate(options: any) {
        Logger.info("[gameroom][onCreate] game room created: " + this.roomId, options);

        this.setMetadata(options);

        // initialize navmesh
        const navMesh = await loadNavMeshFromFile(options.location);
        this.navMesh = navMesh;
        Logger.info("[gameroom][onCreate] navmesh " + options.location + " initialized.");

        // Set initial state
        this.setState(new GameRoomState(this, this.navMesh, options));

        // Register message handlers for messages from the client
        this.registerMessageHandlers();

        // Set the frequency of the patch rate
        // let's make it the same as our game loop
        this.setPatchRate(Config.updateRate);

        // Set the simulation interval callback
        // use to check stuff on the server at regular interval
        this.setSimulationInterval((dt) => {
            this.state.update(dt);
        }, Config.updateRate);

        // set max clients
        this.maxClients = Config.maxClients;

        // initialize database
        this.database = new databaseInstance();
        await this.database.initDatabase();

        ///////////////////////////////////////////////////////////////////////////
        // if players are in a room, make sure we save any changes to the database.
        this.delayedInterval = this.clock.setInterval(() => {
            // only save if there is any players
            let players = this.state.entityCTRL.filter("player");
            if (players && players.size > 0) {
                //Logger.info("[gameroom][onCreate] Saving data for room " + options.location + " with " + this.state.players.size + " players");
                players.forEach((entity) => {
                    if (entity.type === "player") {
                        // update player every second...
                        let playerClient = this.clients.getById(entity.sessionId);
                        /*
                        this.database.updateCharacter(playerClient.auth.id, entity);

                        if (saveTimer >= saveInterval) {
                            saveTimer = 0;

                            // update player items
                            if (entity.inventory && entity.inventory.size > 0) {
                                this.database.saveItems(playerClient.auth.id, entity.inventory);
                            }

                            // update player abilities
                            if (entity.abilities && entity.abilities.size > 0) {
                                this.database.saveAbilities(playerClient.auth.id, entity.abilities);
                            }
                        }
                        
                        //Logger.info("[gameroom][onCreate] player " + playerClient.auth.name + " saved to database.");
                        */
                        Logger.info("[gameroom][onCreate] player " + entity.name + " saved to database.");
                    }
                });
            }
        }, Config.databaseUpdateRate);
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // authorize client based on provided options before WebSocket handshake is complete
    async onAuth(client: Client, authData: any, request: http.IncomingMessage) {
        let character = await Auth.check(this.database, authData);
        character.AI_MODE = authData.AI_MODE ?? false;
        return character;
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // on client join
    async onJoin(client: Client, options: any) {
        this.state.addPlayer(client);
        //this.dispatcher.dispatch(new OnPlayerJoinCommand(), { client: client });
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // client message handler

    private registerMessageHandlers() {
        /////////////////////////////////////
        // on player input
        this.onMessage("ping", (client, data) => {
            client.send("pong", data);
        });

        /////////////////////////////////////
        // on player reset position
        this.onMessage("reset_position", (client, data) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            if (playerState) {
                playerState.resetPosition();
            }
        });

        this.onMessage("revive_pressed", (client, data) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            if (playerState) {
                playerState.ressurect();
            }
        });

        this.onMessage("pickup_item", (client, data) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            const itemState = this.state.getEntity(data.sessionId);
            if (playerState && itemState) {
                //playerState.setTarget(itemState);
            }
        });

        this.onMessage("learn_skill", (client, ability_key) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            const ability = dataDB.get("ability", ability_key);
            if (playerState && ability) {
                playerState.abilitiesCTRL.learnAbility(ability);
            }
        });

        this.onMessage("add_stats_point", (client, stat_key) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            if (playerState && playerState.player_data.points > 0) {
                playerState.player_data[stat_key] += 1;
                playerState.player_data.points -= 1;
            }
        });

        /////////////////////////////////////
        // on player input
        this.onMessage("playerInput", (client, playerInput: PlayerInputs) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            if (playerState) {
                playerState.moveCTRL.processPlayerInput(playerInput);
            } else {
                console.error(`Failed to retrieve Player State for ${client.sessionId}`);
            }
        });

        /////////////////////////////////////
        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {
            const playerState: PlayerSchema = this.state.getEntity(client.sessionId) as PlayerSchema;
            if (playerState) {
                // update player location in database
                let newLocation = dataDB.get("location", location);
                let updateObj = {
                    location: newLocation.key,
                    x: newLocation.spawnPoint.x,
                    y: newLocation.spawnPoint.y,
                    z: newLocation.spawnPoint.z,
                    rot: 0,
                };
                this.database.updateCharacter(client.auth.id, updateObj);

                // update player state on server
                playerState.setLocation(location);

                // inform client he cand now teleport to new zone
                client.send("playerTeleportConfirm", location);

                // log
                Logger.info(`[gameroom][playerTeleport] player teleported to ${location}`);
            } else {
                Logger.error(`[gameroom][playerTeleport] failed to teleported to ${location}`);
            }
        });

        /////////////////////////////////////
        // player entity_attack
        this.onMessage("entity_ability_key", (client, data: any) => {
            // get players involved
            let sender = this.state.getEntity(client.sessionId) as PlayerSchema;
            let target = this.state.getEntity(data.targetId) as Entity;

            if (data.digit === 5) {
                /*
                // create drops
                let sessionId = nanoid(10);
                let currentPosition = sender.getPosition();
                currentPosition.x += randomNumberInRange(0.1, 1.5);
                currentPosition.z += randomNumberInRange(0.1, 1.5);
                let data = {
                    key: "potion_heal",
                    sessionId: sessionId,
                    x: currentPosition.x,
                    y: 0.25,
                    z: currentPosition.z,
                    quantity: 1,
                };
                let entity = new LootSchema(this, data);
                this.state.items.set(sessionId, entity);
                */
            }

            if (sender && target) {
                //sender.abilitiesCTRL.processAbility(sender, target, data);
            }

            Logger.info(`[gameroom][entity_ability_key] player action processed`, data);
        });
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // when a client leaves the room
    async onLeave(client: Client, consented: boolean) {
        // remove from state
        this.state.deleteEntity(client.sessionId);

        // colyseus client leave
        client.leave();

        // set character as not online
        this.database.toggleOnlineStatus(client.auth.id, 0);

        // log
        Logger.info(`[onLeave] player ${client.auth.name} left`);
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose() {
        //log
        Logger.warning(`[onDispose] game room removed. `);
    }
}
