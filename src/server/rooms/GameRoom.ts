import http from "http";
import { Room, Client, Delayed } from "@colyseus/core";
import { GameRoomState } from "./schema/GameRoomState";
import databaseInstance from "../../shared/Database";
import Config from "../../shared/Config";
import Logger from "../../shared/Logger";
import loadNavMeshFromFile from "../../shared/Utils/loadNavMeshFromFile";
import { PlayerState } from "./schema/PlayerState";
import { PlayerInputs } from "../../shared/types";
import { NavMesh } from "../../shared/yuka";
import LocationsDB from "../../shared/Data/LocationsDB";
import { nanoid } from "nanoid";
import { randomNumberInRange } from "../../shared/Utils";
import { ItemState } from "./schema/ItemState";

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
            if (this.state.players.size > 0) {
                //Logger.info("[gameroom][onCreate] Saving data for room " + options.location + " with " + this.state.players.size + " players");
                this.state.players.forEach((entity) => {
                    // update player
                    let playerClient = this.clients.hashedArray[entity.sessionId];
                    this.database.updateCharacter(playerClient.auth.id, entity);
                    //Logger.info("[gameroom][onCreate] player " + playerClient.auth.name + " saved to database.");
                });
            }
        }, Config.databaseUpdateRate);
    }

    public onBeforePatch(state) {}

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // authorize client based on provided options before WebSocket handshake is complete
    async onAuth(client: Client, data: any, request: http.IncomingMessage) {
        // try to find char
        const character = await this.database.getCharacter(data.character_id);

        // if no character found, then refuse auth
        if (!character) {
            Logger.error("[gameroom][onAuth] client could not authentified, joining failed.", data.character_id);
            return false;
        }

        // character found, check if already logged in
        if (character.online > 0) {
            Logger.error("[gameroom][onAuth] client already connected. ", character);
            return false;
        }

        // all checks are good, proceed
        Logger.info("[gameroom][onAuth] client authentified.", character);
        return character;
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // on client join
    async onJoin(client: Client, options: any) {
        // add player to server
        Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${this.roomId}.`, options);

        // add player using auth data
        this.state.addPlayer(client.sessionId, client.auth);
        this.database.toggleOnlineStatus(client.auth.id, 1);
        Logger.info(`[gameroom][onJoin] player added `);
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
            const playerState: PlayerState = this.state.players.get(client.sessionId);
            if (playerState) {
                playerState.resetPosition();
            }
        });

        this.onMessage("revive_pressed", (client, data) => {
            const playerState: PlayerState = this.state.players.get(client.sessionId);
            if (playerState) {
                playerState.ressurect();
            }
        });

        /////////////////////////////////////
        // on player input
        this.onMessage("playerInput", (client, playerInput: PlayerInputs) => {
            const playerState: PlayerState = this.state.players.get(client.sessionId);
            if (playerState) {
                playerState.moveCTRL.processPlayerInput(playerInput);
            } else {
                console.error(`Failed to retrieve Player State for ${client.sessionId}`);
            }
        });

        /////////////////////////////////////
        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {
            const playerState: PlayerState = this.state.players.get(client.sessionId);

            if (playerState) {
                // update player location in database
                let newLocation = Locations[location];
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
            let sender: PlayerState = this.state.players[client.sessionId];
            let target = this.state.entities[data.targetId];

            if (!target) {
                target = this.state.players[data.targetId];
            }

            if (data.digit === 5) {
                // create drops
                let sessionId = nanoid();
                let currentPosition = sender.getPosition();
                currentPosition.x += randomNumberInRange(0.1, 1.5);
                currentPosition.z += randomNumberInRange(0.1, 1.5);
                let data = {
                    key: "apple",
                    name: "Apple",
                    sessionId: sessionId,
                    x: currentPosition.x,
                    y: 0.25,
                    z: currentPosition.z,
                };
                let entity = new ItemState(this, data);
                this.state.items.set(sessionId, entity);
            }

            if (sender && target) {
                sender.abilitiesCTRL.processAbility(sender, target, data);
            }

            Logger.info(`[gameroom][entity_ability_key] player action processed`, data);
        });

        /////////////////////////////////////
        // player move to
        /*
        this.onMessage("player_moveTo", (client, data: any) => {

            // get players involved
            let player:PlayerState = this.state.players[client.sessionId];
           
            if(!player) throw new Error('sender does not exists!');

            // set destination
            let from = new Vector3(player.x, player.y, player.z);
            let destination = new Vector3(data.to._x, data.to._y, data.to._z);
            player.toRegion = this.navMesh.getClosestRegion( destination );
            player.destinationPath = this.navMesh.findPath(from, destination);

        });*/
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // when a client leaves the room
    async onLeave(client: Client, consented: boolean) {
        /*
		try {
			if (consented) {
				throw new Error('consented leave!');
			}

			//throw new Error('DEBUG force no reconnection check');

			console.log("let's wait for reconnection for client: " + client.sessionId);
			const newClient: Client = await this.allowReconnection(client, 3);
			console.log('reconnected! client: ' + newClient.sessionId);

		} catch (e) {
			Logger.info(`[onLeave] player ${client.auth.name} left`);

			this.state.players.delete(client.sessionId);
            this.database.toggleOnlineStatus(client.auth.id, 0);
		}
        */

        Logger.info(`[onLeave] player ${client.auth.name} left`);

        this.state.players.delete(client.sessionId);
        client.leave();
        this.database.toggleOnlineStatus(client.auth.id, 0);
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
