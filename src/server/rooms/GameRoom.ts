import http from "http";
import { Room, Client, Delayed, ServerError } from "@colyseus/core";
import {StateHandlerSchema} from './schema/StateHandlerSchema';
import databaseInstance from "../../shared/Database";
import Config from '../../shared/Config';
import Logger from "../../shared/Logger";
import loadNavMesh from "../../shared/Utils/loadNavMesh";

export class GameRoom extends Room<StateHandlerSchema> {

    public maxClients = 64;
    public autoDispose = false;
    private database: any; 
    public delayedInterval!: Delayed;

    async onCreate(options: any) {

        Logger.info("[gameroom][onCreate] game room created: "+this.roomId, options)
 
        this.setMetadata(options);

        // Set initial state
        this.setState(new StateHandlerSchema());
 
        // Set the frequency of the patch rate
        // let's make it the same as our game loop
        this.setPatchRate(Config.updateRate);

        // Set the simulation interval callback
        this.setSimulationInterval(dt => { 
            this.state.serverTime += dt; 
        });  

        // set max clients
        this.maxClients = Config.maxClients; 

        // load navmesh
        const navMesh = await loadNavMesh(options.location)
        this.state.navMesh = navMesh;
        Logger.info("[gameroom][onCreate] navmesh initialized.");

        // initialize database
        this.database = new databaseInstance();

        // if players are in a room, make sure we save any changes to the database.
        // still a bug here when the databse saves at the same times as the player move is coming 
        // to investigate
        this.delayedInterval = this.clock.setInterval(() => {
            if(this.state.players.size > 0){
                this.state.players.forEach(player => {
                    let playerClient = this.clients.hashedArray[player.sessionId];
                    this.database.updateCharacter(playerClient.auth.id, {
                        location: player.location,
                        x: player.x,
                        y: player.y,
                        z: player.z,
                        rot: player.rot,
                    });
                });
                Logger.info("[gameroom][onCreate] Saving data for room "+options.location+" with "+this.state.players.size+" players");
            }
        }, Config.databaseUpdateRate);
    }

    // authorize client based on provided options before WebSocket handshake is complete
    async onAuth (client: Client, data: any, request: http.IncomingMessage) { 
        const character = await this.database.getCharacter(data.character_id);
        if (!character) {
            Logger.error("[gameroom][onAuth] client could not authentified, joining failed.");
            return false
        }else{

            let check = await this.alreadyJoined(character.id);

            if(check){
                Logger.error("[gameroom][onAuth] client already connected. "+this.state.players.size);
                return false
            }

            Logger.info("[gameroom][onAuth] client authentified.");
            return character;
        }
    }

    // on client join
    async onJoin(client: Client, options: any) {

        // add player to server
        Logger.info(`[gameroom][onJoin] player ${client.sessionId} joined room ${this.roomId}.`, options);

        // add player using auth data
        this.state.addPlayer(client.sessionId, client.auth);
        this.database.toggleOnlineStatus(client.auth.id, 1);
        Logger.info(`[gameroom][onJoin] player added `);

        // on player input event
        this.onMessage("playerInput", (client, data: any) => {
            // calculate new position
            this.state.calculatePosition(client.sessionId, data.h, data.v, data.seq);
        });

        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {

            // update player location in database
            let newLocation = Config.locations[location];
            let updateObj = {
                location: newLocation.key,
                x: newLocation.spawnPoint.x,
                y: newLocation.spawnPoint.y,
                z: newLocation.spawnPoint.z,
                rot: 0,
            };
            this.database.updateCharacter(client.auth.id, updateObj);
            
            // update player state on server
            this.state.setPosition(client.sessionId, updateObj.x, updateObj.y, updateObj.z, 0);
            this.state.setLocation(client.sessionId, location);

            // inform client he cand now teleport to new zone
            client.send('playerTeleportConfirm', location)

            // log
            Logger.info(`[gameroom][playerTeleport] player teleported to ${location}`);
        });


    }

    // when a client leaves the room
    onLeave(client: Client) {

        // if client is found on server
        if(this.state.players.has(client.sessionId)){ 

            // log 
            Logger.info(`[onLeave] player ${client.auth.name} left`);

            // inform other clients player has quit
            this.broadcast("messages", "Player "+client.auth.name+" has left the game.");

            // remove player from state
            this.state.removePlayer(client.sessionId);
            this.database.toggleOnlineStatus(client.auth.id, 0);
        } 
    }

    // cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
     onDispose() {

        //log
        Logger.warning(`[onDispose] game room removed. `);

        // set all users as offline,
        this.database.resetCharactersTable();

    }
 

    async alreadyJoined(character_id) {
        let user = await this.database.getCharacter(character_id);
        return user.online > 0 ? true : false;
    }


}
