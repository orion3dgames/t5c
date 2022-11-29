import http from "http";
import { Room, Client, Delayed } from "@colyseus/core";
import {StateHandlerSchema} from './schema/StateHandlerSchema';

import databaseInstance from "../../shared/Database";

import Config from '../../shared/Config';
import utility from "../../shared/utiliy";
import Logger from "../../shared/Logger";

export class GameRoom extends Room<StateHandlerSchema> {

    public maxClients = 64;
    public autoDispose = false;
    private database: any;
    public delayedInterval!: Delayed;

    async onCreate(options: any) {

        Logger.info("GameRoom created: "+this.roomId, options)
 
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
        const navMesh = await utility.loadNavMesh(options.location)
        this.state.navMesh = navMesh;

        // initialize database
        this.database = new databaseInstance();

        // Set an interval and store a reference to it
        // so that we may clear it later
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

                Logger.info("Saving data for "+this.state.players.size+" players / every 5 seconds.");
            }

        }, 5000);
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    async onAuth (client: Client, data: any, request: http.IncomingMessage) { 
        const character = await this.database.getCharacter(data.character_id)
        console.log('found', character, data);
        if (character) {
            return character;
        } else {
            return false;
        }
    }

    async onJoin(client: Client, options: any) {

        console.log(options);

        // add player to server
        Logger.info(`player ${client.sessionId} joined room ${this.roomId}.`, options);

        // find player in database and set database data to player
        const user = await this.database.checkToken(options.token)
        const character = await this.database.getCharacter(options.character_id)
        this.state.addPlayer(client.sessionId, character);
        
        // on player input event
        this.onMessage("playerInput", (client, data: any) => {
            // calculate new position
            this.state.calculatePosition(client.sessionId, data.h, data.v, data.seq);
        });

        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {
            console.log("playerTeleport", client.sessionId, location);
            let newLocation = Config.locations[location];
            this.database.updateCharacter(client.auth.id, {
                location: newLocation.key,
                x: newLocation.x,
                y: newLocation.y,
                z: newLocation.z,
                rot: 0,
            });
            this.state.setLocation(client.sessionId, location);
            client.send('playerTeleportConfirm', location)
        });

    }

    // When a client leaves the room
    onLeave(client: Client) {
        if(this.state.players.has(client.sessionId)){
            this.broadcast("playerMessage", "Player "+client.sessionId+" has left the game.");
            this.state.removePlayer(client.sessionId);
        }
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
     onDispose() {
        console.log("Dispose GameRoom");
    }


    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

    

    /*
    spawnCube(cubeData: any){
        const cube = new CubeSchema(cubeData).assign(cubeData);
        this.state.cubes.set(cubeData.id, cube);
        return cube;
    }

    initializeWorld() {

        logger.silly(`*** GENERATE WORLD ***`);

        /////////////////////////////////////////////////////////
        // GENERATE MAIN WORLD
        var grid_x = 20;
        var grid_z = 20;
        for (var x = -grid_x; x <= grid_x; x++) {
            for (var z = -grid_z; z <= grid_z; z++) {
                let cubeData = {
                    id: this.generateRandomUUID(),
                    player_uid: 'SERVER',
                    x: x,
                    y: -1,
                    z: z,
                    color: '#EEEEEE',
                    type: 'crate'
                }
                this.spawnCube(cubeData);

                // ADD A BORDER TO THE MAIN WORLD
                cubeData.y = 0;
                if (z === -grid_x) { this.spawnCube(cubeData); }
                if (x === -grid_z) { this.spawnCube(cubeData); }
                if (x === grid_x) { this.spawnCube(cubeData); }
                if (z === grid_z) { this.spawnCube(cubeData); }

            }
        }   

        console.log("Generated Main World with " + (grid_x * grid_z) + " cubes ");
    }
    */


}
